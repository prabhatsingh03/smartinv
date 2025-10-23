import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Stack, Typography } from '@mui/material';
import InvoiceUpload from '@components/invoices/InvoiceUpload';
import InvoiceForm from '@components/invoices/InvoiceForm';
export default function InvoiceManagement() {
    return (_jsxs(Stack, { spacing: 3, children: [_jsx(Typography, { variant: "h5", children: "Invoice Management" }), _jsx(InvoiceUpload, {}), _jsx(InvoiceForm, {})] }));
}
