import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Stack, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InvoiceList from '@components/invoices/InvoiceList';
export default function SiteDashboard() {
    const navigate = useNavigate();
    return (_jsxs(Stack, { spacing: 3, children: [_jsxs(Stack, { direction: "row", alignItems: "center", justifyContent: "space-between", children: [_jsx(Typography, { variant: "h5", children: "Site Dashboard" }), _jsx(Button, { variant: "contained", onClick: () => navigate('/invoices'), children: "Site Expenses" })] }), _jsx(InvoiceList, {})] }));
}
