import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(Typography, { variant: "h5", children: "Super Admin Dashboard" }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(StatsGrid, { stats: stats, loading: loading }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TrendChart, { stats: stats }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(PendingApprovalsTable, { limit: 20 }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(ActivityFeed, { logs: recent }) })] }));
}
