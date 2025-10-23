import { useEffect, useMemo, useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, Typography, TextField, MenuItem, Button, Grid, Checkbox, IconButton, Tooltip, Chip, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { usePendingInvoices } from '@hooks/useFinance';
import ApprovalActions from './ApprovalActions';
import { determinePriority, formatCurrency, formatDate } from '@utils/financeUtils';
import { getPriorityColor } from '@theme/index';
import SortIcon from '@mui/icons-material/Sort';
import { useAppDispatch } from '@hooks/index';
import { approveInvoiceThunk, rejectInvoiceThunk, listPendingThunk } from '@store/invoiceSlice';
import { validateRemarks } from '@utils/financeValidation';
import { Link as RouterLink } from 'react-router-dom';

export default function PendingInvoicesList() {
  const { items, status, load } = usePendingInvoices();
  const [selected, setSelected] = useState<number[]>([]);
  const [batching, setBatching] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>(() => ({ open: false, message: '', severity: 'success' }));
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const remarksError = useMemo(() => validateRemarks(remarks), [remarks]);
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [vendor, setVendor] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const params = useMemo(() => ({
    search: search || undefined,
    department_id: department || undefined,
    vendor_name: vendor || undefined,
    amount_min: amountMin || undefined,
    amount_max: amountMax || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    status: 'pending',
    sort_by: sortBy,
    sort_order: sortOrder
  }), [search, department, vendor, amountMin, amountMax, dateFrom, dateTo, sortBy, sortOrder]);

  useEffect(() => { load(params as any); }, [load, params]);

  // Reset selections when list items change to avoid stale selections
  useEffect(() => { setSelected([]); }, [items]);

  const toggle = (id: number) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleAll = () => setSelected((s) => (s.length === items.length ? [] : items.map((i) => i.id)));

  async function handleBatchApprove() {
    if (selected.length === 0) return;
    setBatching(true);
    try {
      const results = await Promise.all(
        selected.map((id) => dispatch(approveInvoiceThunk({ id })))
      );
      const failures = results.filter((r: any) => r.meta?.requestStatus !== 'fulfilled');
      if (failures.length === 0) {
        setSnackbar({ open: true, message: `Approved ${selected.length} invoice(s)`, severity: 'success' });
      } else if (failures.length === selected.length) {
        setSnackbar({ open: true, message: `All ${selected.length} approvals failed`, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: `Approved ${selected.length - failures.length}, failed ${failures.length}`, severity: 'warning' });
      }
      setSelected([]);
      await load(params as any);
    } finally {
      setBatching(false);
    }
  }

  async function handleBatchReject() {
    if (selected.length === 0) return;
    if (remarksError) return;
    setRejectDialogOpen(false);
    setBatching(true);
    try {
      const results = await Promise.all(
        selected.map((id) => dispatch(rejectInvoiceThunk({ id, remarks } as any)))
      );
      const failures = results.filter((r: any) => r.meta?.requestStatus !== 'fulfilled');
      if (failures.length === 0) {
        setSnackbar({ open: true, message: `Rejected ${selected.length} invoice(s)`, severity: 'success' });
      } else if (failures.length === selected.length) {
        setSnackbar({ open: true, message: `All ${selected.length} rejections failed`, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: `Rejected ${selected.length - failures.length}, failed ${failures.length}`, severity: 'warning' });
      }
      setSelected([]);
      setRemarks('');
      await load(params as any);
    } finally {
      setBatching(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Pending Invoices</Typography>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} /></Grid>
          <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Min Amount" type="number" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} /></Grid>
          <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Max Amount" type="number" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} /></Grid>
          <Grid item xs={6} md={2}><TextField fullWidth size="small" label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} md={2}><TextField fullWidth size="small" label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} md={2}><Button fullWidth variant="outlined" onClick={() => { setSearch(''); setDepartment(''); setVendor(''); setAmountMin(''); setAmountMax(''); setDateFrom(''); setDateTo(''); }}>Reset</Button></Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"><Checkbox checked={selected.length === items.length && items.length > 0} indeterminate={selected.length > 0 && selected.length < items.length} onChange={toggleAll} /></TableCell>
              <TableCell>
                Invoice #
                <IconButton size="small" onClick={() => { setSortBy('invoice_number'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}><SortIcon fontSize="inherit" /></IconButton>
              </TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Dept</TableCell>
              <TableCell>
                Total
                <IconButton size="small" onClick={() => { setSortBy('total_amount'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}><SortIcon fontSize="inherit" /></IconButton>
              </TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((inv) => {
              const priority = determinePriority(inv);
              return (
                <TableRow key={inv.id} hover>
                  <TableCell padding="checkbox"><Checkbox checked={selected.includes(inv.id)} onChange={() => toggle(inv.id)} /></TableCell>
                  <TableCell>
                    <Button size="small" component={RouterLink} to={`/finance/invoices/${inv.id}`}>
                      {inv.Invoice_Number}
                    </Button>
                  </TableCell>
                  <TableCell>{inv.Vendor_Name}</TableCell>
                  <TableCell>{inv.department}</TableCell>
                  <TableCell>{formatCurrency(inv.Total_Amount)}</TableCell>
                  <TableCell>{formatDate(inv.created_at)}</TableCell>
                  <TableCell>
                    <Tooltip title={`Priority: ${priority}`}>
                      <Chip size="small" label={priority.toUpperCase()} sx={{ bgcolor: `${getPriorityColor(priority)}22`, color: getPriorityColor(priority) }} />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" component={RouterLink} to={`/finance/invoices/${inv.id}`}>View</Button>
                      <Button size="small" variant="outlined" component={RouterLink} to={`/finance/invoices/${inv.id}/edit`}>Edit</Button>
                      <ApprovalActions invoice={inv} disabled={batching} />
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">{status === 'loading' ? 'Loading...' : 'No pending invoices'}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {selected.length > 0 && (
        <Paper sx={{ position: 'sticky', bottom: 0, p: 2, display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <Typography variant="body2">{selected.length} selected</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" color="success" disabled={batching} onClick={handleBatchApprove}>Approve Selected</Button>
            <Button variant="outlined" color="error" disabled={batching} onClick={() => setRejectDialogOpen(true)}>Reject Selected</Button>
          </Stack>
        </Paper>
      )}

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Selected Invoices</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            error={Boolean(remarksError)}
            helperText={remarksError || 'Please provide a reason applied to all selected invoices'}
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={Boolean(remarksError) || batching} onClick={handleBatchReject}>Reject</Button>
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


