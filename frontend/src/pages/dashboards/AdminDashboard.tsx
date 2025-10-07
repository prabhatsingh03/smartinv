import { Stack, Typography, Button, Box, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Add, Assessment } from '@mui/icons-material';
import InvoiceList from '../../components/invoices/InvoiceList';

export default function AdminDashboard() {
  console.log('AdminDashboard: Component rendered');
  const navigate = useNavigate();

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Box>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          color: 'text.primary',
          mb: 1,
          letterSpacing: '-0.025em'
        }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of your invoice management system
        </Typography>
      </Box>

      {/* Removed static stats cards to avoid misleading data */}

      {/* Action Buttons */}
      <Paper sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your invoices and view reports
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              onClick={() => navigate('/invoices')}
              sx={{ borderRadius: 2 }}
            >
              View Reports
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/invoices')}
              sx={{ borderRadius: 2 }}
            >
              Manage Invoices
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Recent Invoices */}
      <InvoiceList />
    </Stack>
  );
}


