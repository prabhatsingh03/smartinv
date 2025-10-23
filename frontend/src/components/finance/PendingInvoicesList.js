import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, Typography, TextField, Button, Grid, Checkbox, IconButton, Tooltip, Chip, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { usePendingInvoices } from '@hooks/useFinance';
import ApprovalActions from './ApprovalActions';
import { determinePriority, formatCurrency, formatDate } from '@utils/financeUtils';
import { getPriorityColor } from '@theme/index';
import SortIcon from '@mui/icons-material/Sort';
import { useAppDispatch } from '@hooks/index';
import { approveInvoiceThunk, rejectInvoiceThunk } from '@store/invoiceSlice';
import { validateRemarks } from '@utils/financeValidation';
import { Link as RouterLink } from 'react-router-dom';
export default function PendingInvoicesList() {
    const { items, status, load } = usePendingInvoices();
    const [selected, setSelected] = useState([]);
    const [batching, setBatching] = useState(false);
    const [snackbar, setSnackbar] = useState(() => ({ open: false, message: '', severity: 'success' }));
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [remarks, setRemarks] = useState('');
    const remarksError = useMemo(() => validateRemarks(remarks), [remarks]);
    const dispatch = useAppDispatch();
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState('');
    const [vendor, setVendor] = useState('');
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const params = useMemo(() => ({
        search: search || undefined,
        department_id: department || undefined,
        vendor_name: vendor || undefined,
        amount_min: amountMin || undefined,
        amount_max: amountMax || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        status: 'pending',
        sort_by: sortBy,
        sort_order: sortOrder
    }), [search, department, vendor, amountMin, amountMax, dateFrom, dateTo, sortBy, sortOrder]);
    useEffect(() => { load(params); }, [load, params]);
    // Reset selections when list items change to avoid stale selections
    useEffect(() => { setSelected([]); }, [items]);
    const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
    const toggleAll = () => setSelected((s) => (s.length === items.length ? [] : items.map((i) => i.id)));
    async function handleBatchApprove() {
        if (selected.length === 0)
            return;
        setBatching(true);
        try {
            const results = await Promise.all(selected.map((id) => dispatch(approveInvoiceThunk({ id }))));
            const failures = results.filter((r) => r.meta?.requestStatus !== 'fulfilled');
            if (failures.length === 0) {
                setSnackbar({ open: true, message: `Approved ${selected.length} invoice(s)`, severity: 'success' });
            }
            else if (failures.length === selected.length) {
                setSnackbar({ open: true, message: `All ${selected.length} approvals failed`, severity: 'error' });
            }
            else {
                setSnackbar({ open: true, message: `Approved ${selected.length - failures.length}, failed ${failures.length}`, severity: 'warning' });
            }
            setSelected([]);
            await load(params);
        }
        finally {
            setBatching(false);
        }
    }
    async function handleBatchReject() {
        if (selected.length === 0)
            return;
        if (remarksError)
            return;
        setRejectDialogOpen(false);
        setBatching(true);
        try {
            const results = await Promise.all(selected.map((id) => dispatch(rejectInvoiceThunk({ id, remarks }))));
            const failures = results.filter((r) => r.meta?.requestStatus !== 'fulfilled');
            if (failures.length === 0) {
                setSnackbar({ open: true, message: `Rejected ${selected.length} invoice(s)`, severity: 'success' });
            }
            else if (failures.length === selected.length) {
                setSnackbar({ open: true, message: `All ${selected.length} rejections failed`, severity: 'error' });
            }
            else {
                setSnackbar({ open: true, message: `Rejected ${selected.length - failures.length}, failed ${failures.length}`, severity: 'warning' });
            }
            setSelected([]);
            setRemarks('');
            await load(params);
        }
        finally {
            setBatching(false);
        }
    }
    return (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "h6", children: "Pending Invoices" }), _jsx(Paper, { sx: { p: 2 }, children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Search", value: search, onChange: (e) => setSearch(e.target.value) }) }), _jsx(Grid, { item: true, xs: 12, md: 2, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Department", value: department, onChange: (e) => setDepartment(e.target.value) }) }), _jsx(Grid, { item: true, xs: 12, md: 2, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Vendor", value: vendor, onChange: (e) => setVendor(e.target.value) }) }), _jsx(Grid, { item: true, xs: 6, md: 2, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Min Amount", type: "number", value: amountMin, onChange: (e) => setAmountMin(e.target.value) }) }), _jsx(Grid, { item: true, xs: 6, md: 2, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Max Amount", type: "number", value: amountMax, onChange: (e) => setAmountMax(e.target.value) }) }), _jsx(Grid, { item: true, xs: 6, md: 2, children: _jsx(TextField, { fullWidth: true, size: "small", label: "From", type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value), InputLabelProps: { shrink: true } }) }), _jsx(Grid, { item: true, xs: 6, md: 2, children: _jsx(TextField, { fullWidth: true, size: "small", label: "To", type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value), InputLabelProps: { shrink: true } }) }), _jsx(Grid, { item: true, xs: 12, md: 2, children: _jsx(Button, { fullWidth: true, variant: "outlined", onClick: () => { setSearch(''); setDepartment(''); setVendor(''); setAmountMin(''); setAmountMax(''); setDateFrom(''); setDateTo(''); }, children: "Reset" }) })] }) }), _jsx(TableContainer, { component: Paper, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { padding: "checkbox", children: _jsx(Checkbox, { checked: selected.length === items.length && items.length > 0, indeterminate: selected.length > 0 && selected.length < items.length, onChange: toggleAll }) }), _jsxs(TableCell, { children: ["Invoice #", _jsx(IconButton, { size: "small", onClick: () => { setSortBy('invoice_number'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }, children: _jsx(SortIcon, { fontSize: "inherit" }) })] }), _jsx(TableCell, { children: "Vendor" }), _jsx(TableCell, { children: "Dept" }), _jsxs(TableCell, { children: ["Total", _jsx(IconButton, { size: "small", onClick: () => { setSortBy('total_amount'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }, children: _jsx(SortIcon, { fontSize: "inherit" }) })] }), _jsx(TableCell, { children: "Uploaded" }), _jsx(TableCell, { children: "Priority" }), _jsx(TableCell, { align: "right", children: "Actions" })] }) }), _jsxs(TableBody, { children: [items.map((inv) => {
                                    const priority = determinePriority(inv);
                                    return (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { padding: "checkbox", children: _jsx(Checkbox, { checked: selected.includes(inv.id), onChange: () => toggle(inv.id) }) }), _jsx(TableCell, { children: _jsx(Button, { size: "small", component: RouterLink, to: `/finance/invoices/${inv.id}`, children: inv.Invoice_Number }) }), _jsx(TableCell, { children: inv.Vendor_Name }), _jsx(TableCell, { children: inv.department }), _jsx(TableCell, { children: formatCurrency(inv.Total_Amount) }), _jsx(TableCell, { children: formatDate(inv.created_at) }), _jsx(TableCell, { children: _jsx(Tooltip, { title: `Priority: ${priority}`, children: _jsx(Chip, { size: "small", label: priority.toUpperCase(), sx: { bgcolor: `${getPriorityColor(priority)}22`, color: getPriorityColor(priority) } }) }) }), _jsx(TableCell, { align: "right", children: _jsxs(Stack, { direction: "row", spacing: 1, justifyContent: "flex-end", children: [_jsx(Button, { size: "small", component: RouterLink, to: `/finance/invoices/${inv.id}`, children: "View" }), _jsx(Button, { size: "small", variant: "outlined", component: RouterLink, to: `/finance/invoices/${inv.id}/edit`, children: "Edit" }), _jsx(ApprovalActions, { invoice: inv, disabled: batching })] }) })] }, inv.id));
                                }), items.length === 0 && (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 8, align: "center", children: status === 'loading' ? 'Loading...' : 'No pending invoices' }) }))] })] }) }), selected.length > 0 && (_jsxs(Paper, { sx: { position: 'sticky', bottom: 0, p: 2, display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }, children: [_jsxs(Typography, { variant: "body2", children: [selected.length, " selected"] }), _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Button, { variant: "contained", color: "success", disabled: batching, onClick: handleBatchApprove, children: "Approve Selected" }), _jsx(Button, { variant: "outlined", color: "error", disabled: batching, onClick: () => setRejectDialogOpen(true), children: "Reject Selected" })] })] })), _jsxs(Dialog, { open: rejectDialogOpen, onClose: () => setRejectDialogOpen(false), children: [_jsx(DialogTitle, { children: "Reject Selected Invoices" }), _jsx(DialogContent, { children: _jsx(TextField, { autoFocus: true, fullWidth: true, label: "Remarks", value: remarks, onChange: (e) => setRemarks(e.target.value), error: Boolean(remarksError), helperText: remarksError || 'Please provide a reason applied to all selected invoices', multiline: true, minRows: 3 }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setRejectDialogOpen(false), children: "Cancel" }), _jsx(Button, { variant: "contained", color: "error", disabled: Boolean(remarksError) || batching, onClick: handleBatchReject, children: "Reject" })] })] }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 4000, onClose: () => setSnackbar((s) => ({ ...s, open: false })), children: _jsx(Alert, { onClose: () => setSnackbar((s) => ({ ...s, open: false })), severity: snackbar.severity, sx: { width: '100%' }, children: snackbar.message }) })] }));
}
