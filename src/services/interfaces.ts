export interface Vehicle {
  vin: string;
  vehicle_type: string;
  manufacturer_name: string;
  model_name: string;
  model_year: number;
  fuel_type: string;
  drive_train: string;
  colors: string;
  horse_power: number;
  sales_price: number;
  purchase_price?: number;
  total_parts_cost?: number;
  parts?: Part[];
  notes?: string;
  buyer?: VehicleCustomer;
  seller?: VehicleCustomer;
  purchase_date?: string;
}

export interface Part {
  vin: string;
  ordinal_number: number;
  vendor_part_number: string;
  vendor_name: string;
  part_name: string;
  description: string;
  unit_price: number;
  status: 'ordered' | 'received' | 'installed';
  quantity: number;
}

export interface PartOrder {
  vin: string;
  ordinal_number: number;
  vendor_name: string;
  acquisitionspecialist: string;
}

export interface Customer {
  customer_id: number;
  email?: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  customer_type: 'Individual' | 'Business';
  contact_name: string;
}

export interface IndividualCustomer extends Customer {
  ssn: string;
  first_name: string;
  last_name: string;
}

export interface BusinessCustomer extends Customer {
  tax_id: string;
  business_name: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_title: string;
}
export interface Seller extends IndividualCustomer, BusinessCustomer {
  acquisition_specialist: string; // full name of staff who purchased
}

export interface Buyer extends IndividualCustomer, BusinessCustomer {
  sales_agent: string; // full name of staff who sold
  sales_date: string;
  sales_price: number;
}

export interface VehicleCustomer extends Customer {
  acquisition_specialist?: string; // for seller
  sales_agent?: string; // for buyer
  sales_date?: string; // for buyer
  sales_price?: number; // for buyer
}

// Report Interfaces
export interface PartsStatistics {
  vendor_name: string;
  total_quantity_supplied: number;
  total_dollar_amount_spent: string; // Using string to match the format returned by the backend
}

export interface AvgTimeInInventory {
  vehicle_type: string;
  avg_days_in_inventory: number;
}

export interface PricePerCondition {
  purchase_condition: string;
  avg_purchase_price: number;
  vehicle_type: string;
}
