import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Stack, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { exportToCsv } from '@utils/adminUtils';
import { useAppDispatch, useAppSelector } from '@hooks/index';
import { fetchAuditLogs, fetchAuditStatistics } from '@store/superAdminSlice';

export default function AuditTrail() {
  const dispatch = useAppDispatch();
  const logs = useAppSelector((s) => s.superAdmin.auditLogs);
  const stats = useAppSelector((s) => s.superAdmin.auditStats);
  const [userId, setUserId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    dispatch(fetchAuditLogs({ limit: 100 }));
    dispatch(fetchAuditStatistics());
  }, [dispatch]);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Audit Trail</Typography>
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} size="small" />
            <TextField label="Invoice ID" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} size="small" />
            <TextField label="Action" value={action} onChange={(e) => setAction(e.target.value)} size="small" />
            <TextField label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
            <Button
              variant="contained"
              onClick={() =>
                dispatch(
                  fetchAuditLogs({
                    user_id: userId ? Number(userId) : undefined,
                    invoice_id: invoiceId ? Number(invoiceId) : undefined,
                    action: action || undefined,
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined
                  })
                )
              }
            >
              Apply
            </Button>
            <Button
              variant="outlined"
              onClick={() => exportToCsv('audit-logs.csv', logs.map(l => ({
                id: l.id,
                user: l.user_name || l.user_id,
                action: l.action,
                invoice: l.invoice_number || l.invoice_id || '',
                timestamp: l.timestamp,
                remarks: l.remarks || ''
              })))}
              disabled={!logs.length}
            >
              Export CSV
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Logs</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.timestamp}</TableCell>
                  <TableCell>{l.user_name || l.user_id}</TableCell>
                  <TableCell>{l.action}</TableCell>
                  <TableCell>{l.invoice_number || l.invoice_id || '-'}</TableCell>
                  <TableCell>{l.remarks || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Statistics</Typography>
            <Typography variant="body2">Total Logs: {stats.total_logs}</Typography>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}


