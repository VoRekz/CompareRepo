import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Grid, Typography, Paper, Alert, Autocomplete } from '@mui/material';
import { useAuth } from '../context/AuthContext';

// Define the expected shape of the API response so TypeScript doesn't complain about 'any'
interface SellResponse {
  message?: string;
  error?: string;
  minimum_required?: number;
}

const SellVehiclePage: React.FC = () => {
  const { vin } = useParams<{ vin: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    customer_id: '', sale_price: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user is not authorized
  useEffect(() => {
    // Prevent booting the user if the auth context is still loading their profile on a page refresh
    if (user === undefined) {
      return; 
    }

    const allowedRoles = ['Acquisition Specialist', 'Sales Agent', 'Operating Manager', 'Owner'];
    if (!user || !allowedRoles.includes(user.role)) {
      alert('You are not authorized to access this page.');
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    if (!vin || !user) {
      setMessage({ type: 'error', text: 'Required information is missing.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/transactions/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vin: vin,
          username: user.username,
          sale_price: parseFloat(formData.sale_price)
        })
      });

      const data = (await response.json()) as SellResponse;
      if (response.ok) {
        setMessage({ type: 'success', text: (data.message || 'Vehicle sold successfully!') + ' Redirecting...' });
        setTimeout(() => navigate('/'), 3000); // Redirect to home after 3 seconds
      } else {
        let errorText = data.error || 'An unknown error occurred.';
        if (data.minimum_required) {
          errorText += ` Minimum sale price is $${data.minimum_required}.`;
        }
        setMessage({ type: 'error', text: errorText });
      }
    } catch (error) {
      console.error('Error completing transaction:', error); // Use the error to satisfy ESLint
      setMessage({ type: 'error', text: 'A network error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Sell Vehicle</Typography>
      <Typography variant="h6" gutterBottom>VIN: {vin}</Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 3 }} elevation={2}>
        <form onSubmit={handleSell}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                freeSolo
                options={[]} // You can populate this array from an API fetch later!
                value={formData.customer_id}
                onInputChange={(_, newValue) => setFormData({ ...formData, customer_id: newValue })}
                renderInput={(params) => <TextField {...params} required fullWidth label="Customer ID Search" name="customer_id" />}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField required fullWidth type="number" label="Actual Sale Price ($)" name="sale_price" value={formData.sale_price} onChange={handleChange} inputProps={{ step: "0.01" }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button type="submit" variant="contained" color="primary" fullWidth size="large" disabled={isSubmitting || !user}>
                {isSubmitting ? 'Processing...' : 'Complete Sale'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default SellVehiclePage;
