import { Box, Typography, Container, Stack } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: 'grey.50',
        borderTop: '1px solid',
        borderColor: 'grey.200'
      }}
    >
      <Container maxWidth="xl">
        <Stack 
          direction="row" 
          alignItems="center" 
          justifyContent="center" 
          spacing={2}
        >
          <img 
            src="https://www.simonindia.com/assets/images/logo.png"
            alt="Simon India"
            style={{ 
              height: '24px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
          <Typography variant="body2" color="text.secondary">
            © 2024 SmartInv - Invoice Management System
          </Typography>
          <Typography variant="body2" color="text.secondary">
            •
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Powered by Simon India
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
