import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, Typography, Grid } from '@mui/material';
export function StatCard({ title, value }) {
    return (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: title }), _jsx(Typography, { variant: "h5", children: value })] }) }));
}
export function StatGrid() {
    return (_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(StatCard, { title: "Pending", value: 5 }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(StatCard, { title: "Approved", value: 12 }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(StatCard, { title: "Rejected", value: 2 }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(StatCard, { title: "Paid", value: 9 }) })] }));
}
