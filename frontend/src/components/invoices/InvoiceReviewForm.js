import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Grid, Paper, Stack, Typography, Divider, Chip, Button, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Alert } from '@mui/material';
import { formatCurrency, formatDate, computeGstSummary } from '@utils/financeUtils';
import { downloadInvoiceFile, getInvoiceAuditLogs } from '@services/apiService';
import { useAppSelector } from '@hooks/index';
import { getCurrentUserRole, getCurrentUserId } from '@utils/auth';
export default function InvoiceReviewForm({ invoice }) {
    const gst = useMemo(() => computeGstSummary(invoice), [invoice]);
    const { authenticated } = useAppSelector((s) => s.auth);
    const role = getCurrentUserRole();
    const userId = getCurrentUserId();
    const isFinance = role === 'FINANCE' || role === 'SUPER_ADMIN';
    const isUploader = String(userId || '') === String(invoice?.uploaded_by || '');
    const [diffs, setDiffs] = useState(null);
    const [diffError, setDiffError] = useState(null);
    useEffect(() => {
        let mounted = true;
        async function fetchDiff() {
            try {
                setDiffError(null);
                setDiffs(null);
                if (!invoice?.id)
                    return;
                // Only show to original uploader (non-finance)
                if (!isUploader || isFinance)
                    return;
                const res = await getInvoiceAuditLogs(Number(invoice.id));
                const logs = (res?.data?.logs ?? res?.logs) || [];
                // Find the latest edit with old/new values
                const latest = logs.find((l) => l?.action === 'edited' && (l?.old_values || l?.new_values)) || logs.find((l) => (l?.old_values || l?.new_values));
                if (!latest)
                    return;
                const oldRaw = safeParse(latest.old_values);
                const newRaw = safeParse(latest.new_values);
                if (!oldRaw || !newRaw)
                    return;
                const oldFlat = flattenInvoiceDict(oldRaw);
                const newFlat = flattenInvoiceDict(newRaw);
                const fieldsOfInterest = [
                    'Invoice_Number', 'Invoice_Date', 'GST_Number', 'Vendor_Name', 'Line_Item', 'HSN_SAC', 'gst_percent',
                    'IGST_Amount', 'CGST_Amount', 'SGST_Amount', 'Basic_Amount', 'Total_Amount', 'TDS', 'Net_Payable', 'priority'
                ];
                const changes = [];
                fieldsOfInterest.forEach((k) => {
                    const before = oldFlat[k];
                    const after = newFlat[k];
                    const norm = (v) => (v === undefined || v === null ? '' : String(v));
                    if (norm(before) !== norm(after)) {
                        changes.push({ field: k, from: before, to: after });
                    }
                });
                if (mounted)
                    setDiffs(changes);
            }
            catch (e) {
                if (mounted)
                    setDiffError(e?.message || 'Failed to load changes');
            }
        }
        fetchDiff();
        return () => { mounted = false; };
    }, [invoice?.id, isUploader, isFinance]);
    function safeParse(maybeJson) {
        if (!maybeJson)
            return null;
        if (typeof maybeJson === 'object')
            return maybeJson;
        try {
            return JSON.parse(maybeJson);
        }
        catch {
            return null;
        }
    }
    function flattenInvoiceDict(d) {
        const invoiceData = (d && d.invoice_data) || {};
        // Merge invoice_data to top-level for easy comparison
        const merged = { ...invoiceData, ...d };
        // Map snake_case to UI keys if present
        const mapping = {
            s_no: 'S_No', invoice_date: 'Invoice_Date', invoice_number: 'Invoice_Number', gst_number: 'GST_Number', vendor_name: 'Vendor_Name',
            line_item: 'Line_Item', hsn_sac: 'HSN_SAC', igst_amount: 'IGST_Amount', cgst_amount: 'CGST_Amount', sgst_amount: 'SGST_Amount',
            basic_amount: 'Basic_Amount', total_amount: 'Total_Amount', net_payable: 'Net_Payable', tds: 'TDS'
        };
        const result = {};
        Object.keys(merged).forEach((k) => {
            const uiKey = mapping[k] || k;
            result[uiKey] = merged[k];
        });
        return result;
    }
    async function handleViewFile() {
        try {
            const blob = await downloadInvoiceFile(Number(invoice.id));
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
            // Optional: revoke later
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
        catch (e) {
            // Fallback to unauthenticated link if needed
            if (invoice.file_url) {
                window.open(invoice.file_url, '_blank', 'noopener,noreferrer');
            }
        }
    }
    return (_jsx(Paper, { variant: "outlined", sx: { p: 3 }, children: _jsxs(Stack, { spacing: 2, children: [_jsxs(Stack, { direction: "row", alignItems: "center", justifyContent: "space-between", children: [_jsx(Typography, { variant: "h6", children: "Invoice Review" }), _jsx(Chip, { size: "small", label: invoice.status, color: invoice.status === 'APPROVED' ? 'success' : invoice.status === 'REJECTED' ? 'error' : 'warning' })] }), _jsx(Divider, {}), !isFinance && isUploader && (_jsxs(Stack, { spacing: 1, children: [_jsx(Typography, { variant: "subtitle2", children: "Changes made by Finance" }), diffError && _jsx(Alert, { severity: "error", children: diffError }), Array.isArray(diffs) && diffs.length > 0 ? (_jsx(TableContainer, { sx: { border: 1, borderColor: 'divider', borderRadius: 1 }, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { '& th': { bgcolor: 'grey.100', fontWeight: 600, borderBottom: 1, borderColor: 'divider' } }, children: [_jsx(TableCell, { children: "Field" }), _jsx(TableCell, { children: "From" }), _jsx(TableCell, { children: "To" })] }) }), _jsx(TableBody, { children: diffs.map((d, idx) => (_jsxs(TableRow, { sx: { '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }, children: [_jsx(TableCell, { children: prettyLabel(d.field) }), _jsx(TableCell, { children: renderValue(d.field, d.from) }), _jsx(TableCell, { children: renderValue(d.field, d.to) })] }, idx))) })] }) })) : (_jsx(Typography, { variant: "body2", color: "text.secondary", children: "No changes detected." }))] })), _jsx(Divider, {}), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "Invoice Number", value: invoice.Invoice_Number }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "Invoice Date", value: formatDate(invoice.Invoice_Date) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "PO Number", value: invoice.PO_Number }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "GST Number", value: invoice.GST_Number }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Field, { label: "Vendor Name", value: invoice.Vendor_Name }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Field, { label: "Serial Number", value: invoice.S_No }) }), _jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Field, { label: "File Name", value: invoice.filename }), invoice.file_path && (_jsx(Typography, { variant: "caption", children: _jsx(Button, { size: "small", variant: "outlined", onClick: handleViewFile, children: "View file" }) }))] }), invoice.approval_remarks ? (_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Field, { label: "Approval Remarks", value: invoice.approval_remarks }) })) : null, invoice.rejection_remarks || String(invoice.status || '').toLowerCase() === 'rejected' ? (_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Field, { label: "Rejection Remarks", value: invoice.rejection_remarks || '-' }) })) : null] }), _jsx(Divider, {}), _jsx(Typography, { variant: "subtitle2", children: "Selected Line Items" }), Array.isArray(invoice.selected_line_items) && invoice.selected_line_items.length > 0 ? (_jsx(TableContainer, { sx: { maxHeight: 360, border: 1, borderColor: 'divider', borderRadius: 1 }, children: _jsxs(Table, { size: "small", stickyHeader: true, children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { '& th': { bgcolor: 'grey.100', fontWeight: 600, borderBottom: 1, borderColor: 'divider' } }, children: [_jsx(TableCell, { children: "Line Item" }), _jsx(TableCell, { children: "HSN/SAC" }), _jsx(TableCell, { align: "right", children: "Basic" }), _jsx(TableCell, { align: "right", children: "IGST" }), _jsx(TableCell, { align: "right", children: "CGST" }), _jsx(TableCell, { align: "right", children: "SGST" }), _jsx(TableCell, { align: "right", children: "Total" })] }) }), _jsx(TableBody, { children: invoice.selected_line_items.map((it, idx) => (_jsxs(TableRow, { sx: { '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }, children: [_jsx(TableCell, { sx: { maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, children: it.Line_Item ?? it.line_item ?? '-' }), _jsx(TableCell, { children: it.HSN_SAC ?? it.hsn_sac ?? '-' }), _jsx(TableCell, { align: "right", children: formatCurrency(it.Basic_Amount ?? it.basic_amount) }), _jsx(TableCell, { align: "right", children: formatCurrency(it.IGST_Amount ?? it.igst_amount) }), _jsx(TableCell, { align: "right", children: formatCurrency(it.CGST_Amount ?? it.cgst_amount) }), _jsx(TableCell, { align: "right", children: formatCurrency(it.SGST_Amount ?? it.sgst_amount) }), _jsx(TableCell, { align: "right", children: formatCurrency(it.Total_Amount ?? it.total_amount) })] }, idx))) })] }) })) : (_jsx(Typography, { variant: "body2", color: "text.secondary", children: "No selected line items provided." })), _jsx(Divider, {}), _jsx(Typography, { variant: "subtitle2", children: "Metadata" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "Department", value: invoice.department || '-' }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "Uploaded", value: formatDate(invoice.created_at) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "Submitted", value: formatDate(invoice.submitted_at || undefined) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "Updated", value: formatDate(invoice.updated_at) }) })] }), _jsx(Divider, {}), _jsx(Typography, { variant: "subtitle2", children: "Financial Summary" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "GST %", value: invoice.gst_percent ?? gst.percent }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "IGST Amount", value: formatCurrency(invoice.IGST_Amount) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "CGST Amount", value: formatCurrency(invoice.CGST_Amount) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "SGST Amount", value: formatCurrency(invoice.SGST_Amount) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "Basic Amount", value: formatCurrency(invoice.Basic_Amount) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "Total Amount", value: formatCurrency(invoice.Total_Amount) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "TDS", value: formatCurrency(invoice.TDS) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "Net Payable", value: formatCurrency(invoice.Net_Payable) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "GST Total", value: formatCurrency(gst.total) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "Taxable Value", value: formatCurrency(gst.taxable) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Field, { label: "Grand Total", value: formatCurrency(gst.grandTotal) }) })] })] }) }));
}
function Field({ label, value }) {
    return (_jsxs(Stack, { spacing: 0.5, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: label }), _jsx(Typography, { variant: "body2", children: value ?? '-' })] }));
}
function prettyLabel(field) {
    const map = {
        Invoice_Number: 'Invoice Number', Invoice_Date: 'Invoice Date', GST_Number: 'GST Number', Vendor_Name: 'Vendor Name',
        Line_Item: 'Line Item', HSN_SAC: 'HSN/SAC', gst_percent: 'GST %', IGST_Amount: 'IGST Amount', CGST_Amount: 'CGST Amount',
        SGST_Amount: 'SGST Amount', Basic_Amount: 'Basic Amount', Total_Amount: 'Total Amount', TDS: 'TDS', Net_Payable: 'Net Payable',
        priority: 'Priority'
    };
    return map[field] || field;
}
function renderValue(field, value) {
    if (value === null || value === undefined || value === '')
        return '-';
    if (field.endsWith('_Amount') || field === 'Total_Amount' || field === 'Basic_Amount' || field === 'Net_Payable' || field === 'TDS') {
        return formatCurrency(value);
    }
    if (String(field).toLowerCase().includes('date')) {
        return formatDate(typeof value === 'string' ? value : String(value));
    }
    return String(value);
}
