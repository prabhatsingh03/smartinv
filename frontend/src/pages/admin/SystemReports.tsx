import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Stack, Button } from '@mui/material';
import { exportToCsv } from '@utils/adminUtils';
import * as XLSX from 'xlsx';
import { getComprehensiveReport } from '@services/apiService';

export default function SystemReports() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getComprehensiveReport();
        setReport(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'system-report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    if (!report) return;
    const rows = Array.isArray(report?.invoices_by_department) ? report.invoices_by_department : [];
    exportToCsv('invoices_by_department.csv', rows);
  };

  const exportXlsx = () => {
    if (!report) return;
    const wb = XLSX.utils.book_new();
    const sheet1 = XLSX.utils.json_to_sheet(report?.invoices_by_department || []);
    XLSX.utils.book_append_sheet(wb, sheet1, 'InvoicesByDept');
    const sheet2 = XLSX.utils.json_to_sheet(report?.audit?.action_counts || []);
    XLSX.utils.book_append_sheet(wb, sheet2, 'AuditActionCounts');
    XLSX.writeFile(wb, 'system-report.xlsx');
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5">System Reports</Typography>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2">Comprehensive report generated from backend aggregations.</Typography>
            <Button variant="outlined" onClick={exportJson} disabled={!report}>Export JSON</Button>
            <Button variant="outlined" onClick={exportCsv} disabled={!report}>Export CSV</Button>
            <Button variant="contained" onClick={exportXlsx} disabled={!report}>Export XLSX</Button>
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{loading ? 'Loading...' : JSON.stringify(report, null, 2)}</pre>
        </CardContent>
      </Card>
    </Stack>
  );
}


