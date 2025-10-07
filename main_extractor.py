import os
import pandas as pd
from typing import Dict, List, Any
from dateutil import parser
import datetime

from required_fields import REQUIRED_FIELDS
from text_extractor import extract_text
from llm_fallback import extract_with_llm

SUPPORTED_EXTS = [".pdf"]

# Create a error file per run
ERROR_LOG_FILE = os.path.join("../outputs/errors", "error.log")
os.makedirs(os.path.dirname(ERROR_LOG_FILE), exist_ok=True)

def log_error(file_name: str, error_type: str, message: str):
    """
    Save all error messages into one log file (overwritten each run).
    """
    with open(ERROR_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{error_type}] {file_name}: {message}\n")


# Simon India PAN (replace with actual)
SIMON_PAN = "AAECS5013J"

def normalize_date(date_str: str) -> str:
    try:
        return parser.parse(date_str, dayfirst=False).strftime("%Y-%m-%d")
    except Exception:
        return date_str or ""

def validate_invoice_number(inv: str) -> str:
    if not inv:
        return ""
    inv = inv.strip()
    if len(inv.split()) > 3:  # too long
        return ""
    if inv.isalpha():  # only letters
        return ""
    return inv

#part of code to replace ocr mistake 
def correct_gst_ocr(gst: str) -> str:

    #checking if provided gst length is less than 12
    if not gst:
        return ""
    gst = gst.strip().upper()
    if len(gst) < 12:
        # too short for corrections, just return as-is
        return gst
        
    # Correction maps
    letter_corrections = {
        "5": "S", "8": "B", "2": "Z",
        "0": "O", "1": "I", "6": "G"
    }
    digit_corrections = {
        "S": "5", "B": "8", "Z": "2",
        "O": "0", "I": "1", "L": "1", "G": "6"
    }

    gst = list(gst)  # make string editable
    
    # 1st–2nd digit in gst → must be digits (01–37 as state code), fix OCR if needed
    for i in range(0, 2):
        if gst[i] in digit_corrections:
            gst[i] = digit_corrections[gst[i]]

    

    # 3rd to 7th (letters expected)
    for i in range(2, 7):
        if gst[i] in letter_corrections:
            gst[i] = letter_corrections[gst[i]]

    # 8th to 11th (digits expected)
    for i in range(7, 11):
        if gst[i] in digit_corrections:
            gst[i] = digit_corrections[gst[i]]

    # 12th (letter expected)
    if gst[11] in letter_corrections:
        gst[11] = letter_corrections[gst[11]]

    return "".join(gst)



def validate_gst_number(gst: str) -> str:
    """
    Strict GST validation.
    Returns "" if GST is invalid or belongs to Simon India.
    """
    if not gst:
        return ""

    gst = gst.strip().upper()
    gst = correct_gst_ocr(gst)
    
    # Check state code is between 01 and 37
    try:
        state_code = int(gst[0:2])
        if not (1 <= state_code <= 37):
            return ""
    except ValueError:
        return ""



    # Must be exactly 15 characters
    if len(gst) != 15:
        return ""

    # Force 14th character to 'Z'
    gst = gst[:13] + "Z" + gst[14:]

    if not gst[0:2].isdigit(): return ""
    if not gst[2:7].isalpha(): return ""
    if not gst[7:11].isdigit(): return ""
    if not gst[11].isalpha(): return ""
    # index 12 = entity code (alphanumeric, allowed)
    if not gst[14].isalnum(): return ""

    # Exclude Simon India GST (same PAN)
    pan = gst[2:12]
    if pan == SIMON_PAN:
        return ""

    return gst

