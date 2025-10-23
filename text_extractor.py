import os
from typing import Tuple
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import datetime
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass

# Local error logger (independent of main_extractor)
ERROR_LOG_FILE = os.path.join("../outputs/errors", "error.log")
os.makedirs(os.path.dirname(ERROR_LOG_FILE), exist_ok=True)

def log_error(file_name: str, error_type: str, message: str):
    with open(ERROR_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{error_type}] {file_name}: {message}\n")


SUPPORTED_EXTS = [".pdf"]
def _configure_tesseract_from_env() -> None:
    """Configure pytesseract path from environment if provided.

    Recognized vars (first found is used):
    - TESSERACT_CMD
    - TESSERACT_PATH
    - TESSERACT_EXE
    """
    cmd = (
        os.environ.get("TESSERACT_CMD")
        or os.environ.get("TESSERACT_PATH")
        or os.environ.get("TESSERACT_EXE")
    )
    if cmd:
        try:
            if os.path.isfile(cmd):
                pytesseract.pytesseract.tesseract_cmd = cmd
            else:
                # Log but continue; pytesseract may still find it via PATH
                log_error("text_extractor", "tesseract_config", f"Provided path does not exist: {cmd}")
        except Exception as e:
            log_error("text_extractor", "tesseract_config", f"Failed to set tesseract_cmd: {e}")


_configure_tesseract_from_env()

def get_configured_tesseract_cmd() -> str:
    """Return the currently configured tesseract command for debugging."""
    try:
        return getattr(pytesseract.pytesseract, "tesseract_cmd", "") or ""
    except Exception:
        return ""


def is_supported(ext: str) -> bool:
    return ext.lower() in SUPPORTED_EXTS

def _ocr_pixmap(page) -> str:
    zoom = 3.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    return pytesseract.image_to_string(img)

def extract_text(file_path: str, use_ocr: bool = True, save_text_dir: str = "../outputs/text") -> Tuple[str, bool, str]:
    try:
        if not is_supported(os.path.splitext(file_path)[1]):
            raise ValueError("Only PDF files are supported by text_extractor.")

        os.makedirs(save_text_dir, exist_ok=True)

        text = []
        used_ocr_any = False

        with fitz.open(file_path) as doc:
            for page in doc:
                raw_text = page.get_text("text") or ""
                ocr_text = _ocr_pixmap(page) if use_ocr else ""

                # Prefer OCR if it's more complete
                if use_ocr and len(ocr_text.strip()) > len(raw_text.strip()):
                    page_text = ocr_text
                    used_ocr_any = True
                else:
                    page_text = raw_text

                text.append(page_text)

        full_text = "\n".join(text)

        base = os.path.splitext(os.path.basename(file_path))[0]
        saved_path = os.path.join(save_text_dir, f"{base}.txt")
        with open(saved_path, "w", encoding="utf-8") as f:
            f.write(full_text)

        return full_text, used_ocr_any, saved_path

    except Exception as e:
        log_error(os.path.basename(file_path), "text_extractor", str(e))
        raise