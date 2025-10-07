import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, Typography, TextField, MenuItem, Button, Grid, TablePagination, IconButton, Box, Card, CardContent, Chip, InputAdornment, CircularProgress } from '@mui/material';
import { Search, FilterList, Sort, Refresh, Receipt, Business, CurrencyRupee } from '@mui/icons-material';
import { useInvoiceList } from '@hooks/useInvoice';
import { StatusBadge, InvoiceActions } from './InvoiceComponents';
import { determinePriority, formatCurrency } from '@utils/financeUtils';
import { getPriorityColor } from '@theme/index';
export default function InvoiceList() {
    const { items, listStatus, load } = useInvoiceList();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const params = useMemo(() => ({
        search: search || undefined,
        status: status || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page: page + 1,
        per_page: rowsPerPage,
        sort_by: sortBy,
        sort_order: sortOrder
    }), [search, status, dateFrom, dateTo, page, rowsPerPage, sortBy, sortOrder]);
    useEffect(() => {
        load(params);
    }, [load, params]);
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };
    const resetFilters = () => {
        setSearch('');
        setStatus('');
        setDateFrom('');
        setDateTo('');
    };
    const filteredItems = (items || []).filter((inv) => String(inv.status || '').toLowerCase() !== 'extracted');
    return (_jsxs(Stack, { spacing: 3, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h5", sx: {
                            fontWeight: 700,
                            color: 'text.primary',
                            mb: 1,
                            letterSpacing: '-0.025em'
                        }, children: "Invoice Management" }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: "View and manage all invoices in your system" })] }), _jsx(Card, { sx: {
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(226, 232, 240, 0.8)'
                }, children: _jsxs(CardContent, { sx: { p: 3 }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, mb: 2, children: [_jsx(FilterList, { color: "primary" }), _jsx(Typography, { variant: "h6", sx: { fontWeight: 600 }, children: "Filters & Search" })] }), _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Search invoices...", value: search, onChange: (e) => setSearch(e.target.value), InputProps: {
                                            startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(Search, { color: "action" }) })),
                                        }, sx: {
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        } }) }), _jsx(Grid, { item: true, xs: 12, md: 2, children: _jsxs(TextField, { select: true, fullWidth: true, size: "small", label: "Status", value: status, onChange: (e) => setStatus(e.target.value), sx: {
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }, children: [_jsx(MenuItem, { value: "", children: "All Status" }), _jsx(MenuItem, { value: "draft", children: "Draft" }), _jsx(MenuItem, { value: "pending", children: "Pending Approval" }), _jsx(MenuItem, { value: "approved", children: "Approved" }), _jsx(MenuItem, { value: "rejected", children: "Rejected" })] }) }), _jsx(Grid, { item: true, xs: 6, md: 2, children: _jsx(TextField, { fullWidth: true, size: "small", label: "From Date", type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value), InputLabelProps: { shrink: true }, sx: {
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        } }) }), _jsx(Grid, { item: true, xs: 6, md: 2, children: _jsx(TextField, { fullWidth: true, size: "small", label: "To Date", type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value), InputLabelProps: { shrink: true }, sx: {
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        } }) }), _jsx(Grid, { item: true, xs: 12, md: 2, children: _jsx(Button, { fullWidth: true, variant: "outlined", onClick: resetFilters, startIcon: _jsx(Refresh, {}), sx: { borderRadius: 2 }, children: "Reset" }) })] })] }) }), _jsxs(Card, { sx: {
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(226, 232, 240, 0.8)'
                }, children: [_jsx(TableContainer, { children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: 'grey.50' }, children: [_jsx(TableCell, { sx: { fontWeight: 600, color: 'text.primary' }, children: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(Receipt, { fontSize: "small" }), _jsx("span", { children: "Invoice #" }), _jsx(IconButton, { size: "small", onClick: () => handleSort('invoice_number'), sx: { ml: 1 }, children: _jsx(Sort, { fontSize: "small" }) })] }) }), _jsx(TableCell, { sx: { fontWeight: 600, color: 'text.primary' }, children: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(Receipt, { fontSize: "small" }), _jsx("span", { children: "PO #" }), _jsx(IconButton, { size: "small", onClick: () => handleSort('po_number'), sx: { ml: 1 }, children: _jsx(Sort, { fontSize: "small" }) })] }) }), _jsx(TableCell, { sx: { fontWeight: 600, color: 'text.primary' }, children: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(Business, { fontSize: "small" }), _jsx("span", { children: "Vendor" }), _jsx(IconButton, { size: "small", onClick: () => handleSort('vendor_name'), sx: { ml: 1 }, children: _jsx(Sort, { fontSize: "small" }) })] }) }), _jsx(TableCell, { sx: { fontWeight: 600, color: 'text.primary' }, children: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(CurrencyRupee, { fontSize: "small" }), _jsx("span", { children: "Total Amount" }), _jsx(IconButton, { size: "small", onClick: () => handleSort('total_amount'), sx: { ml: 1 }, children: _jsx(Sort, { fontSize: "small" }) })] }) }), _jsx(TableCell, { sx: { fontWeight: 600, color: 'text.primary' }, children: "Status" }), _jsx(TableCell, { sx: { fontWeight: 600, color: 'text.primary' }, children: "Priority" }), _jsx(TableCell, { align: "right", sx: { fontWeight: 600, color: 'text.primary' }, children: "Actions" })] }) }), _jsx(TableBody, { children: listStatus === 'loading' ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 6, align: "center", sx: { py: 4 }, children: _jsxs(Stack, { alignItems: "center", spacing: 2, children: [_jsx(CircularProgress, { size: 40 }), _jsx(Typography, { color: "text.secondary", children: "Loading invoices..." })] }) }) })) : filteredItems.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 6, align: "center", sx: { py: 4 }, children: _jsxs(Stack, { alignItems: "center", spacing: 2, children: [_jsx(Receipt, { sx: { fontSize: 48, color: 'grey.400' } }), _jsx(Typography, { color: "text.secondary", children: "No invoices found" })] }) }) })) : (filteredItems.map((inv) => {
                                        const priority = determinePriority(inv);
                                        const pColor = getPriorityColor(priority);
                                        return (_jsxs(TableRow, { hover: true, sx: {
                                                transition: 'background-color 120ms ease',
                                                '&:hover': {
                                                    backgroundColor: 'grey.100',
                                                    '& .MuiTableCell-root': {
                                                        color: 'text.primary'
                                                    }
                                                }
                                            }, children: [_jsx(TableCell, { sx: { fontWeight: 500 }, children: _jsx(Typography, { variant: "body2", sx: { fontFamily: 'monospace' }, children: inv.Invoice_Number }) }), _jsx(TableCell, { children: _jsx(Typography, { variant: "body2", sx: { fontFamily: 'monospace' }, children: inv.PO_Number || '-' }) }), _jsx(TableCell, { children: _jsx(Typography, { variant: "body2", sx: { fontWeight: 500 }, children: inv.Vendor_Name }) }), _jsx(TableCell, { children: _jsx(Typography, { variant: "body2", sx: { fontWeight: 600, color: 'success.main' }, children: formatCurrency(inv.Total_Amount) }) }), _jsx(TableCell, { children: _jsx(StatusBadge, { status: inv.status }) }), _jsx(TableCell, { children: _jsx(Chip, { size: "small", label: priority.toUpperCase(), sx: { bgcolor: `${pColor}22`, color: pColor } }) }), _jsx(TableCell, { align: "right", children: _jsx(InvoiceActions, { invoice: inv }) })] }, inv.id));
                                    })) })] }) }), _jsx(Box, { sx: { p: 2, borderTop: '1px solid', borderColor: 'divider' }, children: _jsx(TablePagination, { component: "div", count: -1, page: page, onPageChange: (_, p) => setPage(p), rowsPerPage: rowsPerPage, onRowsPerPageChange: (e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }, labelDisplayedRows: () => '', labelRowsPerPage: "Rows per page:", nextIconButtonProps: { disabled: items.length < rowsPerPage }, backIconButtonProps: { disabled: page === 0 }, sx: {
                                '& .MuiTablePagination-toolbar': {
                                    paddingLeft: 0
                                }
                            } }) })] })] }));
}
