import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Paper, 
  Stack, 
  TextField, 
  Typography, 
  Alert,
  Divider,
  InputAdornment,
  IconButton
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock,
  AccountBalance
} from '@mui/icons-material';
import { useAppDispatch } from '@hooks/index';
import { login as loginThunk } from '@store/authSlice';

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  // Set document title for login page
  useEffect(() => {
    document.title = 'Login - SmartInv - Simon India';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!email || !password) throw new Error('Email and password are required');
      await dispatch(loginThunk({ email, password })).unwrap();
      const from = (location.state?.from as any)?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 4
    }}>
      <Container maxWidth="sm">
        <Paper 
          elevation={24}
          sx={{ 
            p: 4, 
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <Stack spacing={3} alignItems="center">
            {/* Logo and Title */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              {/* Simon India Logo with SmartInv caption */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                mb: 2,
                background: 'rgba(59, 130, 246, 0.1)',
                p: 2,
                width: 140,
                height: 'auto',
                mx: 'auto',
                border: '2px solid rgba(59, 130, 246, 0.2)'
              }}>
                <img 
                  src="https://www.simonindia.com/assets/images/logo.png"
                  alt="Simon India"
                  style={{ 
                    height: '50px',
                    width: 'auto',
                    objectFit: 'contain'
                  }}
                />
                <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 600 }}>
                  SmartInv
                </Typography>
              </Box>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Invoice Management System
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ 
                fontStyle: 'italic',
                opacity: 0.8
              }}>
                Powered by Simon India
              </Typography>
            </Box>

            <Divider sx={{ width: '100%' }} />

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <Stack spacing={3}>
                <TextField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />

                {error && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  fullWidth
                  size="large"
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
                    }
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Stack>
            </Box>

            {/* Footer */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Secure access to your invoice management dashboard
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}


