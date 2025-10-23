import { useEffect, useMemo, useState } from 'react';
import { Stack, Paper, Typography, Button, Skeleton, Alert } from '@mui/material';
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
  const [invalidId, setInvalidId] = useState<string | null>(null);

  useEffect(() => {
    const invoiceId = Number(id);
    if (!Number.isFinite(invoiceId)) {
      setInvalidId('Invalid invoice id');
      return;
    }
    setInvalidId(null);
    dispatch(fetchInvoiceThunk(invoiceId));
  }, [dispatch, id]);

  if (invalidId) return <Alert severity="error">{invalidId}</Alert>;
  if (error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2} alignItems="flex-start">
          <Alert severity="error">{error}</Alert>
          <Button variant="outlined" onClick={() => id && dispatch(fetchInvoiceThunk(Number(id)))}>Retry</Button>
        </Stack>
      </Paper>
    );
  }
  if (!current) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rectangular" height={120} />
        <Skeleton variant="rectangular" height={200} />
      </Stack>
    );
  }

  // Permission: Finance/Super Admin can always manage; uploader can edit only if not approved or rejected
  const isUploader = String(userId || '') === String(current.uploaded_by || '');
  const status = String(current.status || '').toLowerCase();
  const isFinance = role === 'FINANCE' || role === 'SUPER_ADMIN';
  const canEdit = Boolean(
    isFinance ||
    (isUploader && status !== 'approved' && status !== 'rejected')
  );

  return (
    <Stack spacing={2}>
      {isEdit ? (
        canEdit ? (
          <InvoiceForm />
        ) : (
          <Alert severity="error">You do not have permission to edit this invoice.</Alert>
        )
      ) : (
        <InvoiceReviewForm invoice={current} />
      )}
      {!isEdit && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
            <Stack direction="row" spacing={1}>
              {canEdit && (
                <Button variant="outlined" onClick={() => navigate(`/finance/invoices/${current.id}/edit`)}>
                  Edit
                </Button>
              )}
              {canEdit && (
                <ApprovalActions invoice={current} onDone={() => navigate(-1)} />
              )}
            </Stack>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}


