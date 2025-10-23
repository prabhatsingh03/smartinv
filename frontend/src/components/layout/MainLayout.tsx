import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function MainLayout() {
  console.log('MainLayout: Rendering layout with Outlet');
  useDocumentTitle();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      backgroundColor: 'background.default'
    }}>
      <Header />
      <Box sx={{ 
        flex: 1, 
        py: 4,
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
      }}>
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}


