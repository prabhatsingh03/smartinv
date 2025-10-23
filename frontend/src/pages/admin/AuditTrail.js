import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Stack, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { exportToCsv } from '@utils/adminUtils';
import { useAppDispatch, useAppSelector } from '@hooks/index';
import { fetchAuditLogs, fetchAuditStatistics } from '@store/superAdminSlice';
export default function AuditTrail() {
    const dispatch = useAppDispatch();
    const logs = useAppSelector((s) => s.superAdmin.auditLogs);
    const stats = useAppSelector((s) => s.superAdmin.auditStats);
    const [userId, setUserId] = useState('');
    const [invoiceId, setInvoiceId] = useState('');
    const [action, setAction] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    useEffect(() => {
        dispatch(fetchAuditLogs({ limit: 100 }));
        dispatch(fetchAuditStatistics());
    }, [dispatch]);
    return (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "h5", children: "Audit Trail" }), _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Stack, { direction: { xs: 'column', md: 'row' }, spacing: 2, children: [_jsx(TextField, { label: "User ID", value: userId, onChange: (e) => setUserId(e.target.value), size: "small" }), _jsx(TextField, { label: "Invoice ID", value: invoiceId, onChange: (e) => setInvoiceId(e.target.value), size: "small" }), _jsx(TextField, { label: "Action", value: action, onChange: (e) => setAction(e.target.value), size: "small" }), _jsx(TextField, { label: "From", type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value), size: "small", InputLabelProps: { shrink: true } }), _jsx(TextField, { label: "To", type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value), size: "small", InputLabelProps: { shrink: true } }), _jsx(Button, { variant: "contained", onClick: () => dispatch(fetchAuditLogs({
                                    user_id: userId ? Number(userId) : undefined,
                                    invoice_id: invoiceId ? Number(invoiceId) : undefined,
                                    action: action || undefined,
                                    date_from: dateFrom || undefined,
                                    date_to: dateTo || undefined
                                })), children: "Apply" }), _jsx(Button, { variant: "outlined", onClick: () => exportToCsv('audit-logs.csv', logs.map(l => ({
                                    id: l.id,
                                    user: l.user_name || l.user_id,
                                    action: l.action,
                                    invoice: l.invoice_number || l.invoice_id || '',
                                    timestamp: l.timestamp,
                                    remarks: l.remarks || ''
                                }))), disabled: !logs.length, children: "Export CSV" })] }) }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Logs" }), _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Time" }), _jsx(TableCell, { children: "User" }), _jsx(TableCell, { children: "Action" }), _jsx(TableCell, { children: "Invoice" }), _jsx(TableCell, { children: "Remarks" })] }) }), _jsx(TableBody, { children: logs.map((l) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: l.timestamp }), _jsx(TableCell, { children: l.user_name || l.user_id }), _jsx(TableCell, { children: l.action }), _jsx(TableCell, { children: l.invoice_number || l.invoice_id || '-' }), _jsx(TableCell, { children: l.remarks || '-' })] }, l.id))) })] })] }) }), stats && (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Statistics" }), _jsxs(Typography, { variant: "body2", children: ["Total Logs: ", stats.total_logs] })] }) }))] }));
}
