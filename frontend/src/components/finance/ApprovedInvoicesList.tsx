import { useEffect, useMemo, useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, Typography, TextField, Button, Grid, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Select, FormControl, InputLabel } from '@mui/material';
import api from '@services/apiService';
import { useApprovedInvoices } from '@hooks/useFinance';
import { toCsv, formatCurrency, formatDate } from '@utils/financeUtils';

export default function ApprovedInvoicesList() {
  const { items, status, load } = useApprovedInvoices();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [vendor, setVendor] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const params = useMemo(() => ({
    search: search || undefined,
    department_id: department || undefined,
    vendor_name: vendor || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    amount_min: amountMin || undefined,
    amount_max: amountMax || undefined,
    payment_status: paymentStatus || undefined,
    status: 'APPROVED'
  }), [search, department, vendor, dateFrom, dateTo, amountMin, amountMax, paymentStatus]);

  useEffect(() => { load(params as any); }, [load, params]);

  function exportCsv() {
    const rows = items.map((i) => ({
      id: i.id,
      invoice_number: i.Invoice_Number,
      vendor: i.Vendor_Name,
      department: i.department,
      total: i.Total_Amount,
      approved_at: i.approved_at,
      uploaded_at: i.created_at
    }));
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approved_invoices.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Approved Invoices</Typography>
        <Button variant="outlined" onClick={exportCsv}>Export CSV</Button>
      </Stack>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} /></Grid>
          <Grid item xs={6} md={2}><TextField fullWidth size="small" label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} md={2}><TextField fullWidth size="small" label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Min Amount" type="number" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} /></Grid>
          <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Max Amount" type="number" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} /></Grid>
          <Grid item xs={12} md={2}>
            <TextField fullWidth select size="small" label="Payment Status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PAID">PAID</MenuItem>
              <MenuItem value="UNPAID">UNPAID</MenuItem>
              <MenuItem value="PARTIAL">PARTIAL</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={1}><Button fullWidth variant="outlined" onClick={() => { setSearch(''); setDepartment(''); setVendor(''); setDateFrom(''); setDateTo(''); setAmountMin(''); setAmountMax(''); setPaymentStatus(''); }}>Reset</Button></Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Dept</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Approved</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Paid Date</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((inv) => (
              <TableRow key={inv.id} hover>
                <TableCell>{inv.Invoice_Number}</TableCell>
                <TableCell>{inv.Vendor_Name}</TableCell>
                <TableCell>{inv.department}</TableCell>
                <TableCell>{formatCurrency(inv.Total_Amount)}</TableCell>
                <TableCell>{formatDate(inv.approved_at || undefined)}</TableCell>
                <TableCell>{formatDate(inv.created_at)}</TableCell>
                <TableCell>{(inv as any).payment_status || '-'}</TableCell>
                <TableCell>{formatDate((inv as any).paid_at)}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => { setEditId(inv.id); setEditStatus((inv as any).payment_status || ''); setEditAmount(String((inv as any).amount_paid ?? '')); setEditOpen(true); }}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">{status === 'loading' ? 'Loading...' : 'No approved invoices'}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit Payment Status</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="pay-status">Payment Status</InputLabel>
              <Select labelId="pay-status" label="Payment Status" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <MenuItem value="DUE_NOT_PAID">Due and not Paid</MenuItem>
                <MenuItem value="DUE_PARTIAL">Due and Partially Paid</MenuItem>
                <MenuItem value="DUE_FULL">Due and Fully Paid</MenuItem>
                <MenuItem value="NOT_DUE">Not Due</MenuItem>
              </Select>
            </FormControl>
            {editStatus === 'DUE_PARTIAL' && (
              <TextField size="small" type="number" label="Amount Paid" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => {
            if (!editId) return;
            const payload: any = { payment_status: editStatus };
            if (editStatus === 'DUE_PARTIAL') payload.amount_paid = Number(editAmount || 0);
            if (editStatus === 'DUE_PARTIAL' || editStatus === 'DUE_FULL') payload.paid_at = new Date().toISOString();
            await api.put(`invoices/${editId}`, payload);
            setEditOpen(false);
            load(params as any);
          }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}



