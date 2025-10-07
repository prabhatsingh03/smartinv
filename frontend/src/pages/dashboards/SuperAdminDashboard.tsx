import { useEffect } from 'react';
import { Grid, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@hooks/index';
import { fetchSystemStatistics } from '@store/superAdminSlice';
import { StatsGrid, ActivityFeed, TrendChart, PendingApprovalsTable } from '@components/admin/AdminComponents';

export default function SuperAdminDashboard() {
  const dispatch = useAppDispatch();
  const stats = useAppSelector((s) => s.superAdmin.statistics);
  const loading = useAppSelector((s) => s.superAdmin.statisticsLoading);
  const recent = useAppSelector((s) => s.superAdmin.dashboardActivity);

  useEffect(() => {
    dispatch(fetchSystemStatistics());
  }, [dispatch]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h5">Super Admin Dashboard</Typography>
      </Grid>
      <Grid item xs={12}>
        <StatsGrid stats={stats} loading={loading} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TrendChart stats={stats} />
      </Grid>
      <Grid item xs={12} md={6}>
        <PendingApprovalsTable limit={20} />
      </Grid>
      <Grid item xs={12}>
        <ActivityFeed logs={recent} />
      </Grid>
    </Grid>
  );
}


