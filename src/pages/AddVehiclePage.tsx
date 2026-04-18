import { useState } from 'react';
import {
  Box, Button, TextField, Typography, Alert,
  MenuItem, Checkbox, FormControlLabel, FormGroup, FormLabel
} from '@mui/material';
import { searchCustomer, addIndividual, addBusiness } from '../services/customerService';
import type { IndividualCustomer, BusinessCustomer } from '../services/interfaces';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const VEHICLE_TYPES = ['Convertible', 'Coupe', 'Minivan', 'Other', 'Sedan', 'SUV', 'Truck', 'Van'];
const CONDITIONS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Rough'];
const FUEL_TYPES = ['Gas', 'Diesel', 'Natural Gas', 'Hybrid', 'Plugin Hybrid', 'Battery', 'Fuel Cell'];
const DRIVETRAINS = ['4WD', 'AWD', 'FWD', 'RWD'];
const COLORS = ['Aluminum','Beige','Black','Blue','Brown','Bronze','Claret','Copper','Cream',
  'Gold','Gray','Green','Maroon','Metallic','Navy','Orange','Pink','Purple','Red','Rose',
  'Rust','Silver','Tan','Turquoise','White','Yellow'];
const MANUFACTURERS = ['Acura','Alfa Romeo','Aston Martin','Audi','Bentley','BMW','Buick',
  'Cadillac','Chevrolet','Chrysler','Dodge','Ferrari','FIAT','Ford','Geely','Genesis','GMC',
  'Honda','Hyundai','INFINITI','Jaguar','Jeep','Karma','Kia','Lamborghini','Land Rover',
  'Lexus','Lincoln','Lotus','Maserati','MAZDA','McLaren','Mercedes-Benz','MINI','Mitsubishi',
  'Nio','Nissan','Porsche','Ram','Rivian','Rolls-Royce','smart','Subaru','Tesla','Toyota',
  'Volkswagen','Volvo','XPeng'];
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM',
  'NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

const AddVehiclePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Step 1 - search
  const [searchType, setSearchType] = useState<'ssn' | 'tax_id'>('ssn');
  const [searchValue, setSearchValue] = useState('');
  const [customer, setCustomer] = useState<IndividualCustomer | BusinessCustomer | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1b - add customer
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customerType, setCustomerType] = useState<'individual' | 'business'>('individual');
  const [newCustomer, setNewCustomer] = useState({
    first_name: '', last_name: '', ssn: '',
    business_name: '', tax_id: '',
    contact_first_name: '', contact_last_name: '', contact_title: '',
    email: '', phone_number: '', street_address: '',
    city: '', state: '', postal_code: '',
  });
  const [addCustomerError, setAddCustomerError] = useState<string | null>(null);

  // Step 2 - vehicle
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [vehicleData, setVehicleData] = useState({
    vin: '', vehicle_type: '', condition: '', manufacturer_name: '',
    model_name: '', model_year: '', fuel_type: '', drive_train: '',
    horse_power: '', purchase_price: '', purchase_date: '', notes: '',
  });
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  // ── Step 1: search ──────────────────────────────────────────────
  const handleSearch = async () => {
    setCustomer(null);
    setNotFound(false);
    setError(null);
    setShowAddCustomer(false);
    setShowVehicleForm(false);
    try {
      const result = await searchCustomer(
        searchType === 'ssn' ? searchValue : undefined,
        searchType === 'tax_id' ? searchValue : undefined
      );
      if (result) {
        setCustomer(result);
      } else {
        setNotFound(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  // ── Step 1b: add new customer ───────────────────────────────────
  const handleAddCustomer = async () => {
    setAddCustomerError(null);
    try {
      if (customerType === 'individual') {
        await addIndividual({
          first_name: newCustomer.first_name,
          last_name: newCustomer.last_name,
          ssn: newCustomer.ssn,
          email: newCustomer.email || undefined,
          phone_number: newCustomer.phone_number,
          street_address: newCustomer.street_address,
          city: newCustomer.city,
          state: newCustomer.state,
          postal_code: newCustomer.postal_code,
        });
      } else {
        await addBusiness({
          business_name: newCustomer.business_name,
          tax_id: newCustomer.tax_id,
          contact_first_name: newCustomer.contact_first_name,
          contact_last_name: newCustomer.contact_last_name,
          contact_title: newCustomer.contact_title,
          email: newCustomer.email || undefined,
          phone_number: newCustomer.phone_number,
          street_address: newCustomer.street_address,
          city: newCustomer.city,
          state: newCustomer.state,
          postal_code: newCustomer.postal_code,
        });
      }
      // Re-search to get the full customer object back
      const found = await searchCustomer(
        customerType === 'individual' ? newCustomer.ssn : undefined,
        customerType === 'business' ? newCustomer.tax_id : undefined
      );
      if (found) {
        setCustomer(found);
        setShowAddCustomer(false);
        setNotFound(false);
      }
    } catch {
      setAddCustomerError('Failed to add customer. Please check all fields and try again.');
    }
  };

  // ── Step 2: submit vehicle ──────────────────────────────────────
  const handleAddVehicle = async () => {
    setVehicleError(null);

    const currentYear = new Date().getFullYear();
    const year = parseInt(vehicleData.model_year);

    if (!vehicleData.model_year.match(/^\d{4}$/)) {
      setVehicleError('Model year must be a 4-digit year (e.g. 2022).');
      return;
    }
    if (year > currentYear + 1) {
      setVehicleError(`Model year cannot exceed ${currentYear + 1}.`);
      return;
    }
    if (selectedColors.length === 0) {
      setVehicleError('Please select at least one color.');
      return;
    }
    if (!customer) return;

    try {
      const response = await fetch('http://127.0.0.1:5000/api/vehicles/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vin: vehicleData.vin,
          vehicle_type: vehicleData.vehicle_type,
          purchase_condition: vehicleData.condition,
          manufacturer_name: vehicleData.manufacturer_name,
          model_name: vehicleData.model_name,
          model_year: year,
          fuel_type: vehicleData.fuel_type,
          drive_train: vehicleData.drive_train,
          horse_power: parseInt(vehicleData.horse_power),
          purchase_price: parseFloat(vehicleData.purchase_price),
          purchase_date: vehicleData.purchase_date,
          colors: selectedColors,
          customer_id: customer.customer_id,
          username: user?.username ?? '',
          notes: vehicleData.notes,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Server error occurred';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      navigate(`/vehicles/${vehicleData.vin}`);
    } catch (err: any) {
      setVehicleError(err.message || 'Failed to add vehicle. Please check all fields and try again.');
    }
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4, pb: 6 }}>
      <Typography variant="h4" mb={3}>Add Vehicle</Typography>

      {/* ── STEP 1: Find Seller ── */}
      {!showVehicleForm && (
        <>
          <Typography variant="h6" mb={2}>Step 1: Find Seller</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button variant={searchType === 'ssn' ? 'contained' : 'outlined'}
              onClick={() => setSearchType('ssn')}>Search by SSN</Button>
            <Button variant={searchType === 'tax_id' ? 'contained' : 'outlined'}
              onClick={() => setSearchType('tax_id')}>Search by Tax ID</Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label={searchType === 'ssn' ? 'Enter SSN' : 'Enter Tax ID'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              fullWidth
            />
            <Button variant="contained" onClick={handleSearch}>Search</Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Customer found */}
          {customer && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Customer found:{' '}
                {'first_name' in customer
                  ? `${customer.first_name} ${customer.last_name}`
                  : customer.business_name}
              </Alert>
              <Button variant="contained" onClick={() => setShowVehicleForm(true)}>
                Continue to Vehicle Details →
              </Button>
            </Box>
          )}

          {/* Customer not found */}
          {notFound && !showAddCustomer && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Customer not found. Would you like to add them?
              </Alert>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained"
                  onClick={() => { setShowAddCustomer(true); setCustomerType('individual'); }}>
                  Add Individual
                </Button>
                <Button variant="outlined"
                  onClick={() => { setShowAddCustomer(true); setCustomerType('business'); }}>
                  Add Business
                </Button>
              </Box>
            </Box>
          )}

          {/* Add customer form */}
          {showAddCustomer && (
            <Box sx={{ mt: 3, p: 3, border: '1px solid #ccc', borderRadius: 2 }}>
              <Typography variant="h6" mb={2}>
                Add {customerType === 'individual' ? 'Individual' : 'Business'} Customer
              </Typography>

              {customerType === 'individual' ? (
                <>
                  <TextField fullWidth label="First Name" sx={{ mb: 2 }}
                    value={newCustomer.first_name}
                    onChange={e => setNewCustomer({ ...newCustomer, first_name: e.target.value })} />
                  <TextField fullWidth label="Last Name" sx={{ mb: 2 }}
                    value={newCustomer.last_name}
                    onChange={e => setNewCustomer({ ...newCustomer, last_name: e.target.value })} />
                  <TextField fullWidth label="SSN" sx={{ mb: 2 }}
                    value={newCustomer.ssn}
                    onChange={e => setNewCustomer({ ...newCustomer, ssn: e.target.value })} />
                </>
              ) : (
                <>
                  <TextField fullWidth label="Business Name" sx={{ mb: 2 }}
                    value={newCustomer.business_name}
                    onChange={e => setNewCustomer({ ...newCustomer, business_name: e.target.value })} />
                  <TextField fullWidth label="Tax ID" sx={{ mb: 2 }}
                    value={newCustomer.tax_id}
                    onChange={e => setNewCustomer({ ...newCustomer, tax_id: e.target.value })} />
                  <TextField fullWidth label="Contact First Name" sx={{ mb: 2 }}
                    value={newCustomer.contact_first_name}
                    onChange={e => setNewCustomer({ ...newCustomer, contact_first_name: e.target.value })} />
                  <TextField fullWidth label="Contact Last Name" sx={{ mb: 2 }}
                    value={newCustomer.contact_last_name}
                    onChange={e => setNewCustomer({ ...newCustomer, contact_last_name: e.target.value })} />
                  <TextField fullWidth label="Contact Title" sx={{ mb: 2 }}
                    value={newCustomer.contact_title}
                    onChange={e => setNewCustomer({ ...newCustomer, contact_title: e.target.value })} />
                </>
              )}

              <TextField fullWidth label="Phone Number" sx={{ mb: 2 }}
                value={newCustomer.phone_number}
                onChange={e => setNewCustomer({ ...newCustomer, phone_number: e.target.value })} />
              <TextField fullWidth label="Email (optional)" sx={{ mb: 2 }}
                value={newCustomer.email}
                onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
              <TextField fullWidth label="Street Address" sx={{ mb: 2 }}
                value={newCustomer.street_address}
                onChange={e => setNewCustomer({ ...newCustomer, street_address: e.target.value })} />
              <TextField fullWidth label="City" sx={{ mb: 2 }}
                value={newCustomer.city}
                onChange={e => setNewCustomer({ ...newCustomer, city: e.target.value })} />
              <TextField fullWidth select label="State" sx={{ mb: 2 }}
                value={newCustomer.state}
                onChange={e => setNewCustomer({ ...newCustomer, state: e.target.value })}>
                {US_STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Postal Code" sx={{ mb: 2 }}
                value={newCustomer.postal_code}
                onChange={e => setNewCustomer({ ...newCustomer, postal_code: e.target.value })} />

              {addCustomerError && <Alert severity="error" sx={{ mb: 2 }}>{addCustomerError}</Alert>}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={handleAddCustomer}>Save Customer</Button>
                <Button variant="outlined" onClick={() => setShowAddCustomer(false)}>Cancel</Button>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* ── STEP 2: Vehicle Details ── */}
      {showVehicleForm && customer && (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            Seller:{' '}
            {'first_name' in customer
              ? `${customer.first_name} ${customer.last_name}`
              : customer.business_name}
            {' '}
            <Button size="small" onClick={() => setShowVehicleForm(false)}>(change)</Button>
          </Alert>

          <Typography variant="h6" mb={2}>Step 2: Vehicle Details</Typography>

          <TextField fullWidth label="VIN" sx={{ mb: 2 }}
            value={vehicleData.vin}
            onChange={e => setVehicleData({ ...vehicleData, vin: e.target.value })} />

          <TextField fullWidth select label="Vehicle Type" sx={{ mb: 2 }}
            value={vehicleData.vehicle_type}
            onChange={e => setVehicleData({ ...vehicleData, vehicle_type: e.target.value })}>
            {VEHICLE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>

          <TextField fullWidth select label="Condition" sx={{ mb: 2 }}
            value={vehicleData.condition}
            onChange={e => setVehicleData({ ...vehicleData, condition: e.target.value })}>
            {CONDITIONS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>

          <TextField fullWidth select label="Manufacturer" sx={{ mb: 2 }}
            value={vehicleData.manufacturer_name}
            onChange={e => setVehicleData({ ...vehicleData, manufacturer_name: e.target.value })}>
            {MANUFACTURERS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>

          <TextField fullWidth label="Model" sx={{ mb: 2 }}
            value={vehicleData.model_name}
            onChange={e => setVehicleData({ ...vehicleData, model_name: e.target.value })} />

          <TextField fullWidth label="Model Year (e.g. 2022)" sx={{ mb: 2 }}
            value={vehicleData.model_year}
            onChange={e => setVehicleData({ ...vehicleData, model_year: e.target.value })} />

          <TextField fullWidth select label="Fuel Type" sx={{ mb: 2 }}
            value={vehicleData.fuel_type}
            onChange={e => setVehicleData({ ...vehicleData, fuel_type: e.target.value })}>
            {FUEL_TYPES.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
          </TextField>

          <TextField fullWidth select label="Drivetrain" sx={{ mb: 2 }}
            value={vehicleData.drive_train}
            onChange={e => setVehicleData({ ...vehicleData, drive_train: e.target.value })}>
            {DRIVETRAINS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </TextField>

          <TextField fullWidth label="Horsepower" type="number" sx={{ mb: 2 }}
            value={vehicleData.horse_power}
            onChange={e => setVehicleData({ ...vehicleData, horse_power: e.target.value })} />

          <TextField fullWidth label="Purchase Price ($)" type="number" sx={{ mb: 2 }}
            value={vehicleData.purchase_price}
            onChange={e => setVehicleData({ ...vehicleData, purchase_price: e.target.value })} />

          <TextField fullWidth label="Purchase Date" type="date" sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
            value={vehicleData.purchase_date}
            onChange={e => setVehicleData({ ...vehicleData, purchase_date: e.target.value })} />

          <Box sx={{ mb: 2 }}>
            <FormLabel component="legend" sx={{ mb: 1 }}>Color(s)</FormLabel>
            <FormGroup row>
              {COLORS.map(color => (
                <FormControlLabel key={color} sx={{ width: '25%' }}
                  control={
                    <Checkbox
                      checked={selectedColors.includes(color)}
                      onChange={() => handleColorToggle(color)}
                      size="small"
                    />
                  }
                  label={color}
                />
              ))}
            </FormGroup>
          </Box>

          <TextField fullWidth multiline rows={3} label="Notes (optional)" sx={{ mb: 3 }}
            value={vehicleData.notes}
            onChange={e => setVehicleData({ ...vehicleData, notes: e.target.value })} />

          {vehicleError && <Alert severity="error" sx={{ mb: 2 }}>{vehicleError}</Alert>}

          <Button variant="contained" size="large" onClick={handleAddVehicle}>
            Add Vehicle
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AddVehiclePage;