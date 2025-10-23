import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { Stack, Button, Box, useMediaQuery, useTheme, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { Dashboard, People, Business, ShoppingCart, AccountBalance, PendingActions, CheckCircle, AdminPanelSettings, PersonAdd, History, Settings, Assessment, Menu as MenuIcon } from '@mui/icons-material';
import { useState } from 'react';
import { useAppSelector } from '../../hooks';
import { getCurrentUserRole } from '../../utils/auth';
const MENU = [
    // Admin + general
    { label: 'Dashboard', path: '/dashboard', roles: ['ADMIN'], icon: _jsx(Dashboard, {}), color: '#3b82f6' },
    { label: 'HR', path: '/hr', roles: ['HR'], icon: _jsx(People, {}), color: '#10b981' },
    { label: 'Site', path: '/site', roles: ['SITE'], icon: _jsx(Business, {}), color: '#f59e0b' },
    { label: 'Procurement', path: '/procurement', roles: ['PROCUREMENT'], icon: _jsx(ShoppingCart, {}), color: '#8b5cf6' },
    { label: 'Finance', path: '/finance', roles: ['FINANCE'], icon: _jsx(AccountBalance, {}), color: '#06b6d4' },
    { label: 'Pending', path: '/finance/pending', roles: ['FINANCE', 'SUPER_ADMIN'], icon: _jsx(PendingActions, {}), color: '#f59e0b' },
    { label: 'Approved', path: '/finance/approved', roles: ['FINANCE', 'SUPER_ADMIN'], icon: _jsx(CheckCircle, {}), color: '#10b981' },
    // Super Admin specific - only show these for SUPER_ADMIN
    { label: 'Super Admin', path: '/superadmin', roles: ['SUPER_ADMIN'], icon: _jsx(AdminPanelSettings, {}), color: '#7c3aed' },
    { label: 'Users', path: '/superadmin/users', roles: ['SUPER_ADMIN'], icon: _jsx(PersonAdd, {}), color: '#ef4444' },
    { label: 'Audit Trail', path: '/superadmin/audit', roles: ['SUPER_ADMIN'], icon: _jsx(History, {}), color: '#64748b' },
    { label: 'Config', path: '/superadmin/config', roles: ['SUPER_ADMIN'], icon: _jsx(Settings, {}), color: '#64748b' },
    { label: 'Reports', path: '/superadmin/reports', roles: ['SUPER_ADMIN'], icon: _jsx(Assessment, {}), color: '#64748b' }
];
export default function Navigation() {
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const { authenticated } = useAppSelector((s) => s.auth);
    const role = getCurrentUserRole();
    const isActive = (path) => location.pathname === path;
    const filteredMenu = MENU.filter((m) => (role ? m.roles.includes(role) : false));
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };
    const NavigationItems = () => (_jsx(_Fragment, { children: filteredMenu.map((m) => (_jsx(Button, { component: Link, to: m.path, startIcon: m.icon, onClick: () => isMobile && setMobileOpen(false), sx: {
                color: isActive(m.path) ? 'white' : 'rgba(255, 255, 255, 0.8)',
                backgroundColor: isActive(m.path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                borderRadius: 2,
                px: 2,
                py: 1,
                minWidth: 'auto',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                },
                '& .MuiButton-startIcon': {
                    color: isActive(m.path) ? m.color : 'rgba(255, 255, 255, 0.8)'
                }
            }, children: m.label }, m.path))) }));
    const MobileNavigationItems = () => (_jsx(List, { children: filteredMenu.map((m) => (_jsx(ListItem, { disablePadding: true, children: _jsxs(ListItemButton, { component: Link, to: m.path, onClick: () => setMobileOpen(false), sx: {
                    backgroundColor: isActive(m.path) ? 'primary.light' : 'transparent',
                    '&:hover': {
                        backgroundColor: 'primary.light'
                    }
                }, children: [_jsx(ListItemIcon, { sx: { color: isActive(m.path) ? m.color : 'text.secondary' }, children: m.icon }), _jsx(ListItemText, { primary: m.label, sx: {
                            color: isActive(m.path) ? 'primary.main' : 'text.primary',
                            fontWeight: isActive(m.path) ? 600 : 400
                        } })] }) }, m.path))) }));
    if (isMobile) {
        return (_jsxs(_Fragment, { children: [_jsx(IconButton, { color: "inherit", "aria-label": "open drawer", edge: "start", onClick: handleDrawerToggle, sx: {
                        mr: 2,
                        color: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.2)'
                        }
                    }, children: _jsx(MenuIcon, {}) }), _jsx(Drawer, { variant: "temporary", anchor: "right", open: mobileOpen, onClose: handleDrawerToggle, ModalProps: {
                        keepMounted: true, // Better open performance on mobile.
                    }, sx: {
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: 280,
                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                            color: 'white'
                        },
                    }, children: _jsxs(Box, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", sx: { fontWeight: 700, mb: 2, color: 'white' }, children: "Navigation" }), _jsx(MobileNavigationItems, {})] }) })] }));
    }
    return (_jsx(Stack, { direction: "row", spacing: 0.5, sx: { alignItems: 'center' }, children: _jsx(NavigationItems, {}) }));
}
