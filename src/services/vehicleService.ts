import type { Vehicle } from './interfaces';
import { Roles } from '../utils/roles';

export const getVehicleByVin = async (
  vin: string,
  role: string = Roles.PUBLIC
): Promise<Vehicle | undefined> => {
  const cleanVin = encodeURIComponent(vin.trim());
  const cleanRole = encodeURIComponent(role.trim());
  return fetch(`http://localhost:5000/api/vehicles/${cleanVin}?role=${cleanRole}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => data as Vehicle)
    .catch((error) => {
      throw error;
    });
};

export const addVehicle = async (data: {
  vin: string;
  vehicle_type: string;
  purchase_condition: string;
  manufacturer_name: string;
  model_name: string;
  model_year: number;
  fuel_type: string;
  drive_train: string;
  horse_power: number;
  purchase_price: number;
  purchase_date: string;
  colors: string[];
  customer_id: number;
  username: string;
  notes?: string;
}): Promise<{ message: string }> => {
  return fetch('http://localhost:5000/api/vehicles/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to add vehicle');
      return res.json();
    })
    .catch(error => { throw error; });
};