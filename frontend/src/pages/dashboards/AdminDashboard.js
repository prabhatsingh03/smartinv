import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Stack, Typography, Button, Box, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Add, Assessment } from '@mui/icons-material';
import InvoiceList from '../../components/invoices/InvoiceList';
export default function AdminDashboard() {
    console.log('AdminDashboard: Component rendered');
    const navigate = useNavigate();
    return (_jsxs(Stack, { spacing: 4, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", sx: {
                            fontWeight: 700,
                            color: 'text.primary',
                            mb: 1,
                            letterSpacing: '-0.025em'
                        }, children: "Admin Dashboard" }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: "Overview of your invoice management system" })] }), _jsx(Paper, { sx: {
                    p: 3,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(226, 232, 240, 0.8)'
                }, children: _jsxs(Stack, { direction: "row", spacing: 2, alignItems: "center", justifyContent: "space-between", children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", sx: { fontWeight: 600, mb: 0.5 }, children: "Quick Actions" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Manage your invoices and view reports" })] }), _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(Assessment, {}), onClick: () => navigate('/invoices'), sx: { borderRadius: 2 }, children: "View Reports" }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => navigate('/invoices'), sx: { borderRadius: 2 }, children: "Manage Invoices" })] })] }) }), _jsx(InvoiceList, {})] }));
}
