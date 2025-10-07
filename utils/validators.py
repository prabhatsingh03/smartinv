import re
from datetime import datetime
from dateutil import parser
import os
from typing import Tuple, Optional

def validate_email(email: str) -> bool:
    """Validate email format."""
    if not email:
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> Tuple[bool, str]:
    """Validate password strength."""
    if not password:
        return False, "Password is required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, "Password is valid"

def validate_invoice_number(invoice_number: str) -> str:
    """Validate and clean invoice number."""
    if not invoice_number:
        return ""
    
    invoice_number = invoice_number.strip()
    
    # Too long (more than 3 words)
    if len(invoice_number.split()) > 3:
        return ""
    
    # Only letters
    if invoice_number.isalpha():
        return ""
    
    return invoice_number

def correct_gst_ocr(gst: str) -> str:
    """Correct common OCR mistakes in GST number."""
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

def validate_gst_number(gst: str, simon_pan: str = "AAECS5013J") -> str:
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

    if not gst[0:2].isdigit(): 
        return ""
    if not gst[2:7].isalpha(): 
        return ""
    if not gst[7:11].isdigit(): 
        return ""
    if not gst[11].isalpha(): 
        return ""
    # index 12 = entity code (alphanumeric, allowed)
    if not gst[14].isalnum(): 
        return ""

    # Exclude Simon India GST (same PAN)
    pan = gst[2:12]
    if pan == simon_pan:
        return ""

    return gst

def validate_date(date_str: str) -> Optional[str]:
    """Validate and normalize date string."""
    if not date_str:
        return None
    
    try:
        # Try to parse the date
        parsed_date = parser.parse(date_str, dayfirst=False)
        return parsed_date.strftime("%Y-%m-%d")
    except Exception:
        return None

def validate_amount(amount: str) -> Optional[float]:
    """Validate and convert amount string to float."""
    if not amount:
        return None
    
    try:
        # Remove common currency symbols and commas
        cleaned = re.sub(r'[^\d.-]', '', str(amount))
        return float(cleaned)
    except (ValueError, TypeError):
        return None

def validate_percentage(percentage: str) -> Optional[float]:
    """Validate and convert percentage string to float."""
    if not percentage:
        return None
    
    try:
        # Remove % symbol and convert to float
        cleaned = re.sub(r'[^\d.-]', '', str(percentage))
        value = float(cleaned)
        
        # Check if it's a reasonable percentage (0-100)
        if 0 <= value <= 100:
            return value
        return None
    except (ValueError, TypeError):
        return None

def validate_hsn_sac(hsn_sac: str) -> str:
    """Validate HSN/SAC code."""
    if not hsn_sac:
        return ""
    
    hsn_sac = str(hsn_sac).strip()
    
    # Check if it contains only digits
    if hsn_sac.isdigit():
        return hsn_sac
    
    return ""

def validate_file_upload(file, allowed_extensions=None, max_size_mb=16):
    """Validate file upload."""
    if not file:
        return False, "No file provided"
    
    if allowed_extensions is None:
        allowed_extensions = {'pdf', 'png', 'jpg', 'jpeg', 'tiff'}
    
    # Check file extension
    if '.' not in file.filename:
        return False, "File must have an extension"
    
    file_ext = file.filename.rsplit('.', 1)[1].lower()
    if file_ext not in allowed_extensions:
        return False, f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
    
    # Check file size
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset to beginning
    
    max_size_bytes = max_size_mb * 1024 * 1024
    if file_size > max_size_bytes:
        return False, f"File too large. Maximum size: {max_size_mb}MB"
    
    return True, "File is valid"

def validate_required_fields(data: dict, required_fields: list) -> Tuple[bool, list]:
    """Validate that all required fields are present in data."""
    missing_fields = []
    
    for field in required_fields:
        if field not in data or not data[field]:
            missing_fields.append(field)
    
    return len(missing_fields) == 0, missing_fields

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage."""
    if not filename:
        return "untitled"
    
    # Remove or replace unsafe characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    
    # Remove leading/trailing spaces and dots
    filename = filename.strip(' .')
    
    # Ensure filename is not empty
    if not filename:
        filename = "untitled"
    
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:255-len(ext)] + ext
    
    return filename

def validate_pagination_params(page: int, per_page: int, max_per_page: int = 100) -> Tuple[int, int]:
    """Validate pagination parameters."""
    page = max(1, page) if page else 1
    per_page = max(1, min(per_page, max_per_page)) if per_page else 20
    return page, per_page

def validate_search_query(query: str, min_length: int = 2) -> str:
    """Validate and clean search query."""
    if not query:
        return ""
    
    query = query.strip()
    
    # Remove special characters that might cause issues
    query = re.sub(r'[^\w\s-]', '', query)
    
    # Check minimum length
    if len(query) < min_length:
        return ""
    
    return query
