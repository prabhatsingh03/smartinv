import { useMemo, useState } from 'react';
import { Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip, Snackbar, Alert } from '@mui/material';
import type { Invoice } from '@types';
import { useInvoiceApproval } from '@hooks/useFinance';
import { useAppDispatch } from '@hooks/index';
import { financeStatsThunk } from '@store/invoiceSlice';
import { validateRemarks } from '@utils/financeValidation';

export default function ApprovalActions({ invoice, disabled, onDone }: { invoice: Invoice; disabled?: boolean; onDone?: () => void }) {
  const { approveOne, rejectOne, approving, rejecting } = useInvoiceApproval();
  const dispatch = useAppDispatch();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>(() => ({ open: false, message: '', severity: 'success' }));
  const remarksError = useMemo(() => validateRemarks(remarks), [remarks]);

  async function handleApprove() {
    setConfirmOpen(false);
    try {
      const res: any = await approveOne(invoice.id);
      if (res?.meta?.requestStatus === 'fulfilled') {
        dispatch(financeStatsThunk());
        onDone && onDone();
      } else {
        setSnackbar({ open: true, message: (res?.payload as string) || 'Approve failed', severity: 'error' });
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Approve failed', severity: 'error' });
    }
  }

  async function handleReject() {
    if (remarksError) return;
    setRejectOpen(false);
    try {
      const res: any = await rejectOne(invoice.id, remarks);
      if (res?.meta?.requestStatus === 'fulfilled') {
        dispatch(financeStatsThunk());
        onDone && onDone();
      } else {
        setSnackbar({ open: true, message: (res?.payload as string) || 'Reject failed', severity: 'error' });
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Reject failed', severity: 'error' });
    }
  }

  return (
    <Stack direction="row" spacing={1}>
      <Tooltip title="Approve invoice">
        <span>
          <Button size="small" variant="contained" color="success" disabled={disabled || approving} onClick={() => setConfirmOpen(true)}>
            Approve
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Reject with remarks">
        <span>
          <Button size="small" variant="outlined" color="error" disabled={disabled || rejecting} onClick={() => setRejectOpen(true)}>
            Reject
          </Button>
        </span>
      </Tooltip>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Approval</DialogTitle>
        <DialogContent>Are you sure you want to approve this invoice?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApprove}>Approve</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)}>
        <DialogTitle>Reject Invoice</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            error={Boolean(remarksError)}
            helperText={remarksError || 'Please provide a reason for rejection'}
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={Boolean(remarksError)} onClick={handleReject}>Reject</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}


