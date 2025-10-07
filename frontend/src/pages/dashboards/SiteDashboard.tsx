import { Stack, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InvoiceList from '@components/invoices/InvoiceList';

export default function SiteDashboard() {
  const navigate = useNavigate();
  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Site Dashboard</Typography>
        <Button variant="contained" onClick={() => navigate('/invoices')}>Site Expenses</Button>
      </Stack>
      <InvoiceList />
    </Stack>
  );
}


