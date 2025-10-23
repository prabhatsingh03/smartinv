import { AppBar, Toolbar, Typography, Box, Container, Chip } from '@mui/material';
import { AccountBalance } from '@mui/icons-material';
import Navigation from './Navigation';
import { getCurrentUserRole } from '../../utils/auth';
import { useAppSelector } from '../../hooks';
import LogoutButton from '../auth/LogoutButton';

export default function Header() {
  const { authenticated } = useAppSelector((s) => s.auth);
  const role = getCurrentUserRole();
  const showTagline = role !== 'SUPER_ADMIN';
  return (
    <AppBar position="static" elevation={0}>
      <Container maxWidth="xl">
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            {/* Simon India Logo with SmartInv text in the same row */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mr: 4,
              background: 'rgba(255, 255, 255, 0.1)',
              px: 2,
              py: 1,
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <img 
                src="https://www.simonindia.com/assets/images/logo.png"
                alt="Simon India"
                style={{ 
                  height: '40px',
                  width: 'auto',
                  objectFit: 'contain'
                }}
              />
              <Typography 
                variant="h6"
                sx={{ 
                  color: 'white',
                  ml: 1.5,
                  fontWeight: 700,
                  letterSpacing: '-0.02em'
                }}
              >
                SmartInv
              </Typography>
            </Box>
            {showTagline && (
              <Chip 
                icon={<AccountBalance />}
                label="Invoice Management System"
                variant="outlined"
                sx={{ 
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
            )}
          </Box>
          <Navigation />
          <LogoutButton />
        </Toolbar>
      </Container>
    </AppBar>
  );
}


