import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Stack, Paper, Typography, Grid, Button, Divider, List, ListItem, ListItemText, Chip, Card, CardContent, Box } from '@mui/material';
import { PendingActions, CheckCircle, Cancel, AccountBalance, Assessment, History, Business } from '@mui/icons-material';
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
            icon: _jsx(PendingActions, {}),
            color: '#f59e0b',
            to: '/finance/pending'
        },
        {
            title: 'Approved',
            value: loading ? '-' : stats?.approved_count ?? '-',
            icon: _jsx(CheckCircle, {}),
            color: '#10b981',
            to: '/finance/approved'
        },
        {
            title: 'Rejected',
            value: loading ? '-' : stats?.rejected_count ?? '-',
            icon: _jsx(Cancel, {}),
            color: '#ef4444'
        },
        {
            title: 'Total Amount',
            value: loading ? '-' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(stats?.total_amount || 0)),
            icon: _jsx(AccountBalance, {}),
            color: '#3b82f6'
        }
    ];
    return (_jsxs(Stack, { spacing: 4, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", sx: {
                            fontWeight: 700,
                            color: 'text.primary',
                            mb: 1,
                            letterSpacing: '-0.025em'
                        }, children: "Finance Dashboard" }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: "Monitor and manage invoice approvals and financial data" })] }), _jsx(Grid, { container: true, spacing: 3, children: statCards.map((stat, index) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(Card, { sx: {
                            height: '100%',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)'
                            }
                        }, children: _jsxs(CardContent, { sx: { p: 3 }, children: [_jsx(Stack, { direction: "row", alignItems: "center", justifyContent: "space-between", mb: 2, children: _jsx(Box, { sx: {
                                            p: 1.5,
                                            borderRadius: 2,
                                            backgroundColor: `${stat.color}15`,
                                            color: stat.color
                                        }, children: stat.icon }) }), _jsx(Typography, { variant: "h4", sx: {
                                        fontWeight: 700,
                                        color: 'text.primary',
                                        mb: 0.5
                                    }, children: stat.value }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: stat.title }), stat.to && (_jsx(Button, { size: "small", component: RouterLink, to: stat.to, sx: {
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        color: stat.color
                                    }, children: "View Details" }))] }) }) }, index))) }), _jsx(Paper, { sx: {
                    p: 3,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(226, 232, 240, 0.8)'
                }, children: _jsxs(Stack, { direction: "row", spacing: 2, alignItems: "center", justifyContent: "space-between", children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", sx: { fontWeight: 600, mb: 0.5 }, children: "Quick Actions" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Review pending invoices and manage approvals" })] }), _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(Button, { component: RouterLink, to: "/finance/pending", variant: "outlined", startIcon: _jsx(PendingActions, {}), sx: { borderRadius: 2 }, children: "Review Pending" }), _jsx(Button, { component: RouterLink, to: "/finance/approved", variant: "contained", startIcon: _jsx(CheckCircle, {}), sx: { borderRadius: 2 }, children: "View Approved" })] })] }) }), _jsx(Card, { sx: {
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(226, 232, 240, 0.8)'
                }, children: _jsxs(CardContent, { sx: { p: 3 }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, mb: 2, children: [_jsx(Assessment, { color: "primary" }), _jsx(Typography, { variant: "h6", sx: { fontWeight: 600 }, children: "Priority Overview" })] }), _jsx(Divider, { sx: { mb: 2 } }), _jsxs(Stack, { direction: "row", spacing: 3, alignItems: "center", children: [_jsx(Chip, { icon: _jsx(PendingActions, {}), label: `High Priority: ${stats?.priority_counts?.high ?? 0}`, color: "error", sx: { fontWeight: 500 } }), _jsx(Chip, { icon: _jsx(PendingActions, {}), label: `Medium Priority: ${stats?.priority_counts?.medium ?? 0}`, color: "warning", sx: { fontWeight: 500 } }), _jsx(Chip, { icon: _jsx(CheckCircle, {}), label: `Low Priority: ${stats?.priority_counts?.low ?? 0}`, color: "success", sx: { fontWeight: 500 } })] })] }) }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { sx: {
                                height: '100%',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                border: '1px solid rgba(226, 232, 240, 0.8)'
                            }, children: _jsxs(CardContent, { sx: { p: 3 }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, mb: 2, children: [_jsx(History, { color: "primary" }), _jsx(Typography, { variant: "h6", sx: { fontWeight: 600 }, children: "Recent Activity" })] }), _jsx(Divider, { sx: { mb: 2 } }), _jsxs(List, { dense: true, children: [(stats?.recent_activity || []).slice(0, 8).map((a, idx) => (_jsx(ListItem, { disableGutters: true, sx: { px: 0 }, children: _jsx(ListItemText, { primary: _jsx(Typography, { variant: "body2", sx: { fontWeight: 500 }, children: a.message }), secondary: _jsx(Typography, { variant: "caption", color: "text.secondary", children: a.timestamp }) }) }, idx))), (!stats?.recent_activity || stats?.recent_activity.length === 0) && (_jsx(Typography, { color: "text.secondary", sx: { textAlign: 'center', py: 2 }, children: "No recent activity" }))] })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { sx: {
                                height: '100%',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                border: '1px solid rgba(226, 232, 240, 0.8)'
                            }, children: _jsxs(CardContent, { sx: { p: 3 }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, mb: 2, children: [_jsx(Business, { color: "primary" }), _jsx(Typography, { variant: "h6", sx: { fontWeight: 600 }, children: "Department Summary" })] }), _jsx(Divider, { sx: { mb: 2 } }), _jsxs(Grid, { container: true, spacing: 2, children: [(stats?.department_summary || []).map((d) => (_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsxs(Paper, { sx: {
                                                        p: 2,
                                                        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                                                        border: '1px solid rgba(226, 232, 240, 0.5)'
                                                    }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 1, fontWeight: 500 }, children: d.name }), _jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [_jsx(Chip, { size: "small", label: `Pending: ${d.pending || 0}`, color: "warning", sx: { fontSize: '0.75rem' } }), _jsx(Chip, { size: "small", label: `Approved: ${d.approved || 0}`, color: "success", sx: { fontSize: '0.75rem' } })] })] }) }, d.name))), (!stats?.department_summary || stats?.department_summary.length === 0) && (_jsx(Grid, { item: true, xs: 12, children: _jsx(Typography, { color: "text.secondary", sx: { textAlign: 'center', py: 2 }, children: "No department data available" }) }))] })] }) }) })] })] }));
}
