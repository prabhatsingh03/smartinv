import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Stack, Paper, Button, Skeleton, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@hooks/index';
import { fetchInvoiceThunk } from '@store/invoiceSlice';
import InvoiceReviewForm from '@components/invoices/InvoiceReviewForm';
import InvoiceForm from '@components/invoices/InvoiceForm';
import ApprovalActions from '@components/finance/ApprovalActions';
import { getCurrentUserRole, getCurrentUserId } from '@utils/auth';
export default function InvoiceReviewPage() {
    const { id } = useParams();
    const isEdit = String(location.pathname || '').endsWith('/edit');
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const current = useAppSelector((s) => s.invoices.current);
    const error = useAppSelector((s) => s.invoices.error);
    const { authenticated } = useAppSelector((s) => s.auth);
    const role = getCurrentUserRole();
    const userId = getCurrentUserId();
    const [invalidId, setInvalidId] = useState(null);
    useEffect(() => {
        const invoiceId = Number(id);
        if (!Number.isFinite(invoiceId)) {
            setInvalidId('Invalid invoice id');
            return;
        }
        setInvalidId(null);
        dispatch(fetchInvoiceThunk(invoiceId));
    }, [dispatch, id]);
    if (invalidId)
        return _jsx(Alert, { severity: "error", children: invalidId });
    if (error) {
        return (_jsx(Paper, { sx: { p: 2 }, children: _jsxs(Stack, { spacing: 2, alignItems: "flex-start", children: [_jsx(Alert, { severity: "error", children: error }), _jsx(Button, { variant: "outlined", onClick: () => id && dispatch(fetchInvoiceThunk(Number(id))), children: "Retry" })] }) }));
    }
    if (!current) {
        return (_jsxs(Stack, { spacing: 2, children: [_jsx(Skeleton, { variant: "rectangular", height: 120 }), _jsx(Skeleton, { variant: "rectangular", height: 200 })] }));
    }
    // Permission: Finance/Super Admin can always manage; uploader can edit only if not approved or rejected
    const isUploader = String(userId || '') === String(current.uploaded_by || '');
    const status = String(current.status || '').toLowerCase();
    const isFinance = role === 'FINANCE' || role === 'SUPER_ADMIN';
    const canEdit = Boolean(isFinance ||
        (isUploader && status !== 'approved' && status !== 'rejected'));
    return (_jsxs(Stack, { spacing: 2, children: [isEdit ? (canEdit ? (_jsx(InvoiceForm, {})) : (_jsx(Alert, { severity: "error", children: "You do not have permission to edit this invoice." }))) : (_jsx(InvoiceReviewForm, { invoice: current })), !isEdit && (_jsx(Paper, { sx: { p: 2 }, children: _jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsx(Button, { variant: "outlined", onClick: () => navigate(-1), children: "Back" }), _jsxs(Stack, { direction: "row", spacing: 1, children: [canEdit && (_jsx(Button, { variant: "outlined", onClick: () => navigate(`/finance/invoices/${current.id}/edit`), children: "Edit" })), canEdit && (_jsx(ApprovalActions, { invoice: current, onDone: () => navigate(-1) }))] })] }) }))] }));
}
