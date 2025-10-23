import type { InvoiceFormValues, ValidationErrorMap } from '@types';

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

export function validateGstNumber(value?: string): string | undefined {
  if (!value || value.trim() === '') return undefined; // Make GST number optional
  const v = value.trim();
  if (!GST_REGEX.test(v)) return 'Invalid GST number format';
  return undefined;
}

export function validateDateIso(value?: string): string | undefined {
  if (!value) return 'Date is required';
  const time = Date.parse(value);
  if (Number.isNaN(time)) return 'Invalid date';
  return undefined;
}

export function validateRequiredString(value?: string, label = 'Field'): string | undefined {
  if (!value || !value.toString().trim()) return `${label} is required`;
  return undefined;
}

export function validateNumber(value: unknown, label = 'Field'): string | undefined {
  if (value === undefined || value === null || value === '') return undefined; // Make financial fields optional
  const num = Number(value);
  if (Number.isNaN(num)) return `${label} must be a number`;
  return undefined;
}

export function validateNonNegative(value: unknown, label = 'Field'): string | undefined {
  const err = validateNumber(value, label);
  if (err) return err;
  if (Number(value) < 0) return `${label} cannot be negative`;
  return undefined;
}

export function validateOptionalNonNegative(value: unknown, label = 'Field'): string | undefined {
  if (value === undefined || value === null || value === '') return undefined; // Make optional
  const err = validateNumber(value, label);
  if (err) return err;
  if (Number(value) < 0) return `${label} cannot be negative`;
  return undefined;
}

export function validateInvoice(values: InvoiceFormValues): ValidationErrorMap {
  const errors: ValidationErrorMap = {};
  // Strings required
  errors.Line_Item = validateRequiredString(values.Line_Item, 'Line item');
  errors.HSN_SAC = validateRequiredString(values.HSN_SAC, 'HSN/SAC');
  errors.Invoice_Number = validateRequiredString(values.Invoice_Number, 'Invoice number');
  // Vendor_Name is now optional - only validate if provided
  if (values.Vendor_Name && values.Vendor_Name.trim() !== '') {
    // Optional validation for vendor name if provided
  }
  errors.GST_Number = validateGstNumber(values.GST_Number);
  errors.filename = validateRequiredString(values.filename, 'Filename');

  // Date required ISO
  errors.Invoice_Date = validateDateIso(values.Invoice_Date);

  // Numeric validation
  errors.gst_percent = validateNonNegative(values.gst_percent, 'GST %');
  // Financial details are optional - only validate if provided
  errors.IGST_Amount = validateOptionalNonNegative(values.IGST_Amount, 'IGST amount');
  errors.CGST_Amount = validateOptionalNonNegative(values.CGST_Amount, 'CGST amount');
  errors.SGST_Amount = validateOptionalNonNegative(values.SGST_Amount, 'SGST amount');
  errors.Basic_Amount = validateOptionalNonNegative(values.Basic_Amount, 'Basic amount');
  errors.Total_Amount = validateOptionalNonNegative(values.Total_Amount, 'Total amount');
  errors.TDS = validateOptionalNonNegative(values.TDS, 'TDS');
  errors.Net_Payable = validateOptionalNonNegative(values.Net_Payable, 'Net payable');

  // S_No optional - only validate if provided
  if (values.S_No !== undefined && values.S_No !== null && String(values.S_No).toString().trim() !== '') {
    // S_No is provided, no additional validation needed
  }
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => !!v));
}


