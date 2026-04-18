import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Alert, Stack } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // Assuming your AuthContext has a login method
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        login(data); // Pass the user object to AuthContext
        navigate('/'); // Redirect to the Search page after login
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 5 }}>
      <Paper sx={{ p: 4 }} elevation={3}>
        <Typography variant="h5" gutterBottom textAlign="center">
          Employee Login
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom textAlign="center" sx={{ mb: 3 }}>
          Customers do not need an account to view inventory.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <Stack spacing={3}>
            <TextField 
              required fullWidth label="Username" name="username" 
              value={credentials.username} onChange={handleChange} 
            />
            <TextField 
              required fullWidth type="password" label="Password" name="password" 
              value={credentials.password} onChange={handleChange} 
            />
            <Button 
              type="submit" variant="contained" color="primary" 
              fullWidth size="large" disabled={isSubmitting}
            >
              {isSubmitting ? 'Verifying...' : 'Login'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default LoginPage;