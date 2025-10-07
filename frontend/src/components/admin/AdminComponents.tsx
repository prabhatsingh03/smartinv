import { Card, CardContent, Typography, Stack, LinearProgress, List, ListItem, ListItemText, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import type { SystemStatistics, AuditLog, Invoice } from '@types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { prepareTrendChartData } from '@utils/adminUtils';
import { useEffect, useState } from 'react';
import { listPending } from '@services/apiService';

export function StatCard({ title, value, loading }: { title: string; value?: number | string; loading?: boolean }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
        {loading ? <LinearProgress /> : <Typography variant="h5">{value ?? '-'}</Typography>}
      </CardContent>
    </Card>
  );
}

export function StatsGrid({ stats, loading }: { stats?: SystemStatistics; loading?: boolean }) {
  return (
    <Stack direction="row" spacing={2} flexWrap="wrap">
      <StatCard title="Users" value={stats?.users.total} loading={loading} />
      <StatCard title="Active Users" value={stats?.users.active} loading={loading} />
      <StatCard title="Departments" value={stats?.departments.total} loading={loading} />
      <StatCard title="Invoices" value={stats?.invoices.total} loading={loading} />
      <StatCard title="Pending" value={stats?.invoices.pending} loading={loading} />
      <StatCard title="Approved" value={stats?.invoices.approved} loading={loading} />
      <StatCard title="Rejected" value={stats?.invoices.rejected} loading={loading} />
    </Stack>
  );
}

export function ActivityFeed({ logs }: { logs: AuditLog[] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>Recent Activity</Typography>
        <List dense>
          {logs.map((log) => (
            <ListItem key={log.id} divider>
              <ListItemText
                primary={`${log.user_name || 'User ' + log.user_id} ${log.action}${log.invoice_number ? ' #' + log.invoice_number : ''}`}
                secondary={log.timestamp}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export function ChartCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>{title}</Typography>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" hide={false} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3f51b5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function TrendChart({ stats }: { stats?: SystemStatistics }) {
  const data = prepareTrendChartData(stats);
  return <ChartCard title="Invoices Trend (12 months)" data={data} />;
}

export function ActionCountsChart({ items }: { items: { action: string; count: number }[] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>Action Counts</Typography>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={items} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="action" hide={false} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#26a69a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function PendingApprovalsTable({ limit = 20 }: { limit?: number }) {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await listPending({ page: 1, per_page: limit });
        const items = (res as any)?.data?.items || (res as any)?.items || [];
        setRows(items);
      } finally {
        setLoading(false);
      }
    })();
  }, [limit]);

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>Pending Approvals (Top {limit})</Typography>
        {loading ? (
          <LinearProgress />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Invoice Number</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Uploaded By</TableCell>
                <TableCell>Submitted</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{(r as any).invoice_data?.Invoice_Number || '-'}</TableCell>
                  <TableCell>{(r as any).invoice_data?.Vendor_Name || '-'}</TableCell>
                  <TableCell>{(r as any).department || (r as any).department_name || '-'}</TableCell>
                  <TableCell>{(r as any).uploader_name || '-'}</TableCell>
                  <TableCell>{r.submitted_at || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}


