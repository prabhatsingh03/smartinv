import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Stack, Button } from '@mui/material';
import { exportToCsv } from '@utils/adminUtils';
import * as XLSX from 'xlsx';
import { getComprehensiveReport } from '@services/apiService';
export default function SystemReports() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = await getComprehensiveReport();
                setReport(data);
            }
            finally {
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
        if (!report)
            return;
        const rows = Array.isArray(report?.invoices_by_department) ? report.invoices_by_department : [];
        exportToCsv('invoices_by_department.csv', rows);
    };
    const exportXlsx = () => {
        if (!report)
            return;
        const wb = XLSX.utils.book_new();
        const sheet1 = XLSX.utils.json_to_sheet(report?.invoices_by_department || []);
        XLSX.utils.book_append_sheet(wb, sheet1, 'InvoicesByDept');
        const sheet2 = XLSX.utils.json_to_sheet(report?.audit?.action_counts || []);
        XLSX.utils.book_append_sheet(wb, sheet2, 'AuditActionCounts');
        XLSX.writeFile(wb, 'system-report.xlsx');
    };
    return (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "h5", children: "System Reports" }), _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Stack, { direction: "row", spacing: 2, alignItems: "center", children: [_jsx(Typography, { variant: "body2", children: "Comprehensive report generated from backend aggregations." }), _jsx(Button, { variant: "outlined", onClick: exportJson, disabled: !report, children: "Export JSON" }), _jsx(Button, { variant: "outlined", onClick: exportCsv, disabled: !report, children: "Export CSV" }), _jsx(Button, { variant: "contained", onClick: exportXlsx, disabled: !report, children: "Export XLSX" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { children: _jsx("pre", { style: { margin: 0, whiteSpace: 'pre-wrap' }, children: loading ? 'Loading...' : JSON.stringify(report, null, 2) }) }) })] }));
}
