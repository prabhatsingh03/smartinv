import { Stack, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InvoiceList from '@components/invoices/InvoiceList';

export default function HRDashboard() {
  const navigate = useNavigate();
  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">HR Dashboard</Typography>
        <Button variant="contained" onClick={() => navigate('/invoices')}>Reimbursements</Button>
      </Stack>
      <InvoiceList />
    </Stack>
  );
}


