import type {
  BusinessCustomer,
  IndividualCustomer,
  Vehicle,
  VehicleCustomer,
} from '../services/interfaces';
import { STATUS_ORDER } from './constants';
import type { PartStatus } from './constants';

const isPartStatus = (status: string): status is PartStatus => {
  return STATUS_ORDER.includes(status as PartStatus);
};

type RawPart = {
  vin: string;
  ordinal_number: number | string;
  vendor_part_number: string;
  part_name: string;
  description: string;
  unit_price: number;
  status: string;
  quantity: number;
  vendor_name: string;
};

type RawCustomer = {
  customer_id: number;
  customer_type: 'Individual' | 'Business';

  first_name?: string;
  last_name?: string;

  business_name?: string;
  contact_first_name?: string;
  contact_last_name?: string;

  email?: string;
  phone_number?: string;

  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;

  ssn?: string;

  contact_title?: string;

  [key: string]: unknown;
};

type RawVehicle = {
  vin: string;
  vehicle_type: string;
  manufacturer_name: string;
  model_name: string;
  model_year: number;
  fuel_type: string;
  drive_train: string;
  colors: string;
  horse_power: number;
  sales_price: string;
  purchase_price?: string;
  total_parts_cost?: string;
  parts?: RawPart[];
  notes?: string;
  buyer?: RawCustomer;
  seller?: RawCustomer;
};

export const parseVehicleData = (raw: RawVehicle): Vehicle => {
  return {
    ...raw,
    purchase_price: raw.purchase_price ? parseFloat(raw.purchase_price) : undefined,
    sales_price: raw.sales_price ? parseFloat(raw.sales_price) : 0,
    total_parts_cost: raw.total_parts_cost ? parseFloat(raw.total_parts_cost) : undefined,
    parts: raw.parts?.map((p: RawPart) => ({
      ...p,
      ordinal_number: Number(p.ordinal_number),
      status: isPartStatus(p.status) ? p.status : 'ordered', // Default to 'ordered' if status is invalid
    })),
    seller: raw.seller ? parseVehicleCustomer(raw.seller) : undefined,
    buyer: raw.buyer ? parseVehicleCustomer(raw.buyer) : undefined,
  };
};

export const parseVehicleCustomer = (raw: RawCustomer): VehicleCustomer => {
  if (raw.customer_type === 'Individual') {
    return {
      ...raw,
      customer_type: 'Individual',
      contact_name: `${raw.first_name ?? ''} ${raw.last_name ?? ''}`.trim(),
    } as IndividualCustomer;
  }

  return {
    ...raw,
    customer_type: 'Business',
    contact_name: `${raw.contact_first_name ?? ''} ${raw.contact_last_name ?? ''}`.trim(),
  } as BusinessCustomer;
};

export const getCustomerDisplayName = (customer?: VehicleCustomer): string => {
  if (!customer) return '';
  return customer.contact_name;
};
