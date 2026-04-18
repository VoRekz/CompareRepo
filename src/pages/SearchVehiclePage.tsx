import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, TextField, Button, Grid, Typography, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Link, Autocomplete, Stack
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

// This type should match the fields returned by the backend search endpoint
interface VehicleSearchResult {
  vin: string;
  vehicle_type: string;
  manufacturer_name: string;
  model_name: string;
  model_year: number;
  sales_price: number;
  colors: string;
  has_pending_parts: boolean;
}

// Common dropdown options (freeSolo still allows typing custom values)
const VEHICLE_TYPES = ['Sedan', 'Coupe', 'SUV', 'Truck', 'Van', 'Minivan', 'Wagon', 'Convertible', 'Sports Car', 'Hatchback'];
const MANUFACTURERS = ['Acura', 'Audi', 'BMW', 'Chevrolet', 'Chrysler', 'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Jeep', 'Kia', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Porsche', 'Ram', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'];
const COLORS = ['Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Brown', 'Green', 'Yellow', 'Gold', 'Orange', 'Purple'];

const SearchVehiclesPage: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    vin: '', vehicle_type: '', manufacturer_name: '', model_year: '', color: '', min_price: '', max_price: ''
  });
  const [results, setResults] = useState<VehicleSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [totalAvailable, setTotalAvailable] = useState<number | null>(null);

  // Fetch the total available inventory on page load
  useEffect(() => {
    const fetchTotalInventory = async () => {
      try {
        // Querying with role=Public strictly guarantees we only count unsold cars with NO pending parts
        const response = await fetch('http://127.0.0.1:5000/api/vehicles/search?role=Public');
        if (response.ok) {
          const data = await response.json();
          setTotalAvailable(data.length);
        }
      } catch (error) {
        console.error('Failed to fetch total inventory:', error);
      }
    };
    fetchTotalInventory();
  }, []);

  // Allow any employee role to see the Sell button
  const canSell = ['Acquisition Specialist', 'Sales Agent', 'Operating Manager', 'Owner'].includes(user?.role || '');
  
  // Only these roles can actually see vehicles with pending parts
  const canSeePendingParts = ['Acquisition Specialist', 'Operating Manager', 'Owner'].includes(user?.role || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out empty values and add the user role
      const activeFilters: Record<string, string> = {
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
        role: user?.role || 'Public',
      };

      const queryParams = new URLSearchParams(activeFilters).toString();
      const response = await fetch(`http://127.0.0.1:5000/api/vehicles/search?${queryParams}`);

      if (!response.ok) {
        let errorMessage = 'Server error occurred';
        try {
          const errorData = (await response.json()) as { error?: string };
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Fallback if response isn't JSON
        }
        throw new Error(errorMessage);
      }

      const data = (await response.json()) as VehicleSearchResult[];
      
      setResults(data);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      alert(`Error fetching vehicles: ${error instanceof Error ? error.message : 'Check console for details'}`);
    } finally {
      setSearched(true);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Search Inventory
      </Typography>
      {totalAvailable !== null && (
        <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 2 }}>
          Total Vehicles Available for Sale: <strong>{totalAvailable}</strong>
        </Typography>
      )}
      
      <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2}>
            {user && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField fullWidth label="VIN" name="vin" value={filters.vin} onChange={handleChange} />
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Autocomplete
                freeSolo
                options={VEHICLE_TYPES}
                value={filters.vehicle_type}
                onInputChange={(_, newValue) => setFilters({ ...filters, vehicle_type: newValue })}
                renderInput={(params) => <TextField {...params} fullWidth label="Vehicle Type (e.g. Car, SUV)" name="vehicle_type" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Autocomplete
                freeSolo
                options={MANUFACTURERS}
                value={filters.manufacturer_name}
                onInputChange={(_, newValue) => setFilters({ ...filters, manufacturer_name: newValue })}
                renderInput={(params) => <TextField {...params} fullWidth label="Manufacturer" name="manufacturer_name" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth type="number" label="Year" name="model_year" value={filters.model_year} onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Autocomplete
                freeSolo
                options={COLORS}
                value={filters.color}
                onInputChange={(_, newValue) => setFilters({ ...filters, color: newValue })}
                renderInput={(params) => <TextField {...params} fullWidth label="Color" name="color" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth type="number" label="Min Price" name="min_price" value={filters.min_price} onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth type="number" label="Max Price" name="max_price" value={filters.max_price} onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="contained" size="large">
                  Search
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {searched && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Search Results: {results.length} vehicle(s) found
            {canSeePendingParts && " (some vehicles may be pending parts)"}
          </Typography>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>VIN</strong></TableCell>
                <TableCell><strong>Vehicle</strong></TableCell>
                <TableCell><strong>Year</strong></TableCell>
                <TableCell><strong>Color</strong></TableCell>
                <TableCell><strong>Price</strong></TableCell>
                {user && <TableCell><strong>Pending Parts?</strong></TableCell>}
                <TableCell><strong>Details</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.length > 0 ? (
                results.map((v) => (
                  <TableRow key={v.vin} hover>
                    <TableCell>{v.vin}</TableCell>
                    <TableCell>{v.manufacturer_name} {v.model_name}</TableCell>
                    <TableCell>{v.model_year}</TableCell>
                    <TableCell>{v.colors || 'N/A'}</TableCell>
                    <TableCell>${new Intl.NumberFormat('en-US').format(v.sales_price)}</TableCell>
                    {user && <TableCell>{v.has_pending_parts ? 'Yes' : 'No'}</TableCell>}
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Link component={RouterLink} to={`/vehicles/${v.vin}`}>
                          View Details
                        </Link>
                        {canSell && (
                          <Button 
                            component={RouterLink} 
                            to={`/sell-vehicle/${v.vin}`} 
                            variant="contained" 
                            color="secondary" 
                            size="small"
                          >
                            Sell
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={user ? 7 : 6} align="center">No vehicles found matching your criteria.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default SearchVehiclesPage;
