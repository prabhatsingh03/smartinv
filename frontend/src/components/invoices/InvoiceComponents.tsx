import { Chip, Stack, Button, Tooltip } from '@mui/material';
import type { Invoice, InvoiceStatus, Role } from '@types';
import { Link as RouterLink } from 'react-router-dom';
import { useAppSelector } from '@hooks/index';
import { getCurrentUserRole } from '@utils/auth';
import { getStatusColor, getPriorityColor } from '@theme/index';

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const s = String(status || '').toLowerCase();
  const color = getStatusColor(s);
  return <Chip label={String(status || '').toUpperCase()} size="small" sx={{ bgcolor: `${color}22`, color }} />;
}

export function InvoiceActions({ invoice, onEdit, onSubmit }: { invoice: Invoice; onEdit?: () => void; onSubmit?: () => void }) {
  const { authenticated } = useAppSelector((s) => s.auth);
  const role = getCurrentUserRole();
  const status = String(invoice.status || '').toLowerCase();
  const isEditable = ['draft', 'extracted', 'pending'].includes(status);
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  return (
    <Stack direction="row" spacing={1}>
      {/* For non-finance roles, show Edit for editable statuses; show View for approved */}
      {role !== 'FINANCE' && role !== 'SUPER_ADMIN' && (
        isEditable ? (
          <Button size="small" variant="outlined" component={RouterLink} to={`/invoices/${invoice.id}/edit`}>
            Edit
          </Button>
        ) : (isApproved || isRejected) ? (
          <Button size="small" component={RouterLink} to={`/finance/invoices/${invoice.id}`}>View</Button>
        ) : null
      )}

      {/* Submit action when provided */}
      {onSubmit && isEditable && (
        <Tooltip title="Submit for Approval">
          <Button size="small" variant="contained" onClick={onSubmit}>
            Submit
          </Button>
        </Tooltip>
      )}

      {/* Finance/Super Admin see Review link */}
      {canFinance(role) && (
        <Tooltip title={isApproved ? 'View approved invoice' : isRejected ? 'View rejected invoice' : 'Review for approval'}>
          <Button size="small" component={RouterLink} to={`/finance/invoices/${invoice.id}${isEditable ? '' : ''}`}>
            {isApproved || isRejected ? 'View' : 'Review'}
          </Button>
        </Tooltip>
      )}
    </Stack>
  );
}

function canFinance(role?: Role) {
  return role === 'FINANCE' || role === 'SUPER_ADMIN';
}


