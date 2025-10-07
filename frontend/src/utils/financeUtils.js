export function formatCurrency(value) {
    const n = typeof value === 'string' ? Number(value) : value;
    if (n === undefined || n === null || Number.isNaN(n))
        return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
}
export function formatDate(iso) {
    if (!iso)
        return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return '-';
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
}
export function computeGstSummary(inv) {
    const percent = inv?.gst_percent ?? '-';
    const igst = Number(inv?.IGST_Amount || 0);
    const cgst = Number(inv?.CGST_Amount || 0);
    const sgst = Number(inv?.SGST_Amount || 0);
    const total = igst + cgst + sgst;
    const taxable = Number(inv?.Basic_Amount || 0);
    const grandTotal = Number(inv?.Total_Amount || taxable + total);
    return { percent, total, taxable, grandTotal };
}
export function calculatePriorityFromAmount(amount) {
    const n = Number(amount || 0);
    if (n >= 500000)
        return 'high';
    if (n >= 100000)
        return 'medium';
    return 'low';
}
export function determinePriority(inv) {
    const dbPriority = inv?.priority;
    if (dbPriority === 'low' || dbPriority === 'medium' || dbPriority === 'high')
        return dbPriority;
    return calculatePriorityFromAmount(inv?.Total_Amount);
}
export function formatPriority(p) {
    if (!p)
        return 'LOW';
    return String(p).toUpperCase();
}
export function toCsv(rows) {
    if (!rows.length)
        return '';
    const headers = Object.keys(rows[0]);
    const escape = (v) => {
        if (v === null || v === undefined)
            return '';
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
    };
    const body = rows.map((r) => headers.map((h) => escape(r[h])).join(',')).join('\n');
    return `${headers.join(',')}\n${body}`;
}
