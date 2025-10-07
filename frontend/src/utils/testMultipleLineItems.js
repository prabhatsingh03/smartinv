export function makeLineItem(partial = {}) {
    return {
        Line_Item: '',
        HSN_SAC: '',
        gst_percent: undefined,
        Basic_Amount: undefined,
        IGST_Amount: undefined,
        CGST_Amount: undefined,
        SGST_Amount: undefined,
        Total_Amount: undefined,
        ...partial
    };
}
export function makeInvoiceWithItems(items, partial = {}) {
    return {
        id: 1,
        status: 'UPLOADED',
        Vendor_Name: 'Test Vendor',
        Invoice_Number: 'INV-TEST',
        line_items: items,
        ...partial
    };
}
export function pickCardChips(it) {
    return {
        title: it.Line_Item || 'Item',
        basic: it.Basic_Amount,
        gstPercent: it.gst_percent,
        hsn: it.HSN_SAC,
        igst: it.IGST_Amount,
        cgst: it.CGST_Amount,
        sgst: it.SGST_Amount
    };
}