def process_pdf(file_path: str, model: str = "gpt-4o-mini", use_ocr: bool = True) -> tuple[List[Dict[str, Any]], str]:
    try:
        full_text, used_ocr, _ = extract_text(file_path, use_ocr=use_ocr)
        raw = extract_with_llm(REQUIRED_FIELDS, full_text, model=model)

        base = {k: raw.get(k, None) for k in REQUIRED_FIELDS}
        base["filename"] = os.path.basename(file_path)

        # ensure PO_Number is present (None if missing)
        if "PO_Number" not in base:
            base["PO_Number"] = None

        line_items = raw.get("Line_Items", None)
        rows: List[Dict[str, Any]] = []

        if isinstance(line_items, list) and len(line_items) > 0:
            for item in line_items:
                row = base.copy()
                row["Line_Item"]    = item.get("Line_Item") or base.get("Line_Item")
                #checking if hsn_sac value contain character assigning it blank vaue
                hsn_val = item.get("HSN_SAC") or base.get("HSN_SAC")
                if hsn_val and str(hsn_val).isdigit():
                    row["HSN_SAC"] = str(hsn_val)
                else:
                    row["HSN_SAC"] = ""

                row["gst_percent"]  = item.get("gst_percent") or base.get("gst_percent")
                row["Basic_Amount"] = item.get("Basic_Amount") or base.get("Basic_Amount")
                row["CGST_Amount"]  = item.get("CGST_Amount") or base.get("CGST_Amount")
                row["SGST_Amount"]  = item.get("SGST_Amount") or base.get("SGST_Amount")
                row["IGST_Amount"]  = item.get("IGST_Amount") or base.get("IGST_Amount")
                row["Total_Amount"] = item.get("Total_Amount") or base.get("Total_Amount")

                # Post-processing
                row["Invoice_Date"] = normalize_date(row.get("Invoice_Date"))
                row["Invoice_Number"] = validate_invoice_number(row.get("Invoice_Number"))
                row["GST_Number"] = validate_gst_number(row.get("GST_Number"))

                # Leave blank
                row["TDS"] = ""
                row["Net_Payable"] = ""

                rows.append(row)
        else:
            row = base.copy()
            # checking if hsn_sac value contains only digits, otherwise blank
            hsn_val = row.get("HSN_SAC")
            if hsn_val and str(hsn_val).isdigit():
                row["HSN_SAC"] = str(hsn_val)
            else:
                row["HSN_SAC"] = ""
            row["Invoice_Date"] = normalize_date(row.get("Invoice_Date"))
            row["Invoice_Number"] = validate_invoice_number(row.get("Invoice_Number"))
            row["GST_Number"] = validate_gst_number(row.get("GST_Number"))
            row["TDS"] = ""
            row["Net_Payable"] = ""
            rows.append(row)


        return rows, full_text

    except Exception as e:
        log_error(os.path.basename(file_path), "process_pdf", str(e))
        raise

def process_folder(input_folder: str, model: str = "gpt-4o-mini", use_ocr: bool = True) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    for name in sorted(os.listdir(input_folder)):
        path = os.path.join(input_folder, name)
        if not os.path.isfile(path): continue
        if os.path.splitext(name)[1].lower() not in SUPPORTED_EXTS: continue
        try:
            recs, _ = process_pdf(path, model=model, use_ocr=use_ocr)
            results.extend(recs)
            print(f" Processed: {name} ({len(recs)} rows)")
        except Exception as e:
            msg = str(e)
            print(f" Failed to process {name}: {msg}")
            log_error(name, "process_folder", msg)
    return results

def save_to_excel(records: List[Dict[str, Any]], out_excel: str = "../outputs/invoices.xlsx"):
    os.makedirs(os.path.dirname(out_excel), exist_ok=True)
    for i, rec in enumerate(records, start=1):
        rec["S_No"] = i
    df = pd.DataFrame(records, columns=REQUIRED_FIELDS)
    df.to_excel(out_excel, index=False)
    print(f" Saved {len(records)} rows to {out_excel}")

if __name__ == "__main__":
    # overwrite on each run
    open(ERROR_LOG_FILE, "w").close()
    
    import argparse
    parser = argparse.ArgumentParser(description="LLM invoice extractor → Excel (one row per line item)")
    parser.add_argument("input", help="PDF file or folder")
    parser.add_argument("--out-excel", default="outputs/invoices.xlsx")
    parser.add_argument("--model", default="gpt-4o-mini")
    args = parser.parse_args()
    
    all_rows: List[Dict[str, Any]] = []
    if os.path.isdir(args.input):
        all_rows.extend(process_folder(args.input, model=args.model))
    else:
        recs, _ = process_pdf(args.input, model=args.model, use_ocr=True)
        all_rows.extend(recs)

    if all_rows:
        save_to_excel(all_rows)
