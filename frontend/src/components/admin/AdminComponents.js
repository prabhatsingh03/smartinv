import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, Typography, Stack, LinearProgress, List, ListItem, ListItemText, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { prepareTrendChartData } from '@utils/adminUtils';
import { useEffect, useState } from 'react';
import { listPending } from '@services/apiService';
export function StatCard({ title, value, loading }) {
    return (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: title }), loading ? _jsx(LinearProgress, {}) : _jsx(Typography, { variant: "h5", children: value ?? '-' })] }) }));
}
export function StatsGrid({ stats, loading }) {
    return (_jsxs(Stack, { direction: "row", spacing: 2, flexWrap: "wrap", children: [_jsx(StatCard, { title: "Users", value: stats?.users.total, loading: loading }), _jsx(StatCard, { title: "Active Users", value: stats?.users.active, loading: loading }), _jsx(StatCard, { title: "Departments", value: stats?.departments.total, loading: loading }), _jsx(StatCard, { title: "Invoices", value: stats?.invoices.total, loading: loading }), _jsx(StatCard, { title: "Pending", value: stats?.invoices.pending, loading: loading }), _jsx(StatCard, { title: "Approved", value: stats?.invoices.approved, loading: loading }), _jsx(StatCard, { title: "Rejected", value: stats?.invoices.rejected, loading: loading })] }));
}
export function ActivityFeed({ logs }) {
    return (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Recent Activity" }), _jsx(List, { dense: true, children: logs.map((log) => (_jsx(ListItem, { divider: true, children: _jsx(ListItemText, { primary: `${log.user_name || 'User ' + log.user_id} ${log.action}${log.invoice_number ? ' #' + log.invoice_number : ''}`, secondary: log.timestamp }) }, log.id))) })] }) }));
}
export function ChartCard({ title, data }) {
    return (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: title }), _jsx("div", { style: { width: '100%', height: 260 }, children: _jsx(ResponsiveContainer, { children: _jsxs(LineChart, { data: data, margin: { top: 10, right: 10, left: 0, bottom: 0 }, children: [_jsx(XAxis, { dataKey: "name", hide: false }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "value", stroke: "#3f51b5", strokeWidth: 2, dot: false })] }) }) })] }) }));
}
export function TrendChart({ stats }) {
    const data = prepareTrendChartData(stats);
    return _jsx(ChartCard, { title: "Invoices Trend (12 months)", data: data });
}
export function ActionCountsChart({ items }) {
    return (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Action Counts" }), _jsx("div", { style: { width: '100%', height: 260 }, children: _jsx(ResponsiveContainer, { children: _jsxs(BarChart, { data: items, margin: { top: 10, right: 10, left: 0, bottom: 0 }, children: [_jsx(XAxis, { dataKey: "action", hide: false }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "count", fill: "#26a69a" })] }) }) })] }) }));
}
export function PendingApprovalsTable({ limit = 20 }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await listPending({ page: 1, per_page: limit });
                const items = res?.data?.items || res?.items || [];
                setRows(items);
            }
            finally {
                setLoading(false);
            }
        })();
    }, [limit]);
    return (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Typography, { variant: "subtitle1", gutterBottom: true, children: ["Pending Approvals (Top ", limit, ")"] }), loading ? (_jsx(LinearProgress, {})) : (_jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "ID" }), _jsx(TableCell, { children: "Invoice Number" }), _jsx(TableCell, { children: "Vendor" }), _jsx(TableCell, { children: "Department" }), _jsx(TableCell, { children: "Uploaded By" }), _jsx(TableCell, { children: "Submitted" })] }) }), _jsx(TableBody, { children: rows.map((r) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: r.id }), _jsx(TableCell, { children: r.invoice_data?.Invoice_Number || '-' }), _jsx(TableCell, { children: r.invoice_data?.Vendor_Name || '-' }), _jsx(TableCell, { children: r.department || r.department_name || '-' }), _jsx(TableCell, { children: r.uploader_name || '-' }), _jsx(TableCell, { children: r.submitted_at || '-' })] }, r.id))) })] }))] }) }));
}
