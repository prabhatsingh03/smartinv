import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip, Snackbar, Alert } from '@mui/material';
import { useInvoiceApproval } from '@hooks/useFinance';
import { useAppDispatch } from '@hooks/index';
import { financeStatsThunk } from '@store/invoiceSlice';
import { validateRemarks } from '@utils/financeValidation';
export default function ApprovalActions({ invoice, disabled, onDone }) {
    const { approveOne, rejectOne, approving, rejecting } = useInvoiceApproval();
    const dispatch = useAppDispatch();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [snackbar, setSnackbar] = useState(() => ({ open: false, message: '', severity: 'success' }));
    const remarksError = useMemo(() => validateRemarks(remarks), [remarks]);
    async function handleApprove() {
        setConfirmOpen(false);
        try {
            const res = await approveOne(invoice.id);
            if (res?.meta?.requestStatus === 'fulfilled') {
                dispatch(financeStatsThunk());
                onDone && onDone();
            }
            else {
                setSnackbar({ open: true, message: res?.payload || 'Approve failed', severity: 'error' });
            }
        }
        catch (e) {
            setSnackbar({ open: true, message: e?.message || 'Approve failed', severity: 'error' });
        }
    }
    async function handleReject() {
        if (remarksError)
            return;
        setRejectOpen(false);
        try {
            const res = await rejectOne(invoice.id, remarks);
            if (res?.meta?.requestStatus === 'fulfilled') {
                dispatch(financeStatsThunk());
                onDone && onDone();
            }
            else {
                setSnackbar({ open: true, message: res?.payload || 'Reject failed', severity: 'error' });
            }
        }
        catch (e) {
            setSnackbar({ open: true, message: e?.message || 'Reject failed', severity: 'error' });
        }
    }
    return (_jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Tooltip, { title: "Approve invoice", children: _jsx("span", { children: _jsx(Button, { size: "small", variant: "contained", color: "success", disabled: disabled || approving, onClick: () => setConfirmOpen(true), children: "Approve" }) }) }), _jsx(Tooltip, { title: "Reject with remarks", children: _jsx("span", { children: _jsx(Button, { size: "small", variant: "outlined", color: "error", disabled: disabled || rejecting, onClick: () => setRejectOpen(true), children: "Reject" }) }) }), _jsxs(Dialog, { open: confirmOpen, onClose: () => setConfirmOpen(false), children: [_jsx(DialogTitle, { children: "Confirm Approval" }), _jsx(DialogContent, { children: "Are you sure you want to approve this invoice?" }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setConfirmOpen(false), children: "Cancel" }), _jsx(Button, { variant: "contained", color: "success", onClick: handleApprove, children: "Approve" })] })] }), _jsxs(Dialog, { open: rejectOpen, onClose: () => setRejectOpen(false), children: [_jsx(DialogTitle, { children: "Reject Invoice" }), _jsx(DialogContent, { children: _jsx(TextField, { autoFocus: true, fullWidth: true, label: "Remarks", value: remarks, onChange: (e) => setRemarks(e.target.value), error: Boolean(remarksError), helperText: remarksError || 'Please provide a reason for rejection', multiline: true, minRows: 3 }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setRejectOpen(false), children: "Cancel" }), _jsx(Button, { variant: "contained", color: "error", disabled: Boolean(remarksError), onClick: handleReject, children: "Reject" })] })] }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 4000, onClose: () => setSnackbar((s) => ({ ...s, open: false })), children: _jsx(Alert, { onClose: () => setSnackbar((s) => ({ ...s, open: false })), severity: snackbar.severity, sx: { width: '100%' }, children: snackbar.message }) })] }));
}
