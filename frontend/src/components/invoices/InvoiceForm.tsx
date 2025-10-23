import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Grid, 
  TextField, 
  Paper, 
  Stack, 
  Typography, 
  Button, 
  Link, 
  Card,
  CardContent,
  CardActionArea,
  Box,
  Divider,
  Chip,
  InputAdornment,
  CircularProgress,
  Alert,
  Checkbox,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import { 
  Receipt, 
  Save, 
  Send, 
  AttachFile,
  CalendarToday,
  Business,
  AccountBalance,
  Description,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@hooks/index';
import { getCurrentUserRole } from '@utils/auth';
import { setFormValues, setValidationErrors, updateInvoiceThunk, submitInvoiceThunk, setSelectedLineItemIndex, setLineItemApplicationStatus, setExtractedLineItems, fetchInvoiceThunk } from '@store/invoiceSlice';
import type { InvoiceFormValues, ExtractedLineItem } from '@types';
import { validateInvoice } from '@utils/invoiceValidation';
import { parseFormToApi, toNumberOrUndefined } from '@utils/invoiceUtils';
import { determinePriority } from '@utils/financeUtils';

export default function InvoiceForm() {
  const dispatch = useAppDispatch();
  const { id: routeParamId } = useParams();
  const paramsId = (() => {
    const n = Number(routeParamId);
    return Number.isFinite(n) ? n : null;
  })();
  const pathId = (() => {
    try {
      const m = String(window.location?.pathname || '').match(/invoices\/(\d+)/);
      return m && m[1] ? Number(m[1]) : null;
    } catch {
      return null;
    }
  })();
  const routeId = Number.isFinite(paramsId as any) ? (paramsId as any) : (Number.isFinite(pathId as any) ? (pathId as any) : null);
  const current = useAppSelector((s) => s.invoices.current);
  const values = useAppSelector((s) => s.invoices.formValues);
  const errors = useAppSelector((s) => s.invoices.validationErrors);
  const extractedLineItems = useAppSelector((s) => s.invoices.extractedLineItems) as ExtractedLineItem[] | undefined;
  const selectedIdx = useAppSelector((s) => s.invoices.selectedLineItemIndex);
  const applyStatus = useAppSelector((s) => s.invoices.lineItemApplicationStatus);
  if (extractedLineItems) {
    try { console.debug('[InvoiceForm] extractedLineItems:', extractedLineItems); } catch {}
  }
  const saveStatus = useAppSelector((s) => s.invoices.saveStatus);
  const submitStatus = useAppSelector((s) => s.invoices.submitStatus);
  const { authenticated } = useAppSelector((s) => s.auth);
  const role = getCurrentUserRole();
  const isFinance = role === 'FINANCE' || role === 'SUPER_ADMIN';
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<any>({});
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState<'success' | 'error' | 'info'>('success');
  const effectiveItems: any[] = useMemo(() => {
    return Array.isArray(extractedLineItems) ? extractedLineItems : [];
  }, [extractedLineItems]);

  // Preselect previously saved line items when editing existing invoice
  useEffect(() => {
    const saved: any[] | undefined = (current as any)?.selected_line_items;
    if (!Array.isArray(saved)) return;
    // If no extracted items loaded, use saved list as the source
    if (effectiveItems.length === 0 && saved.length > 0) {
      dispatch(setExtractedLineItems(saved as any));
    }
    const source = effectiveItems.length > 0 ? effectiveItems : saved;
    if (!source || source.length === 0) return;
    
    // If the extracted items are the same as saved selected items, select all
    if (effectiveItems.length === saved.length && effectiveItems.length > 0) {
      // Check if the items match (they should since Redux slice now uses saved items as extracted)
      const allMatch = effectiveItems.every((item, index) => {
        const savedItem = saved[index];
        if (!savedItem) return false;
        const a = (v: any) => (v === undefined || v === null ? '' : String(v));
        return (
          a(item.Line_Item) === a(savedItem.Line_Item) &&
          a(item.HSN_SAC) === a(savedItem.HSN_SAC) &&
          a(item.Total_Amount) === a(savedItem.Total_Amount)
        );
      });
      if (allMatch) {
        // All items match, select all
        setSelectedIndices(effectiveItems.map((_: any, i: number) => i));
        return;
      }
    }
    
    // Build indices of saved items in the source list
    const indices: number[] = [];
    saved.forEach((s) => {
      const found = source.findIndex((it: any) => {
        const a = (v: any) => (v === undefined || v === null ? '' : String(v));
        return (
          a(it.Line_Item) === a(s.Line_Item) &&
          a(it.HSN_SAC) === a(s.HSN_SAC) &&
          a(it.Total_Amount) === a(s.Total_Amount)
        );
      });
      if (found >= 0) indices.push(found);
    });
    if (indices.length > 0) {
      setSelectedIndices(indices);
    } else if (saved.length > 0) {
      // Fallback: select all if we cannot match one-by-one
      setSelectedIndices(source.map((_: any, i: number) => i));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, effectiveItems.length, dispatch]);

  useEffect(() => {
    const rawId = Number((current as any)?.id ?? routeId ?? pathId);
    const invoiceId = Number.isFinite(rawId) && rawId > 0 ? rawId : null;
    if ((!current || !(current as any)?.id) && invoiceId) {
      dispatch(fetchInvoiceThunk(invoiceId as any));
    }
  }, [current, routeId, pathId, dispatch]);

  // Calculate totals from selected line items
  const financialTotals = useMemo(() => {
    const totals = {
      IGST_Amount: 0,
      CGST_Amount: 0,
      SGST_Amount: 0,
      Basic_Amount: 0,
      Total_Amount: 0,
      TDS: 0,
      Net_Payable: 0
    };

    selectedIndices.forEach(idx => {
      const item = effectiveItems[idx];
      if (item) {
        totals.IGST_Amount += parseFloat(item.IGST_Amount || '0') || 0;
        totals.CGST_Amount += parseFloat(item.CGST_Amount || '0') || 0;
        totals.SGST_Amount += parseFloat(item.SGST_Amount || '0') || 0;
        totals.Basic_Amount += parseFloat(item.Basic_Amount || '0') || 0;
        totals.Total_Amount += parseFloat(item.Total_Amount || '0') || 0;
        totals.TDS += parseFloat(item.TDS || '0') || 0;
        totals.Net_Payable += parseFloat(item.Net_Payable || '0') || 0;
      }
    });

    return totals;
  }, [selectedIndices, effectiveItems]);

  const disabled = useMemo(() => !current, [current]);

  // Auto-sync financial totals into form values until user edits those fields
  useEffect(() => {
    const updates: Partial<InvoiceFormValues> = {};
    const shouldUpdate = (field: keyof InvoiceFormValues) => !touched[field as string];

    if (shouldUpdate('IGST_Amount')) updates.IGST_Amount = financialTotals.IGST_Amount;
    if (shouldUpdate('CGST_Amount')) updates.CGST_Amount = financialTotals.CGST_Amount;
    if (shouldUpdate('SGST_Amount')) updates.SGST_Amount = financialTotals.SGST_Amount;
    if (shouldUpdate('Basic_Amount')) updates.Basic_Amount = financialTotals.Basic_Amount;
    if (shouldUpdate('Total_Amount')) updates.Total_Amount = financialTotals.Total_Amount;
    if (shouldUpdate('TDS')) updates.TDS = financialTotals.TDS;
    if (shouldUpdate('Net_Payable')) updates.Net_Payable = financialTotals.Net_Payable;

    if (Object.keys(updates).length > 0) {
      dispatch(setFormValues(updates));
    }
  }, [selectedIndices, financialTotals, touched, dispatch]);

  function handleChange<K extends keyof InvoiceFormValues>(key: K, value: InvoiceFormValues[K]) {
    dispatch(setFormValues({ [key]: value } as Partial<InvoiceFormValues>));
  }

  function handleBlur(field: keyof InvoiceFormValues) {
    setTouched((t) => ({ ...t, [field as string]: true }));
    const v = validateInvoice(values);
    dispatch(setValidationErrors(v));
  }

  const toNum = (v: any) => toNumberOrUndefined(v) as any;

  function applyExtractedItem(item: ExtractedLineItem, index: number) {
    if (!item) return;
    dispatch(setSelectedLineItemIndex(index));
    dispatch(setLineItemApplicationStatus('applying'));
    try {
      // Using canonical keys set by the slice normalization
      handleChange('Line_Item', (item as any).Line_Item as any);
      handleChange('HSN_SAC', (item as any).HSN_SAC as any);
      handleChange('gst_percent', toNum((item as any).gst_percent));
      handleChange('Basic_Amount', toNum((item as any).Basic_Amount));
      handleChange('IGST_Amount', toNum((item as any).IGST_Amount));
      handleChange('CGST_Amount', toNum((item as any).CGST_Amount));
      handleChange('SGST_Amount', toNum((item as any).SGST_Amount));
      handleChange('Total_Amount', toNum((item as any).Total_Amount));
      setTimeout(() => {
        dispatch(setLineItemApplicationStatus('applied'));
      }, 0);
    } catch {
      dispatch(setLineItemApplicationStatus('failed'));
    }
  }
  function toggleSelected(idx: number) {
    setSelectedIndices((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  }

  function toggleSelectAll() {
    if (selectedIndices.length === effectiveItems.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(effectiveItems.map((_, idx) => idx));
    }
  }
  function openEdit(idx: number) {
    const it: any = effectiveItems[idx] || {};
    setEditDraft({
      Line_Item: it.Line_Item ?? '',
      HSN_SAC: it.HSN_SAC ?? '',
      gst_percent: it.gst_percent ?? '',
      IGST_Amount: it.IGST_Amount ?? '',
      CGST_Amount: it.CGST_Amount ?? '',
      SGST_Amount: it.SGST_Amount ?? '',
      Basic_Amount: it.Basic_Amount ?? '',
      Total_Amount: it.Total_Amount ?? ''
    });
    setEditIndex(idx);
  }
  function closeEdit() { setEditIndex(null); }
  function saveEdit() {
    if (editIndex === null) return;
    try {
      const updated = { ...effectiveItems[editIndex], ...editDraft } as any;
      
      // Update the effectiveItems array with the edited item
      const newEffectiveItems = [...effectiveItems];
      newEffectiveItems[editIndex] = updated;
      
      // Update the extractedLineItems in the store
      dispatch(setExtractedLineItems(newEffectiveItems));
      
      // If this item was selected, update the selected items
      if (selectedIndices.includes(editIndex)) {
        // The selected items will automatically reflect the changes since they reference the same objects
      }
    } finally {
      setEditIndex(null);
      setEditDraft({});
    }
  }

  async function handleSave() {
    if (!current) return;
    const rawId = Number((current as any)?.id ?? routeId ?? pathId);
    const invoiceId = Number.isFinite(rawId) && rawId > 0 ? rawId : null;
    if (!invoiceId) {
      setNotificationMessage('Cannot save: missing invoice id. Please reload and try again.');
      setNotificationSeverity('error');
      setShowNotification(true);
      return;
    }
    
    // Validate that at least one line item is selected
    if (selectedIndices.length === 0) {
      dispatch(setValidationErrors({ line_items: 'Please select at least one line item' }));
      return;
    }
    
    const v = validateInvoice(values);
    dispatch(setValidationErrors(v));
    if (Object.keys(v).length) return;
    
    // Create payload with calculated totals from selected line items (snake_case for backend)
    const payload = {
      ...parseFormToApi({ ...values }),
      igst_amount: financialTotals.IGST_Amount,
      cgst_amount: financialTotals.CGST_Amount,
      sgst_amount: financialTotals.SGST_Amount,
      basic_amount: financialTotals.Basic_Amount,
      total_amount: financialTotals.Total_Amount,
      tds: financialTotals.TDS,
      net_payable: financialTotals.Net_Payable,
      // Include selected line items for reference
      selected_line_items: selectedIndices.map(idx => effectiveItems[idx]),
      // Calculate priority based on total amount
      priority: determinePriority({ Total_Amount: financialTotals.Total_Amount })
    } as any;
    
    // For Finance, save without converting to draft; preserve current status
    const result = await dispatch(
      updateInvoiceThunk({ 
        id: invoiceId as any, 
        payload: isFinance ? payload : { ...payload, action: 'save' } as any 
      })
    );
    
    if (updateInvoiceThunk.fulfilled.match(result)) {
      setNotificationMessage('Changes saved successfully!');
      setNotificationSeverity('success');
      setShowNotification(true);
    } else {
      setNotificationMessage('Failed to save changes');
      setNotificationSeverity('error');
      setShowNotification(true);
    }
  }

  async function handleSubmit() {
    console.log('handleSubmit called', { current, selectedIndices: selectedIndices.length });
    if (!current) {
      console.log('No current invoice, returning');
      return;
    }
    const rawId = Number((current as any)?.id ?? routeId ?? pathId);
    const invoiceId = Number.isFinite(rawId) && rawId > 0 ? rawId : null;
    if (!invoiceId) {
      setNotificationMessage('Cannot submit: missing invoice id. Please reload and try again.');
      setNotificationSeverity('error');
      setShowNotification(true);
      return;
    }
    
    // Prevent submission if not saved yet (extracted state)
    if ((current as any)?.status === 'extracted') {
      setNotificationMessage('Please save changes before submitting for approval');
      setNotificationSeverity('info');
      setShowNotification(true);
      return;
    }

    // Validate that at least one line item is selected
    if (selectedIndices.length === 0) {
      console.log('No line items selected, showing error');
      dispatch(setValidationErrors({ line_items: 'Please select at least one line item' }));
      return;
    }
    
    console.log('Line items validation passed, checking form validation...');
    const v = validateInvoice(values);
    console.log('Validation result:', v);
    dispatch(setValidationErrors(v));
    if (Object.keys(v).length) {
      console.log('Validation failed, returning');
      return;
    }
    console.log('Validation passed, continuing...');
    
  // Create payload with calculated totals from selected line items (snake_case for backend)
  const payload = {
    ...parseFormToApi({ ...values }),
    igst_amount: financialTotals.IGST_Amount,
    cgst_amount: financialTotals.CGST_Amount,
    sgst_amount: financialTotals.SGST_Amount,
    basic_amount: financialTotals.Basic_Amount,
    total_amount: financialTotals.Total_Amount,
    tds: financialTotals.TDS,
    net_payable: financialTotals.Net_Payable,
    // Include selected line items for reference
    selected_line_items: selectedIndices.map(idx => effectiveItems[idx]),
    // Calculate priority based on total amount
    priority: determinePriority({ Total_Amount: financialTotals.Total_Amount })
  } as any;
    
    console.log('Creating payload and calling updateInvoiceThunk...');
    const result = await dispatch(
      updateInvoiceThunk({ id: invoiceId as any, payload: payload as any })
    );
    console.log('updateInvoiceThunk result:', result);
    
    if (updateInvoiceThunk.fulfilled.match(result)) {
      console.log('Update successful, calling submitInvoiceThunk...');
      const submitResult = await dispatch(submitInvoiceThunk(invoiceId as any));
      console.log('submitInvoiceThunk result:', submitResult);
      
      if (submitInvoiceThunk.fulfilled.match(submitResult)) {
        console.log('Submit successful!');
        setNotificationMessage('Invoice submitted for approval successfully!');
        setNotificationSeverity('success');
        setShowNotification(true);
      } else {
        console.log('Submit failed:', submitResult);
        setNotificationMessage('Failed to submit for approval');
        setNotificationSeverity('error');
        setShowNotification(true);
      }
    } else {
      console.log('Update failed:', result);
      setNotificationMessage('Failed to update invoice before submission');
      setNotificationSeverity('error');
      setShowNotification(true);
    }
  }

  const field = (name: keyof InvoiceFormValues, label: string, type: string = 'text', icon?: React.ReactElement) => (
    <TextField
      fullWidth
      size="small"
      label={label}
      value={(values[name] as any) ?? ''}
      onChange={(e) => handleChange(name, type === 'number' ? (toNumberOrUndefined(e.target.value) as any) : (e.target.value as any))}
      onBlur={() => handleBlur(name)}
      error={touched[name as string] && Boolean(errors[name as string])}
      helperText={touched[name as string] ? errors[name as string] : ''}
      type={type}
      disabled={disabled}
      InputProps={{
        startAdornment: icon ? (
          <InputAdornment position="start">
            {icon}
          </InputAdornment>
        ) : undefined,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2
        }
      }}
    />
  );

  if (!current) {
    return (
      <Card sx={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Receipt sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No Invoice Selected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please select an invoice to view and edit its details
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box>
        <Typography variant="h5" sx={{ 
          fontWeight: 700, 
          color: 'text.primary',
          mb: 1,
          letterSpacing: '-0.025em'
        }}>
          Invoice Details
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and edit invoice information
        </Typography>
      </Box>

      {/* Invoice Form */}
      <Card sx={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={4}>
            {/* Basic Information */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                <Receipt color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Basic Information
                </Typography>
              </Stack>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  {field('Invoice_Number', 'Invoice Number', 'text', <Receipt />)}
                </Grid>
                <Grid item xs={12} md={3}>
                  {field('Invoice_Date', 'Invoice Date', 'date', <CalendarToday />)}
                </Grid>
                <Grid item xs={12} md={3}>
                  {field('PO_Number', 'PO Number', 'text', <Receipt />)}
                </Grid>
                <Grid item xs={12} md={3}>
                  {field('GST_Number', 'GST Number', 'text', <AccountBalance />)}
                </Grid>
                <Grid item xs={12} md={6}>
                  {field('Vendor_Name', 'Vendor Name', 'text', <Business />)}
                </Grid>
                <Grid item xs={12} md={6}>
                  {field('S_No', 'Serial Number', 'text')}
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Line Item Details */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                <Description color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Line Item Details
                </Typography>
              </Stack>
              {!!(extractedLineItems && extractedLineItems.length > 0) && (
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Alert severity="info" sx={{ flex: 1, mr: 2 }}>
                      {extractedLineItems.length > 1
                        ? `${extractedLineItems.length} line items detected. Click a card to select.`
                        : '1 line item detected. Click the card to select.'}
                    </Alert>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={toggleSelectAll}
                      sx={{ minWidth: 120 }}
                    >
                      {selectedIndices.length === effectiveItems.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </Stack>
                  <Grid container spacing={2}>
                    {extractedLineItems.map((it, idx) => {
                      const isSelected = selectedIdx === idx;
                      const title = (it as any).Line_Item || `Item ${idx + 1}`;
                      const basic = (it as any).Basic_Amount;
                      const gstPercent = (it as any).gst_percent;
                      const hsn = (it as any).HSN_SAC;
                      const igst = (it as any).IGST_Amount;
                      const cgst = (it as any).CGST_Amount;
                      const sgst = (it as any).SGST_Amount;
                      return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                          <Card
                            elevation={isSelected ? 6 : 1}
                            sx={{
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: isSelected ? 'primary.main' : 'divider',
                              transition: 'all 0.2s ease',
                              '&:hover': { boxShadow: 6, borderColor: 'primary.light' }
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                              <Checkbox
                                color="primary"
                                checked={selectedIndices.includes(idx)}
                                onChange={() => toggleSelected(idx)}
                                inputProps={{ 'aria-label': `Select line item ${idx + 1}` }}
                              />
                              <IconButton size="small" onClick={() => openEdit(idx)} aria-label="Edit line item">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <CardActionArea onClick={() => toggleSelected(idx)} aria-label={`Select line item ${idx + 1}`}>
                              <CardContent>
                                <Stack spacing={1}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                                    {title}
                                  </Typography>
                                  <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {typeof basic !== 'undefined' && (
                                      <Chip size="small" label={`Basic: ${basic}`} />
                                    )}
                                    {typeof gstPercent !== 'undefined' && (
                                      <Chip size="small" label={`GST%: ${gstPercent}`} />
                                    )}
                                    {typeof hsn !== 'undefined' && (
                                      <Chip size="small" label={`HSN/SAC: ${hsn}`} />
                                    )}
                                  </Stack>
                                  <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {typeof igst !== 'undefined' && (
                                      <Chip size="small" variant="outlined" label={`IGST: ${igst}`} />
                                    )}
                                    {typeof cgst !== 'undefined' && (
                                      <Chip size="small" variant="outlined" label={`CGST: ${cgst}`} />
                                    )}
                                    {typeof sgst !== 'undefined' && (
                                      <Chip size="small" variant="outlined" label={`SGST: ${sgst}`} />
                                    )}
                                  </Stack>
                                  {isSelected && (
                                    <Typography variant="caption" color="primary">
                                      {applyStatus === 'applied' ? 'Applied to form' : applyStatus === 'applying' ? 'Applying...' : ''}
                                    </Typography>
                                  )}
                                </Stack>
                              </CardContent>
                            </CardActionArea>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}
              {!!selectedIndices.length && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Selected Line Items ({selectedIndices.length})</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Line Item</TableCell>
                          <TableCell>HSN/SAC</TableCell>
                          <TableCell align="right">GST %</TableCell>
                          <TableCell align="right">IGST</TableCell>
                          <TableCell align="right">CGST</TableCell>
                          <TableCell align="right">SGST</TableCell>
                          <TableCell align="right">Basic</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedIndices.map((idx, i) => {
                          const it: any = effectiveItems[idx] || {};
                          return (
                            <TableRow key={idx} hover>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell>{it.Line_Item ?? ''}</TableCell>
                              <TableCell>{it.HSN_SAC ?? ''}</TableCell>
                              <TableCell align="right">{it.gst_percent ?? ''}</TableCell>
                              <TableCell align="right">{it.IGST_Amount ?? ''}</TableCell>
                              <TableCell align="right">{it.CGST_Amount ?? ''}</TableCell>
                              <TableCell align="right">{it.SGST_Amount ?? ''}</TableCell>
                              <TableCell align="right">{it.Basic_Amount ?? ''}</TableCell>
                              <TableCell align="right">{it.Total_Amount ?? ''}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
              {errors.line_items && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {errors.line_items}
                </Alert>
              )}
            </Box>

            <Divider />

            {/* Financial Details */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                <AttachFile color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Financial Details
                </Typography>
              </Stack>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="IGST Amount"
                    value={values.IGST_Amount !== undefined ? values.IGST_Amount : financialTotals.IGST_Amount}
                    onChange={(e) => handleChange('IGST_Amount', toNumberOrUndefined(e.target.value))}
                    onBlur={() => handleBlur('IGST_Amount')}
                    error={touched.IGST_Amount && Boolean(errors.IGST_Amount)}
                    helperText={touched.IGST_Amount ? errors.IGST_Amount : ''}
                    type="number"
                    disabled={disabled}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="CGST Amount"
                    value={values.CGST_Amount !== undefined ? values.CGST_Amount : financialTotals.CGST_Amount}
                    onChange={(e) => handleChange('CGST_Amount', toNumberOrUndefined(e.target.value))}
                    onBlur={() => handleBlur('CGST_Amount')}
                    error={touched.CGST_Amount && Boolean(errors.CGST_Amount)}
                    helperText={touched.CGST_Amount ? errors.CGST_Amount : ''}
                    type="number"
                    disabled={disabled}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="SGST Amount"
                    value={values.SGST_Amount !== undefined ? values.SGST_Amount : financialTotals.SGST_Amount}
                    onChange={(e) => handleChange('SGST_Amount', toNumberOrUndefined(e.target.value))}
                    onBlur={() => handleBlur('SGST_Amount')}
                    error={touched.SGST_Amount && Boolean(errors.SGST_Amount)}
                    helperText={touched.SGST_Amount ? errors.SGST_Amount : ''}
                    type="number"
                    disabled={disabled}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="TDS Amount"
                    value={values.TDS !== undefined ? values.TDS : financialTotals.TDS}
                    onChange={(e) => handleChange('TDS', toNumberOrUndefined(e.target.value))}
                    onBlur={() => handleBlur('TDS')}
                    error={touched.TDS && Boolean(errors.TDS)}
                    helperText={touched.TDS ? errors.TDS : ''}
                    type="number"
                    disabled={disabled}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Basic Amount"
                    value={values.Basic_Amount !== undefined ? values.Basic_Amount : financialTotals.Basic_Amount}
                    onChange={(e) => handleChange('Basic_Amount', toNumberOrUndefined(e.target.value))}
                    onBlur={() => handleBlur('Basic_Amount')}
                    error={touched.Basic_Amount && Boolean(errors.Basic_Amount)}
                    helperText={touched.Basic_Amount ? errors.Basic_Amount : ''}
                    type="number"
                    disabled={disabled}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Total Amount"
                    value={values.Total_Amount !== undefined ? values.Total_Amount : financialTotals.Total_Amount}
                    onChange={(e) => handleChange('Total_Amount', toNumberOrUndefined(e.target.value))}
                    onBlur={() => handleBlur('Total_Amount')}
                    error={touched.Total_Amount && Boolean(errors.Total_Amount)}
                    helperText={touched.Total_Amount ? errors.Total_Amount : ''}
                    type="number"
                    disabled={disabled}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Net Payable"
                    value={values.Net_Payable !== undefined ? values.Net_Payable : financialTotals.Net_Payable}
                    onChange={(e) => handleChange('Net_Payable', toNumberOrUndefined(e.target.value))}
                    onBlur={() => handleBlur('Net_Payable')}
                    error={touched.Net_Payable && Boolean(errors.Net_Payable)}
                    helperText={touched.Net_Payable ? errors.Net_Payable : ''}
                    type="number"
                    disabled={disabled}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Additional Information */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                <AttachFile color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Additional Information
                </Typography>
              </Stack>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="File Name"
                    value={(values.filename as any) ?? ''}
                    InputProps={{ 
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachFile />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                  {current?.file_url && (
                    <Box sx={{ mt: 1 }}>
                      <Link 
                        href={current.file_url} 
                        target="_blank" 
                        rel="noopener"
                        sx={{ 
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        <Chip 
                          icon={<AttachFile />}
                          label="View Attached File" 
                          variant="outlined"
                          clickable
                          size="small"
                        />
                      </Link>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  {field('remarks', 'Remarks', 'text')}
                </Grid>
              </Grid>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ 
              pt: 2, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              borderRadius: 2,
              p: 3,
              mt: 2
            }}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button 
                  disabled={!current || saveStatus === 'loading' || selectedIndices.length === 0} 
                  variant="outlined" 
                  onClick={handleSave}
                  startIcon={saveStatus === 'loading' ? <CircularProgress size={16} /> : <Save />}
                  sx={{ borderRadius: 2 }}
                >
                  {saveStatus === 'loading' 
                    ? (isFinance ? 'Saving Changes...' : ((current as any)?.status === 'draft' ? 'Updating Draft...' : 'Saving Changes...'))
                    : (isFinance ? 'Save Changes' : ((current as any)?.status === 'draft' ? 'Update Draft' : 'Save Changes'))}
                </Button>
                {!isFinance && (
                  <Button 
                    disabled={!current || submitStatus === 'loading' || selectedIndices.length === 0} 
                    variant="contained" 
                    onClick={() => {
                      console.log('Submit button clicked', { 
                        current: !!current, 
                        submitStatus, 
                        selectedIndices: selectedIndices.length,
                        disabled: !current || submitStatus === 'loading' || selectedIndices.length === 0
                      });
                      handleSubmit();
                    }}
                    startIcon={submitStatus === 'loading' ? <CircularProgress size={16} /> : <Send />}
                    sx={{ borderRadius: 2 }}
                    title={
                      !current ? 'No invoice loaded' :
                      selectedIndices.length === 0 ? 'Please select at least one line item' :
                      (current as any)?.status === 'extracted' ? 'Save changes before submitting' :
                      submitStatus === 'loading' ? 'Submitting...' :
                      'Submit for approval'
                    }
                  >
                    {submitStatus === 'loading' ? 'Submitting...' : 'Submit for Approval'}
                  </Button>
                )}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editIndex !== null} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit Line Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Line Item" value={editDraft.Line_Item ?? ''} onChange={(e) => setEditDraft({ ...editDraft, Line_Item: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth size="small" label="HSN/SAC" value={editDraft.HSN_SAC ?? ''} onChange={(e) => setEditDraft({ ...editDraft, HSN_SAC: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="GST %" type="number" value={editDraft.gst_percent ?? ''} onChange={(e) => setEditDraft({ ...editDraft, gst_percent: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="IGST" type="number" value={editDraft.IGST_Amount ?? ''} onChange={(e) => setEditDraft({ ...editDraft, IGST_Amount: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="CGST" type="number" value={editDraft.CGST_Amount ?? ''} onChange={(e) => setEditDraft({ ...editDraft, CGST_Amount: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="SGST" type="number" value={editDraft.SGST_Amount ?? ''} onChange={(e) => setEditDraft({ ...editDraft, SGST_Amount: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Basic" type="number" value={editDraft.Basic_Amount ?? ''} onChange={(e) => setEditDraft({ ...editDraft, Basic_Amount: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Total" type="number" value={editDraft.Total_Amount ?? ''} onChange={(e) => setEditDraft({ ...editDraft, Total_Amount: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={showNotification}
        autoHideDuration={4000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowNotification(false)} 
          severity={notificationSeverity} 
          sx={{ width: '100%' }}
        >
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Stack>
  );
}


