import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, Typography, TextField, Button, Grid, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Select, FormControl, InputLabel } from '@mui/material';
import api from '@services/apiService';
import { useApprovedInvoices } from '@hooks/useFinance';
import { toCsv, formatCurrency, formatDate } from '@utils/financeUtils';
export default function ApprovedInvoicesList() {
    const { items, status, load } = useApprovedInvoices();
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState('');
    const [vendor, setVendor] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editStatus, setEditStatus] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const params = useMemo(() => ({
        search: search || undefined,
        department_id: department || undefined,
        vendor_name: vendor || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        amount_min: amountMin || undefined,
        amount_max: amountMax || undefined,
        payment_status: paymentStatus || undefined,
        status: 'APPROVED'
    }), [search, department, vendor, dateFrom, dateTo, amountMin, amountMax, paymentStatus]);
    useEffect(() => { load(params); }, [load, params]);
    function exportCsv() {
        const rows = items.map((i) => ({
            id: i.id,
            invoice_number: i.Invoice_Number,
            vendor: i.Vendor_Name,
            department: i.department,
            total: i.Total_Amount,
            approved_at: i.approved_at,
            uploaded_at: i.created_at
        }));
        const csv = toCsv(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `approved_invoices.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
    return (_jsxs(Stack, { spacing: 2, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "h6", children: "Approved Invoices" }), _jsx(Button, { variant: "outlined", onClick: exportCsv, children: "Export CSV" })] }), _jsx(Paper, { sx: { p: 2 }, children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Search", value: search, onChange: (e) => setSearch(e.target.value) }) }), _jsx(Grid, { item: true, xs: 12, md: 2, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Department", value: department, onChange: (e) => setDepartment(e.target.value) }) }), _jsx(Grid, { item: true, xs: 12, md: 2, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Vendor", value: vendor, onChange: (e) => setVendor(e.target.value) }) }), _jsx(Grid, { item: true, xs: 6, md: 2, children: _jsx(TextField, { fullWidth: true, size: "small", label: "From", type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value), InputLabelProps: { shrink: true } }) }), _jsx(Grid, { item: true, xs: 6, md: 2, children: _jsx(TextField, { fullWidth: true, size: "small", label: "To", type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value), InputLabelProps: { shrink: true } }) }), _jsx(Grid, { item: true, xs: 6, md: 2, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Min Amount", type: "number", value: amountMin, onChange: (e) => setAmountMin(e.target.value) }) }), _jsx(Grid, { item: true, xs: 6, md: 2, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Max Amount", type: "number", value: amountMax, onChange: (e) => setAmountMax(e.target.value) }) }), _jsx(Grid, { item: true, xs: 12, md: 2, children: _jsxs(TextField, { fullWidth: true, select: true, size: "small", label: "Payment Status", value: paymentStatus, onChange: (e) => setPaymentStatus(e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "PAID", children: "PAID" }), _jsx(MenuItem, { value: "UNPAID", children: "UNPAID" }), _jsx(MenuItem, { value: "PARTIAL", children: "PARTIAL" })] }) }), _jsx(Grid, { item: true, xs: 12, md: 1, children: _jsx(Button, { fullWidth: true, variant: "outlined", onClick: () => { setSearch(''); setDepartment(''); setVendor(''); setDateFrom(''); setDateTo(''); setAmountMin(''); setAmountMax(''); setPaymentStatus(''); }, children: "Reset" }) })] }) }), _jsx(TableContainer, { component: Paper, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Invoice #" }), _jsx(TableCell, { children: "Vendor" }), _jsx(TableCell, { children: "Dept" }), _jsx(TableCell, { children: "Total" }), _jsx(TableCell, { children: "Approved" }), _jsx(TableCell, { children: "Uploaded" }), _jsx(TableCell, { children: "Payment Status" }), _jsx(TableCell, { children: "Paid Date" }), _jsx(TableCell, { children: "Action" })] }) }), _jsxs(TableBody, { children: [items.map((inv) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: inv.Invoice_Number }), _jsx(TableCell, { children: inv.Vendor_Name }), _jsx(TableCell, { children: inv.department }), _jsx(TableCell, { children: formatCurrency(inv.Total_Amount) }), _jsx(TableCell, { children: formatDate(inv.approved_at || undefined) }), _jsx(TableCell, { children: formatDate(inv.created_at) }), _jsx(TableCell, { children: inv.payment_status || '-' }), _jsx(TableCell, { children: formatDate(inv.paid_at) }), _jsx(TableCell, { children: _jsx(Button, { size: "small", onClick: () => { setEditId(inv.id); setEditStatus(inv.payment_status || ''); setEditAmount(String(inv.amount_paid ?? '')); setEditOpen(true); }, children: "Edit" }) })] }, inv.id))), items.length === 0 && (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 8, align: "center", children: status === 'loading' ? 'Loading...' : 'No approved invoices' }) }))] })] }) }), _jsxs(Dialog, { open: editOpen, onClose: () => setEditOpen(false), fullWidth: true, maxWidth: "xs", children: [_jsx(DialogTitle, { children: "Edit Payment Status" }), _jsx(DialogContent, { children: _jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [_jsxs(FormControl, { size: "small", fullWidth: true, children: [_jsx(InputLabel, { id: "pay-status", children: "Payment Status" }), _jsxs(Select, { labelId: "pay-status", label: "Payment Status", value: editStatus, onChange: (e) => setEditStatus(e.target.value), children: [_jsx(MenuItem, { value: "DUE_NOT_PAID", children: "Due and not Paid" }), _jsx(MenuItem, { value: "DUE_PARTIAL", children: "Due and Partially Paid" }), _jsx(MenuItem, { value: "DUE_FULL", children: "Due and Fully Paid" }), _jsx(MenuItem, { value: "NOT_DUE", children: "Not Due" })] })] }), editStatus === 'DUE_PARTIAL' && (_jsx(TextField, { size: "small", type: "number", label: "Amount Paid", value: editAmount, onChange: (e) => setEditAmount(e.target.value) }))] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setEditOpen(false), children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: async () => {
                                    if (!editId)
                                        return;
                                    const payload = { payment_status: editStatus };
                                    if (editStatus === 'DUE_PARTIAL')
                                        payload.amount_paid = Number(editAmount || 0);
                                    if (editStatus === 'DUE_PARTIAL' || editStatus === 'DUE_FULL')
                                        payload.paid_at = new Date().toISOString();
                                    await api.put(`invoices/${editId}`, payload);
                                    setEditOpen(false);
                                    load(params);
                                }, children: "Save" })] })] })] }));
}
