import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Typography,
  CircularProgress,
  Alert,
  ListItem,
  List,
  Box,
  Stack,
  Button,
  Select,
  MenuItem,
} from '@mui/material';
import type { Part, Vehicle } from '../services/interfaces';
import { formatDate, formatPrice } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { getVehicleByVin } from '../services/vehicleService';
import { Roles } from '../utils/roles';
import { ViewEditModal } from '../components/ViewEditModal';
import { getAllowedStatuses } from '../utils/constants';
import { updatePartStatus } from '../services/partsService';
import { parseVehicleData, getCustomerDisplayName } from '../utils/parsers';

const VehicleDetailPage = () => {
  const { vin } = useParams<{ vin: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [allowedStatuses, setAllowedStatuses] = useState<
    ('ordered' | 'received' | 'installed')[] | []
  >([]);
  const [status, setStatus] = useState<'ordered' | 'received' | 'installed'>('ordered');
  const { user } = useAuth();
  const isSalesAgent = user?.role === Roles.SALES_AGENT;
  const isAcquisitionSpecialist = user?.role === Roles.ACQUISITION_SPECIALIST;
  const isOperatingManager = user?.role === Roles.OPERATING_MANAGER;
  const isOwner = user?.role === Roles.OWNER;
  const canSellVehicle = isSalesAgent || isOwner || isAcquisitionSpecialist || isOperatingManager;
  const canViewAcquisitionInfo = isAcquisitionSpecialist || isOperatingManager || isOwner;
  const canViewOperatingManagerInfo = isOperatingManager || isOwner;
  const navigate = useNavigate();

  useEffect(() => {
    if (!vin) return; // exit early inside the effect

    const fetchVehicle = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getVehicleByVin(vin, user?.role ?? Roles.PUBLIC);
        setVehicle(data ? parseVehicleData(data) : null);
      } catch {
        setError('Failed to fetch vehicle details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [vin, user?.role]);

  if (!vin) {
    return <Alert severity="error">No VIN provided in URL.</Alert>;
  }

  if (loading) return <CircularProgress sx={{ display: 'block', m: 'auto', mt: 5 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!vehicle) return <Typography>No vehicle with that vin found.</Typography>;

  const handleCancel = () => {
    setIsOpen(false);
    setSelectedPart(null);
  };

  const handleSave = async () => {
    if (!selectedPart) return;

    try {
      await updatePartStatus({
        parts_order_number: `${selectedPart.vin}-${selectedPart.ordinal_number}`,
        vendor_part_number: selectedPart.vendor_part_number,
        status: status as 'ordered' | 'received' | 'installed',
      });

      setVehicle((prev) => {
        if (!prev) return prev;
        const updatedParts = prev.parts?.map((p) =>
          p.ordinal_number === selectedPart.ordinal_number &&
          p.vendor_part_number === selectedPart.vendor_part_number
            ? { ...p, status }
            : p
        );
        return { ...prev, parts: updatedParts };
      });

      handleCancel(); // closes modal
    } catch (err) {
      alert(`Failed to update status with error: ${err} . Try again.`);
    }
  };

  return (
    <Box sx={{ position: 'relative', mb: 3 }}>
      {/* Header */}
      <Typography variant="h2" component="h1" sx={{ lineHeight: 1.2 }}>
        {vehicle.model_year} {vehicle.manufacturer_name} {vehicle.model_name}
      </Typography>

      {/* Buttons (floating top right) */}
      <Stack
        direction="column"
        spacing={1}
        sx={{ position: 'absolute', top: 0, right: 0, alignItems: 'flex-end' }}
      >
        <Button variant="outlined" component={Link} to="/">
          Back to Search
        </Button>
        {canSellVehicle && (
          <Button variant="contained" onClick={() => navigate('/sell-vehicle')}>
            Sell Vehicle
          </Button>
        )}
        {canViewAcquisitionInfo && (
          <Button variant="contained" onClick={() => navigate('/add-parts-order')}>
            Add Parts Order
          </Button>
        )}
      </Stack>

      {/* Main content with two columns */}
      <Stack direction="row" spacing={4} mt={3}>
        {/* Left column: Vehicle details */}
        <Stack spacing={1} flex={1}>
          <Typography variant="h5">Vehicle Details</Typography>
          <List>
            <ListItem>VIN: {vehicle.vin}</ListItem>
            <ListItem>Vehicle Type: {vehicle.vehicle_type}</ListItem>
            <ListItem>Manufacturer: {vehicle.manufacturer_name}</ListItem>
            <ListItem>Model: {vehicle.model_name}</ListItem>
            <ListItem>Year: {vehicle.model_year}</ListItem>
            <ListItem>Fuel Type: {vehicle.fuel_type}</ListItem>
            <ListItem>Drivetrain Layout: {vehicle.drive_train}</ListItem>
            <ListItem>Color(s): {vehicle.colors ? vehicle.colors : 'Unavailable'}</ListItem>
            <ListItem>Horsepower: {vehicle.horse_power}hp</ListItem>
            <ListItem>
              Sales Price: {vehicle.sales_price ? formatPrice(vehicle.sales_price, 0) : '$0'}
            </ListItem>
            {/* Original Purchase Price + Costs */}
            {canViewAcquisitionInfo && (
              <>
                <Typography variant="h5">Purchase Info</Typography>
                <ListItem>
                  Original Purchase Price:{' '}
                  {vehicle.purchase_price ? formatPrice(vehicle.purchase_price, 2) : '$0'}
                </ListItem>
                <ListItem>
                  All Parts Total Cost:{' '}
                  {vehicle.total_parts_cost ? formatPrice(vehicle.total_parts_cost, 2) : '$0'}
                </ListItem>
                <ListItem>
                  Original Purchase Date:{' '}
                  {vehicle.purchase_date ? formatDate(vehicle.purchase_date) : 'N/A'}
                </ListItem>
              </>
            )}
            {/* Seller Info */}
            {canViewOperatingManagerInfo && (
              <>
                <ListItem>Seller Contact Name: {vehicle.seller?.contact_name ?? 'N/A'}</ListItem>
                <ListItem>Seller Email: {vehicle.seller?.email ?? 'N/A'}</ListItem>
                <ListItem>Seller Phone Number: {vehicle.seller?.phone_number ?? 'N/A'}</ListItem>
                <ListItem>
                  Acquisition Specialist: {vehicle.seller?.acquisition_specialist ?? 'N/A'}
                </ListItem>
              </>
            )}
            {/* Buyer info, if available */}
            {canViewOperatingManagerInfo && vehicle.buyer && (
              <>
                <Typography variant="h5">Buyer Info</Typography>
                <ListItem>
                  Buyer Contact Name: {getCustomerDisplayName(vehicle.buyer) ?? 'N/A'}
                </ListItem>
                <ListItem>Buyer Email: {vehicle.buyer.email ?? 'N/A'}</ListItem>
                <ListItem>Buyer Phone Number: {vehicle.buyer.phone_number ?? 'N/A'}</ListItem>
                <ListItem>
                  Sale Date:{' '}
                  {vehicle.buyer.sales_date ? formatDate(vehicle.buyer.sales_date) : 'N/A'}
                </ListItem>
                <ListItem>Sales Agent: {vehicle.buyer.sales_agent ?? 'N/A'}</ListItem>
              </>
            )}
          </List>
        </Stack>

        {/* Right column: Parts List */}
        <Stack spacing={1} flex={1}>
          <Typography variant="h5" component="h2">
            Parts
          </Typography>
          {vehicle.parts && vehicle.parts.length > 0 ? (
            <List>
              {vehicle.parts.map((part) => (
                <ListItem
                  key={part.ordinal_number}
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>
                    {part.part_name} - {formatPrice(part.unit_price, 2)} x {part.quantity} (
                    {part.status})
                  </span>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSelectedPart(part);
                      setStatus(part.status);
                      setAllowedStatuses(getAllowedStatuses(part.status));
                      setIsOpen(true);
                    }}
                  >
                    Details
                  </Button>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>No parts information available.</Typography>
          )}
        </Stack>
      </Stack>

      <ViewEditModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Part: ${selectedPart?.part_name}`}
        content={
          <>
            <List>
              <ListItem>
                Parts Order Number: {selectedPart?.vin + '-' + selectedPart?.ordinal_number}
              </ListItem>
              <ListItem>Ordinal Number: {selectedPart?.ordinal_number}</ListItem>
              <ListItem>Vendor Part Number: {selectedPart?.vendor_part_number}</ListItem>
              <ListItem>Description: {selectedPart?.description}</ListItem>
              <ListItem>Vendor Name: {selectedPart?.vendor_name}</ListItem>
              <ListItem>Part Unit Price: {formatPrice(selectedPart?.unit_price ?? 0, 2)}</ListItem>
              <ListItem>Quantity: {selectedPart?.quantity}</ListItem>
              <ListItem>
                Status:
                <Select
                  value={status}
                  size="small"
                  sx={{ ml: 1 }}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {allowedStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </ListItem>
            </List>
          </>
        }
        actions={
          <>
            <Button variant="contained" onClick={handleSave}>
              Save
            </Button>
            <Button variant="outlined" onClick={handleCancel} sx={{ ml: 1 }}>
              Cancel
            </Button>
          </>
        }
      />
    </Box>
  );
};

export default VehicleDetailPage;
