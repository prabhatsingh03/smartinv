import { useEffect, useMemo, useState } from 'react';
import { Grid, Paper, Stack, Typography, Divider, Link, Chip, Button, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Alert } from '@mui/material';
import type { Invoice } from '@types';
import { formatCurrency, formatDate, computeGstSummary } from '@utils/financeUtils';
import { downloadInvoiceFile, getInvoiceAuditLogs } from '@services/apiService';
import { useAppSelector } from '@hooks/index';
import { getCurrentUserRole, getCurrentUserId } from '@utils/auth';

type InvoiceWithPath = Invoice & { file_path?: string | null };

export default function InvoiceReviewForm({ invoice }: { invoice: InvoiceWithPath }) {
  const gst = useMemo(() => computeGstSummary(invoice), [invoice]);
  const { authenticated } = useAppSelector((s) => s.auth);
  const role = getCurrentUserRole();
  const userId = getCurrentUserId();
  const isFinance = role === 'FINANCE' || role === 'SUPER_ADMIN';
  const isUploader = String(userId || '') === String((invoice as any)?.uploaded_by || '');

  type DiffItem = { field: string; from: any; to: any };
  const [diffs, setDiffs] = useState<DiffItem[] | null>(null);
  const [diffError, setDiffError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchDiff() {
      try {
        setDiffError(null);
        setDiffs(null);
        if (!invoice?.id) return;
        // Only show to original uploader (non-finance)
        if (!isUploader || isFinance) return;
        const res: any = await getInvoiceAuditLogs(Number(invoice.id));
        const logs: any[] = ((res as any)?.data?.logs ?? (res as any)?.logs) || [];
        // Find the latest edit with old/new values
        const latest = logs.find((l) => l?.action === 'edited' && (l?.old_values || l?.new_values)) || logs.find((l) => (l?.old_values || l?.new_values));
        if (!latest) return;
        const oldRaw = safeParse(latest.old_values);
        const newRaw = safeParse(latest.new_values);
        if (!oldRaw || !newRaw) return;
        const oldFlat = flattenInvoiceDict(oldRaw);
        const newFlat = flattenInvoiceDict(newRaw);
        const fieldsOfInterest = [
          'Invoice_Number','Invoice_Date','GST_Number','Vendor_Name','Line_Item','HSN_SAC','gst_percent',
          'IGST_Amount','CGST_Amount','SGST_Amount','Basic_Amount','Total_Amount','TDS','Net_Payable','priority'
        ];
        const changes: DiffItem[] = [];
        fieldsOfInterest.forEach((k) => {
          const before = oldFlat[k];
          const after = newFlat[k];
          const norm = (v: any) => (v === undefined || v === null ? '' : String(v));
          if (norm(before) !== norm(after)) {
            changes.push({ field: k, from: before, to: after });
          }
        });
        if (mounted) setDiffs(changes);
      } catch (e: any) {
        if (mounted) setDiffError(e?.message || 'Failed to load changes');
      }
    }
    fetchDiff();
    return () => { mounted = false; };
  }, [invoice?.id, isUploader, isFinance]);

  function safeParse(maybeJson: any) {
    if (!maybeJson) return null;
    if (typeof maybeJson === 'object') return maybeJson;
    try { return JSON.parse(maybeJson); } catch { return null; }
  }

  function flattenInvoiceDict(d: any) {
    const invoiceData = (d && d.invoice_data) || {};
    // Merge invoice_data to top-level for easy comparison
    const merged: Record<string, any> = { ...invoiceData, ...d };
    // Map snake_case to UI keys if present
    const mapping: Record<string, string> = {
      s_no: 'S_No', invoice_date: 'Invoice_Date', invoice_number: 'Invoice_Number', gst_number: 'GST_Number', vendor_name: 'Vendor_Name',
      line_item: 'Line_Item', hsn_sac: 'HSN_SAC', igst_amount: 'IGST_Amount', cgst_amount: 'CGST_Amount', sgst_amount: 'SGST_Amount',
      basic_amount: 'Basic_Amount', total_amount: 'Total_Amount', net_payable: 'Net_Payable', tds: 'TDS'
    };
    const result: Record<string, any> = {};
    Object.keys(merged).forEach((k) => {
      const uiKey = mapping[k] || k;
      result[uiKey] = merged[k];
    });
    return result;
  }
  async function handleViewFile() {
    try {
      const blob = await downloadInvoiceFile(Number(invoice.id));
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      // Optional: revoke later
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      // Fallback to unauthenticated link if needed
      if (invoice.file_url) {
        window.open(invoice.file_url, '_blank', 'noopener,noreferrer');
      }
    }
  }
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Invoice Review</Typography>
          <Chip size="small" label={invoice.status} color={invoice.status === 'APPROVED' ? 'success' : invoice.status === 'REJECTED' ? 'error' : 'warning'} />
        </Stack>
        <Divider />
        {/* Changes made by Finance (visible to original uploader only) */}
        {!isFinance && isUploader && (
          <Stack spacing={1}>
            <Typography variant="subtitle2">Changes made by Finance</Typography>
            {diffError && <Alert severity="error">{diffError}</Alert>}
            {Array.isArray(diffs) && diffs.length > 0 ? (
              <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: 'grey.100', fontWeight: 600, borderBottom: 1, borderColor: 'divider' } }}>
                      <TableCell>Field</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {diffs.map((d, idx) => (
                      <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}>
                        <TableCell>{prettyLabel(d.field)}</TableCell>
                        <TableCell>{renderValue(d.field, d.from)}</TableCell>
                        <TableCell>{renderValue(d.field, d.to)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">No changes detected.</Typography>
            )}
          </Stack>
        )}

        <Divider />

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><Field label="Invoice Number" value={invoice.Invoice_Number} /></Grid>
          <Grid item xs={12} md={3}><Field label="Invoice Date" value={formatDate(invoice.Invoice_Date)} /></Grid>
          <Grid item xs={12} md={3}><Field label="PO Number" value={invoice.PO_Number} /></Grid>
          <Grid item xs={12} md={3}><Field label="GST Number" value={invoice.GST_Number} /></Grid>
          <Grid item xs={12} md={6}><Field label="Vendor Name" value={invoice.Vendor_Name} /></Grid>
          <Grid item xs={12} md={6}><Field label="Serial Number" value={invoice.S_No} /></Grid>


          <Grid item xs={12} md={6}>
            <Field label="File Name" value={invoice.filename} />
            {invoice.file_path && (
              <Typography variant="caption">
                <Button size="small" variant="outlined" onClick={handleViewFile}>View file</Button>
              </Typography>
            )}
          </Grid>
          {/* Show both approval and rejection remarks distinctly when available */}
          {(invoice as any).approval_remarks ? (
            <Grid item xs={12} md={6}>
              <Field label="Approval Remarks" value={(invoice as any).approval_remarks} />
            </Grid>
          ) : null}
          {(invoice as any).rejection_remarks || String((invoice as any).status || '').toLowerCase() === 'rejected' ? (
            <Grid item xs={12} md={6}>
              <Field label="Rejection Remarks" value={(invoice as any).rejection_remarks || '-'} />
            </Grid>
          ) : null}
        </Grid>

        <Divider />
        <Typography variant="subtitle2">Selected Line Items</Typography>
        {Array.isArray(invoice.selected_line_items) && invoice.selected_line_items.length > 0 ? (
          <TableContainer sx={{ maxHeight: 360, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'grey.100', fontWeight: 600, borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell>Line Item</TableCell>
                  <TableCell>HSN/SAC</TableCell>
                  <TableCell align="right">Basic</TableCell>
                  <TableCell align="right">IGST</TableCell>
                  <TableCell align="right">CGST</TableCell>
                  <TableCell align="right">SGST</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.selected_line_items.map((it: any, idx: number) => (
                  <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}>
                    <TableCell sx={{ maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {it.Line_Item ?? it.line_item ?? '-'}
                    </TableCell>
                    <TableCell>{it.HSN_SAC ?? it.hsn_sac ?? '-'}</TableCell>
                    <TableCell align="right">{formatCurrency(it.Basic_Amount ?? it.basic_amount)}</TableCell>
                    <TableCell align="right">{formatCurrency(it.IGST_Amount ?? it.igst_amount)}</TableCell>
                    <TableCell align="right">{formatCurrency(it.CGST_Amount ?? it.cgst_amount)}</TableCell>
                    <TableCell align="right">{formatCurrency(it.SGST_Amount ?? it.sgst_amount)}</TableCell>
                    <TableCell align="right">{formatCurrency(it.Total_Amount ?? it.total_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary">No selected line items provided.</Typography>
        )}

        <Divider />
        <Typography variant="subtitle2">Metadata</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><Field label="Department" value={invoice.department || '-'} /></Grid>
          <Grid item xs={12} md={3}><Field label="Uploaded" value={formatDate(invoice.created_at)} /></Grid>
          <Grid item xs={12} md={3}><Field label="Submitted" value={formatDate(invoice.submitted_at || undefined)} /></Grid>
          <Grid item xs={12} md={3}><Field label="Updated" value={formatDate(invoice.updated_at)} /></Grid>
        </Grid>

        <Divider />
        <Typography variant="subtitle2">Financial Summary</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><Field label="GST %" value={invoice.gst_percent ?? gst.percent} /></Grid>
          <Grid item xs={12} md={3}><Field label="IGST Amount" value={formatCurrency(invoice.IGST_Amount)} /></Grid>
          <Grid item xs={12} md={3}><Field label="CGST Amount" value={formatCurrency(invoice.CGST_Amount)} /></Grid>
          <Grid item xs={12} md={3}><Field label="SGST Amount" value={formatCurrency(invoice.SGST_Amount)} /></Grid>

          <Grid item xs={12} md={3}><Field label="Basic Amount" value={formatCurrency(invoice.Basic_Amount)} /></Grid>
          <Grid item xs={12} md={3}><Field label="Total Amount" value={formatCurrency(invoice.Total_Amount)} /></Grid>
          <Grid item xs={12} md={3}><Field label="TDS" value={formatCurrency(invoice.TDS)} /></Grid>
          <Grid item xs={12} md={3}><Field label="Net Payable" value={formatCurrency(invoice.Net_Payable)} /></Grid>

          <Grid item xs={12} md={3}><Field label="GST Total" value={formatCurrency(gst.total)} /></Grid>
          <Grid item xs={12} md={3}><Field label="Taxable Value" value={formatCurrency(gst.taxable)} /></Grid>
          <Grid item xs={12} md={3}><Field label="Grand Total" value={formatCurrency(gst.grandTotal)} /></Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}

function Field({ label, value }: { label: string; value?: any }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value ?? '-'}</Typography>
    </Stack>
  );
}

function prettyLabel(field: string): string {
  const map: Record<string, string> = {
    Invoice_Number: 'Invoice Number', Invoice_Date: 'Invoice Date', GST_Number: 'GST Number', Vendor_Name: 'Vendor Name',
    Line_Item: 'Line Item', HSN_SAC: 'HSN/SAC', gst_percent: 'GST %', IGST_Amount: 'IGST Amount', CGST_Amount: 'CGST Amount',
    SGST_Amount: 'SGST Amount', Basic_Amount: 'Basic Amount', Total_Amount: 'Total Amount', TDS: 'TDS', Net_Payable: 'Net Payable',
    priority: 'Priority'
  };
  return map[field] || field;
}

function renderValue(field: string, value: any) {
  if (value === null || value === undefined || value === '') return '-';
  if (field.endsWith('_Amount') || field === 'Total_Amount' || field === 'Basic_Amount' || field === 'Net_Payable' || field === 'TDS') {
    return formatCurrency(value);
  }
  if (String(field).toLowerCase().includes('date')) {
    return formatDate(typeof value === 'string' ? value : String(value));
  }
  return String(value);
}


