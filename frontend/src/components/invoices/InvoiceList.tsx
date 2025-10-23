import { useEffect, useMemo, useState } from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Stack, 
  Typography, 
  TextField, 
  MenuItem, 
  Button, 
  Grid, 
  TablePagination, 
  IconButton,
  Box,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { 
  Search, 
  FilterList, 
  Sort, 
  Refresh,
  Receipt,
  Business,
  CurrencyRupee
} from '@mui/icons-material';
import { useInvoiceList } from '@hooks/useInvoice';
import { StatusBadge, InvoiceActions } from './InvoiceComponents';
import { determinePriority, formatCurrency } from '@utils/financeUtils';
import { getPriorityColor } from '@theme/index';

export default function InvoiceList() {
  const { items, listStatus, load } = useInvoiceList();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const params = useMemo(() => ({
    search: search || undefined,
    status: status || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page: page + 1,
    per_page: rowsPerPage,
    sort_by: sortBy,
    sort_order: sortOrder
  }), [search, status, dateFrom, dateTo, page, rowsPerPage, sortBy, sortOrder]);
  
  useEffect(() => {
    load(params);
  }, [load, params]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
  };

  const filteredItems = (items || []).filter((inv: any) => String(inv.status || '').toLowerCase() !== 'extracted');

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
          Invoice Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage all invoices in your system
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <FilterList color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filters & Search
            </Typography>
          </Stack>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField 
                fullWidth 
                size="small" 
                label="Search invoices..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField 
                select 
                fullWidth 
                size="small" 
                label="Status" 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending">Pending Approval</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField 
                fullWidth 
                size="small" 
                label="From Date" 
                type="date" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)} 
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField 
                fullWidth 
                size="small" 
                label="To Date" 
                type="date" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)} 
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                fullWidth 
                variant="outlined" 
                onClick={resetFilters}
                startIcon={<Refresh />}
                sx={{ borderRadius: 2 }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Receipt fontSize="small" />
                    <span>Invoice #</span>
                    <IconButton 
                      size="small" 
                      onClick={() => handleSort('invoice_number')}
                      sx={{ ml: 1 }}
                    >
                      <Sort fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Receipt fontSize="small" />
                    <span>PO #</span>
                    <IconButton 
                      size="small" 
                      onClick={() => handleSort('po_number')}
                      sx={{ ml: 1 }}
                    >
                      <Sort fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Business fontSize="small" />
                    <span>Vendor</span>
                    <IconButton 
                      size="small" 
                      onClick={() => handleSort('vendor_name')}
                      sx={{ ml: 1 }}
                    >
                      <Sort fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CurrencyRupee fontSize="small" />
                    <span>Total Amount</span>
                    <IconButton 
                      size="small" 
                      onClick={() => handleSort('total_amount')}
                      sx={{ ml: 1 }}
                    >
                      <Sort fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Priority</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listStatus === 'loading' ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Stack alignItems="center" spacing={2}>
                      <CircularProgress size={40} />
                      <Typography color="text.secondary">Loading invoices...</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Stack alignItems="center" spacing={2}>
                      <Receipt sx={{ fontSize: 48, color: 'grey.400' }} />
                      <Typography color="text.secondary">No invoices found</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((inv) => {
                  const priority = determinePriority(inv) as 'high' | 'medium' | 'low';
                  const pColor = getPriorityColor(priority);
                  return (
                  <TableRow 
                    key={inv.id} 
                    hover
                    sx={{ 
                      transition: 'background-color 120ms ease',
                      '&:hover': {
                        backgroundColor: 'grey.100',
                        '& .MuiTableCell-root': {
                          color: 'text.primary'
                        }
                      }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {inv.Invoice_Number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {inv.PO_Number || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {inv.Vendor_Name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {formatCurrency(inv.Total_Amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={priority.toUpperCase()} sx={{ bgcolor: `${pColor}22`, color: pColor }} />
                    </TableCell>
                    <TableCell align="right">
                      <InvoiceActions invoice={inv} />
                    </TableCell>
                  </TableRow>
                );})
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <TablePagination
            component="div"
            count={-1}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { 
              setRowsPerPage(parseInt(e.target.value, 10)); 
              setPage(0); 
            }}
            labelDisplayedRows={() => ''}
            labelRowsPerPage="Rows per page:"
            nextIconButtonProps={{ disabled: items.length < rowsPerPage }}
            backIconButtonProps={{ disabled: page === 0 }}
            sx={{
              '& .MuiTablePagination-toolbar': {
                paddingLeft: 0
              }
            }}
          />
        </Box>
      </Card>
    </Stack>
  );
}


