import { Stack, Typography } from '@mui/material';
import InvoiceUpload from '@components/invoices/InvoiceUpload';
import InvoiceForm from '@components/invoices/InvoiceForm';

export default function InvoiceManagement() {
  return (
    <Stack spacing={3}>
      <Typography variant="h5">Invoice Management</Typography>
      <InvoiceUpload />
      <InvoiceForm />
    </Stack>
  );
}


