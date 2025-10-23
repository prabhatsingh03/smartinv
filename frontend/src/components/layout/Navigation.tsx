import { Link, useLocation } from 'react-router-dom';
import { Stack, Button, Box, Chip, useMediaQuery, useTheme, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { 
  Dashboard, 
  People, 
  Business, 
  ShoppingCart, 
  AccountBalance,
  PendingActions,
  CheckCircle,
  AdminPanelSettings,
  PersonAdd,
  History,
  Settings,
  Assessment,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { useAppSelector } from '../../hooks';
import type { RoleCompat } from '../../types';
import { getCurrentUserRole } from '../../utils/auth';

type MenuItem = { 
  label: string; 
  path: string; 
  roles: RoleCompat[];
  icon: React.ReactElement;
  color?: string;
};

const MENU: MenuItem[] = [
  // Admin + general
  { label: 'Dashboard', path: '/dashboard', roles: ['ADMIN'], icon: <Dashboard />, color: '#3b82f6' },
  { label: 'HR', path: '/hr', roles: ['HR'], icon: <People />, color: '#10b981' },
  { label: 'Site', path: '/site', roles: ['SITE'], icon: <Business />, color: '#f59e0b' },
  { label: 'Procurement', path: '/procurement', roles: ['PROCUREMENT'], icon: <ShoppingCart />, color: '#8b5cf6' },
  { label: 'Finance', path: '/finance', roles: ['FINANCE'], icon: <AccountBalance />, color: '#06b6d4' },
  { label: 'Pending', path: '/finance/pending', roles: ['FINANCE', 'SUPER_ADMIN'], icon: <PendingActions />, color: '#f59e0b' },
  { label: 'Approved', path: '/finance/approved', roles: ['FINANCE', 'SUPER_ADMIN'], icon: <CheckCircle />, color: '#10b981' },
  // Super Admin specific - only show these for SUPER_ADMIN
  { label: 'Super Admin', path: '/superadmin', roles: ['SUPER_ADMIN'], icon: <AdminPanelSettings />, color: '#7c3aed' },
  { label: 'Users', path: '/superadmin/users', roles: ['SUPER_ADMIN'], icon: <PersonAdd />, color: '#ef4444' },
  { label: 'Audit Trail', path: '/superadmin/audit', roles: ['SUPER_ADMIN'], icon: <History />, color: '#64748b' },
  { label: 'Config', path: '/superadmin/config', roles: ['SUPER_ADMIN'], icon: <Settings />, color: '#64748b' },
  { label: 'Reports', path: '/superadmin/reports', roles: ['SUPER_ADMIN'], icon: <Assessment />, color: '#64748b' }
];

export default function Navigation() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { authenticated } = useAppSelector((s) => s.auth);
  const role = getCurrentUserRole();
  const isActive = (path: string) => location.pathname === path;
  
  const filteredMenu = MENU.filter((m) => (role ? m.roles.includes(role) : false));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const NavigationItems = () => (
    <>
      {filteredMenu.map((m) => (
        <Button
          key={m.path}
          component={Link}
          to={m.path}
          startIcon={m.icon}
          onClick={() => isMobile && setMobileOpen(false)}
          sx={{
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
          }}
        >
          {m.label}
        </Button>
      ))}
    </>
  );

  const MobileNavigationItems = () => (
    <List>
      {filteredMenu.map((m) => (
        <ListItem key={m.path} disablePadding>
          <ListItemButton
            component={Link}
            to={m.path}
            onClick={() => setMobileOpen(false)}
            sx={{
              backgroundColor: isActive(m.path) ? 'primary.light' : 'transparent',
              '&:hover': {
                backgroundColor: 'primary.light'
              }
            }}
          >
            <ListItemIcon sx={{ color: isActive(m.path) ? m.color : 'text.secondary' }}>
              {m.icon}
            </ListItemIcon>
            <ListItemText 
              primary={m.label}
              sx={{ 
                color: isActive(m.path) ? 'primary.main' : 'text.primary',
                fontWeight: isActive(m.path) ? 600 : 400
              }}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );

  if (isMobile) {
    return (
      <>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ 
            mr: 2,
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)'
            }
          }}
        >
          <MenuIcon />
        </IconButton>
        <Drawer
          variant="temporary"
          anchor="right"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 280,
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              color: 'white'
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'white' }}>
              Navigation
            </Typography>
            <MobileNavigationItems />
          </Box>
        </Drawer>
      </>
    );
  }

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <NavigationItems />
    </Stack>
  );
}


