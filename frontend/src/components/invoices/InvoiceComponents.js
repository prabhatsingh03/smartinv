import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Chip, Stack, Button, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAppSelector } from '@hooks/index';
import { getCurrentUserRole } from '@utils/auth';
import { getStatusColor } from '@theme/index';
export function StatusBadge({ status }) {
    const s = String(status || '').toLowerCase();
    const color = getStatusColor(s);
    return _jsx(Chip, { label: String(status || '').toUpperCase(), size: "small", sx: { bgcolor: `${color}22`, color } });
}
export function InvoiceActions({ invoice, onEdit, onSubmit }) {
    const { authenticated } = useAppSelector((s) => s.auth);
    const role = getCurrentUserRole();
    const status = String(invoice.status || '').toLowerCase();
    const isEditable = ['draft', 'extracted', 'pending'].includes(status);
    const isApproved = status === 'approved';
    const isRejected = status === 'rejected';
    return (_jsxs(Stack, { direction: "row", spacing: 1, children: [role !== 'FINANCE' && role !== 'SUPER_ADMIN' && (isEditable ? (_jsx(Button, { size: "small", variant: "outlined", component: RouterLink, to: `/invoices/${invoice.id}/edit`, children: "Edit" })) : (isApproved || isRejected) ? (_jsx(Button, { size: "small", component: RouterLink, to: `/finance/invoices/${invoice.id}`, children: "View" })) : null), onSubmit && isEditable && (_jsx(Tooltip, { title: "Submit for Approval", children: _jsx(Button, { size: "small", variant: "contained", onClick: onSubmit, children: "Submit" }) })), canFinance(role) && (_jsx(Tooltip, { title: isApproved ? 'View approved invoice' : isRejected ? 'View rejected invoice' : 'Review for approval', children: _jsx(Button, { size: "small", component: RouterLink, to: `/finance/invoices/${invoice.id}${isEditable ? '' : ''}`, children: isApproved || isRejected ? 'View' : 'Review' }) }))] }));
}
function canFinance(role) {
    return role === 'FINANCE' || role === 'SUPER_ADMIN';
}
