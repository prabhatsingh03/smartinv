import { format } from 'date-fns';
export function formatCurrency(value, currency = 'INR') {
    if (value === undefined || value === null || value === '')
        return '';
    const num = Number(value);
    if (Number.isNaN(num))
        return String(value);
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(num);
}
export function formatIsoDate(value, fallback = '') {
    if (!value)
        return fallback;
    const time = Date.parse(value);
    if (Number.isNaN(time))
        return fallback;
    try {
        return format(new Date(time), 'yyyy-MM-dd');
    }
    catch {
        return fallback;
    }
}
export function toNumberOrUndefined(value) {
    if (value === undefined || value === null || value === '')
        return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
}
export function parseApiToForm(obj) {
    const copy = { ...obj };
    if (copy.Invoice_Date) {
        copy.Invoice_Date = formatIsoDate(copy.Invoice_Date, '');
    }
    return copy;
}
export function parseFormToApi(obj) {
    const copy = { ...obj };
    // Convert date to ISO string
    if (copy.Invoice_Date) {
        const d = new Date(copy.Invoice_Date);
        if (!Number.isNaN(d.getTime())) {
            copy.Invoice_Date = d.toISOString();
        }
    }
    // Convert uppercase field names to lowercase as expected by backend
    const fieldMapping = {
        'Invoice_Date': 'invoice_date',
        'Invoice_Number': 'invoice_number',
        'PO_Number': 'po_number',
        'GST_Number': 'gst_number',
        'Vendor_Name': 'vendor_name',
        'Line_Item': 'line_item',
        'HSN_SAC': 'hsn_sac',
        'IGST_Amount': 'igst_amount',
        'CGST_Amount': 'cgst_amount',
        'SGST_Amount': 'sgst_amount',
        'Basic_Amount': 'basic_amount',
        'Total_Amount': 'total_amount',
        'TDS': 'tds',
        'Net_Payable': 'net_payable',
        'S_No': 's_no'
    };
    // Apply field name mapping
    for (const [upperKey, lowerKey] of Object.entries(fieldMapping)) {
        if (upperKey in copy) {
            copy[lowerKey] = copy[upperKey];
            delete copy[upperKey];
        }
    }
    // Convert numeric fields
    const numericKeys = [
        'gst_percent',
        'igst_amount',
        'cgst_amount',
        'sgst_amount',
        'basic_amount',
        'total_amount',
        'tds',
        'net_payable'
    ];
    for (const key of numericKeys) {
        if (key in copy && copy[key] !== undefined && copy[key] !== null && copy[key] !== '') {
            const n = Number(copy[key]);
            if (!Number.isNaN(n))
                copy[key] = n;
        }
    }
    return copy;
}
