import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@hooks/index';
import { listPendingThunk, listApprovedThunk, approveInvoiceThunk, rejectInvoiceThunk, financeStatsThunk } from '@store/invoiceSlice';
export function usePendingInvoices() {
    const dispatch = useAppDispatch();
    const items = useAppSelector((s) => s.invoices.pendingItems);
    const status = useAppSelector((s) => s.invoices.pendingStatus);
    const load = useCallback((params) => dispatch(listPendingThunk(params)), [dispatch]);
    return { items, status, load };
}
export function useApprovedInvoices() {
    const dispatch = useAppDispatch();
    const items = useAppSelector((s) => s.invoices.approvedItems);
    const status = useAppSelector((s) => s.invoices.approvedStatus);
    const load = useCallback((params) => dispatch(listApprovedThunk(params)), [dispatch]);
    return { items, status, load };
}
export function useInvoiceApproval() {
    const dispatch = useAppDispatch();
    const approving = useAppSelector((s) => s.invoices.approving);
    const rejecting = useAppSelector((s) => s.invoices.rejecting);
    const approveOne = useCallback((id, remarks) => dispatch(approveInvoiceThunk({ id, remarks })), [dispatch]);
    const rejectOne = useCallback((id, remarks) => dispatch(rejectInvoiceThunk({ id, remarks })), [dispatch]);
    return { approveOne, rejectOne, approving, rejecting };
}
export function useFinanceStatistics() {
    const dispatch = useAppDispatch();
    const stats = useAppSelector((s) => s.invoices.financeStats);
    const status = useAppSelector((s) => s.invoices.statsStatus);
    const refresh = useCallback(() => dispatch(financeStatsThunk()), [dispatch]);
    return { stats, status, refresh };
}
