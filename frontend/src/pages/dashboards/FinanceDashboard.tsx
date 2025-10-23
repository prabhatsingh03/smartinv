import { useEffect } from 'react';
import { 
  Stack, 
  Paper, 
  Typography, 
  Grid, 
  Button, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  Chip,
  Card,
  CardContent,
  Box,
  LinearProgress
} from '@mui/material';
import { 
  PendingActions, 
  CheckCircle, 
  Cancel, 
  AccountBalance,
  Assessment,
  History,
  Business
} from '@mui/icons-material';
import { useFinanceStatistics } from '@hooks/useFinance';
import { Link as RouterLink } from 'react-router-dom';

export default function FinanceDashboard() {
  const { stats, status, refresh } = useFinanceStatistics();
  useEffect(() => { refresh(); }, [refresh]);
  const loading = status === 'loading';

  const statCards = [
    { 
      title: 'Pending Review', 
      value: loading ? '-' : stats?.pending_count ?? '-', 
      icon: <PendingActions />, 
      color: '#f59e0b',
      to: '/finance/pending'
    },
    { 
      title: 'Approved', 
      value: loading ? '-' : stats?.approved_count ?? '-', 
      icon: <CheckCircle />, 
      color: '#10b981',
      to: '/finance/approved'
    },
    { 
      title: 'Rejected', 
      value: loading ? '-' : stats?.rejected_count ?? '-', 
      icon: <Cancel />, 
      color: '#ef4444'
    },
    { 
      title: 'Total Amount', 
      value: loading ? '-' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(stats?.total_amount || 0)), 
      icon: <AccountBalance />, 
      color: '#3b82f6'
    }
  ];

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
          Finance Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage invoice approvals and financial data
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    backgroundColor: `${stat.color}15`,
                    color: stat.color
                  }}>
                    {stat.icon}
                  </Box>
                  {/* Removed synthetic percentage change to avoid static misleading data */}
                </Stack>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  color: 'text.primary',
                  mb: 0.5
                }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {stat.title}
                </Typography>
                {stat.to && (
                  <Button 
                    size="small" 
                    component={RouterLink} 
                    to={stat.to}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 500,
                      color: stat.color
                    }}
                  >
                    View Details
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
              Review pending invoices and manage approvals
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button 
              component={RouterLink} 
              to="/finance/pending" 
              variant="outlined"
              startIcon={<PendingActions />}
              sx={{ borderRadius: 2 }}
            >
              Review Pending
            </Button>
            <Button 
              component={RouterLink} 
              to="/finance/approved" 
              variant="contained"
              startIcon={<CheckCircle />}
              sx={{ borderRadius: 2 }}
            >
              View Approved
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Priority Overview */}
      <Card sx={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Assessment color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Priority Overview
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Stack direction="row" spacing={3} alignItems="center">
            <Chip 
              icon={<PendingActions />}
              label={`High Priority: ${stats?.priority_counts?.high ?? 0}`} 
              color="error"
              sx={{ fontWeight: 500 }}
            />
            <Chip 
              icon={<PendingActions />}
              label={`Medium Priority: ${stats?.priority_counts?.medium ?? 0}`} 
              color="warning"
              sx={{ fontWeight: 500 }}
            />
            <Chip 
              icon={<CheckCircle />}
              label={`Low Priority: ${stats?.priority_counts?.low ?? 0}`} 
              color="success"
              sx={{ fontWeight: 500 }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <History color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Activity
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                {(stats?.recent_activity || []).slice(0, 8).map((a: any, idx: number) => (
                  <ListItem key={idx} disableGutters sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {a.message}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {a.timestamp}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
                {(!stats?.recent_activity || stats?.recent_activity.length === 0) && (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No recent activity
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Department Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Business color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Department Summary
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {(stats?.department_summary || []).map((d: any) => (
                  <Grid item xs={12} sm={6} key={d.name}>
                    <Paper sx={{ 
                      p: 2, 
                      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                      border: '1px solid rgba(226, 232, 240, 0.5)'
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                        {d.name}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip 
                          size="small" 
                          label={`Pending: ${d.pending || 0}`} 
                          color="warning"
                          sx={{ fontSize: '0.75rem' }}
                        />
                        <Chip 
                          size="small" 
                          label={`Approved: ${d.approved || 0}`} 
                          color="success"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
                {(!stats?.department_summary || stats?.department_summary.length === 0) && (
                  <Grid item xs={12}>
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No department data available
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

    </Stack>
  );
}


