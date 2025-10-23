import os
import json
from typing import Dict, List, Any
from openai import OpenAI

DEFAULT_MODEL = "gpt-4o-mini"

def _load_api_key(file_path: str = "openai_api_key.txt") -> str:
    try:
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                key = f.read().strip()
                if key:
                    return key
        key = os.getenv("OPENAI_API_KEY", "").strip()
        if not key:
            raise RuntimeError(
                "OpenAI API key not found. Place it in 'openai_api_key.txt' or set OPENAI_API_KEY env var."
            )
        return key
    except Exception as e:
        raise RuntimeError(f"Error loading API key: {e}")

def _make_client() -> OpenAI:
    return OpenAI(api_key=_load_api_key())

def _build_system_prompt(required_fields: List[str]) -> str:
    return (
        "You are an invoice extraction assistant.\n"
        "Return STRICT minified JSON (no markdown, no code fences).\n"
	"do not return simon india company name as vendor.\n"
        "Top-level keys: only those in the 'Fields' list (omit keys you cannot find) "
        "PLUS an optional key 'Line_Items' when there are line items.\n"
        "Field mapping rules:\n"
        "- If you see 'Billing No', 'Bill No', 'Tax Invoice', or 'Tax Invoice No', map them to 'Invoice_Number'.\n"
        "If there are line items, return:\n"
        "  \"Line_Items\": [\n"
        "     {\"Line_Item\": <string>, \"HSN_SAC\": <string>, \"gst_percent\": <string or number>, "
        "      \"Basic_Amount\": <string or number>, "
        "      \"CGST_Amount\": <string or number>, "
        "      \"SGST_Amount\": <string or number>, "
        "      \"IGST_Amount\": <string or number>, "
        "      \"Total_Amount\": <string or number>}, ...\n"
        "  ]\n"
        "Never invent values. If a particular tax (CGST/SGST/IGST) is not present, omit it.\n"
        "For any field not present or not confidently identifiable, OMIT the key entirely.\n"
    	"Note: Sometimes HSN or SAC is written in full form as 'Services Accounting Code' or 'Harmonized System of Nomenclature'. "
    	"Always map such values to the field 'HSN_SAC' only.\n"
        "Invoice calculation rules (must always be respected):\n"
        "- 'Basic_Amount' must never be greater than 'Total_Amount'. (omit taxes if not present).\n\n"
        "- 'Total_Amount' should equal 'Basic_Amount' + CGST_Amount + SGST_Amount + IGST_Amount "
          "(omit taxes if not present).\n"
        "- If GST amounts are present, ensure they are consistent with 'gst_percent'.\n"
        "- 'gst_percent' should match the ratio of total GST (CGST+SGST+IGST) over Basic_Amount.\n"
        "- If any inconsistency is found, omit the incorrect field instead of inventing values.\n"
        "Special handling of GST numbers:\n"
        "  - Be aware that OCR/extraction mistakes may occur.\n"
        "  - A valid GSTIN must follow the pattern: "
        "    2 digits (state code) + 10-character PAN + 1 entity code (0–9/A–Z) + 'Z' + 1 check digit.\n"
        "  - If multiple GSTINs are present, discard any containing 'AAECS5013J'.\n"
        "- If PO number / purchase order number is present, map it to 'PO_Number'.\n"
        "- Never invent a PO number. If not explicitly present in the text, omit 'PO_Number'.\n"
        f"Fields: {', '.join(required_fields)}"
    )

def _safe_parse_json(s: str) -> Dict[str, Any]:
    s = s.strip()
    try:
        obj = json.loads(s)
        if isinstance(obj, dict):
            return obj
    except Exception:
        pass
    start = s.find("{"); end = s.rfind("}")
    if start != -1 and end != -1 and end > start:
        cand = s[start:end+1]
        try:
            obj = json.loads(cand)
            if isinstance(obj, dict):
                return obj
        except Exception:
            pass
    return {}

def _coerce_scalar(x):
    if isinstance(x, (str, int, float, bool)):
        return str(x).strip()
    return None

def _normalize_line_items(li_val) -> List[Dict[str, str]]:
    """
    Normalize various shapes into a list[dict] with known keys.
    """
    normalized = []
    if isinstance(li_val, list):
        for elem in li_val:
            if isinstance(elem, dict):
                normalized.append({
                    "Line_Item": _coerce_scalar(elem.get("Line_Item")) or _coerce_scalar(elem.get("Description")),
                    "HSN_SAC": _coerce_scalar(elem.get("HSN_SAC")),
                    "gst_percent": _coerce_scalar(elem.get("gst_percent")),
                    "Basic_Amount": _coerce_scalar(elem.get("Basic_Amount")),
                    "CGST_Amount": _coerce_scalar(elem.get("CGST_Amount")),
                    "SGST_Amount": _coerce_scalar(elem.get("SGST_Amount")),
                    "IGST_Amount": _coerce_scalar(elem.get("IGST_Amount")),
                    "Total_Amount": _coerce_scalar(elem.get("Total_Amount")),
                })
            else:
                normalized.append({
                    "Line_Item": _coerce_scalar(elem),
                    "HSN_SAC": None,
                    "gst_percent": None,
                    "Basic_Amount": None,
                    "Total_Amount": None,
                })
    elif li_val is not None:
        normalized.append({
            "Line_Item": _coerce_scalar(li_val),
            "HSN_SAC": None,
            "gst_percent": None,
            "Basic_Amount": None,
            "Total_Amount": None,
        })
    # drop empty dicts
    out = []
    for d in normalized:
        if any(v for v in d.values()):
            out.append(d)
    return out

def extract_with_llm(required_fields: List[str], invoice_text: str, model: str = DEFAULT_MODEL) -> Dict[str, Any]:
    client = _make_client()
    system_prompt = _build_system_prompt(required_fields)

    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": system_prompt},
                  {"role": "user", "content": invoice_text}],
        max_tokens=1200,
        temperature=0.0,
    )

    content = resp.choices[0].message.content if resp and resp.choices else "{}"
    raw = _safe_parse_json(content)

    out: Dict[str, Any] = {}
    for k in required_fields:
        if k in raw and raw[k] is not None:
            v = _coerce_scalar(raw[k])
            if v is not None:
                out[k] = v

    if "Line_Items" in raw:
        out["Line_Items"] = _normalize_line_items(raw["Line_Items"])
    else:
        if "Line_Item" in out and out["Line_Item"]:
            out["Line_Items"] = _normalize_line_items([out["Line_Item"]])

    return out
