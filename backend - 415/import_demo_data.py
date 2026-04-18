import csv
import os
import psycopg2
from db import get_db_connection

def find_file(options):
    """Helper to find the file even if it was saved with a typo or missing extension."""
    for opt in options:
        if os.path.exists(opt):
            return opt
    return None

def run_import():
    # Locate the files (accounting for the names provided in the chat)
    f_users = find_file(['users.tsv', 'users'])
    f_vendors = find_file(['vendors.tsv', 'vendors'])
    f_customers = find_file(['customer.tsv', 'customers.tsv', 'customer'])
    f_vehicles = find_file(['vehicles.tsv', 'vehiucles.tsv', 'vehiucles', 'vehicles'])
    f_parts = find_file(['parts.tsv', 'parts'])

    if not all([f_users, f_vendors, f_customers, f_vehicles, f_parts]):
        print("Error: Could not find all 5 TSV files. Please ensure they are in the backend folder.")
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 1. IMPORT STAFF
        print(f"Importing Staff from {f_users}...")
        role_map = {
            'acq_spec': 'Acquisition Specialist',
            'sales_agent': 'Sales Agent',
            'op_man': 'Operating Manager',
            'owner': 'Owner',
            'acq_spec,sales_agent,op_man': 'Owner'
        }
        with open(f_users, 'r', encoding='utf-8-sig') as f:
            for row in csv.DictReader(f, delimiter='\t'):
                role = role_map.get(row['role'].strip().lower(), 'Sales Agent')
                cursor.execute("""
                    INSERT INTO Staff (Username, Password, First_Name, Last_Name, Role)
                    VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING
                """, (row['username'], row['password'], row['first_name'], row['last_name'], role))

        # 2. IMPORT VENDORS
        print(f"Importing Vendors from {f_vendors}...")
        with open(f_vendors, 'r', encoding='utf-8-sig') as f:
            for row in csv.DictReader(f, delimiter='\t'):
                cursor.execute("""
                    INSERT INTO Vendor (Vendor_Name, Phone_Number, Street_Address, City, State, Postal_Code)
                    VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING
                """, (row['vendor_name'], row['phone'], row['street'], row['city'], row['state'], row['postal_code']))

        # 3. IMPORT CUSTOMERS (Splitting into Individual / Business)
        print(f"Importing Customers from {f_customers}...")
        customer_id_map = {}
        with open(f_customers, 'r', encoding='utf-8-sig') as f:
            for row in csv.DictReader(f, delimiter='\t'):
                cursor.execute("""
                    INSERT INTO Customer (Email, Phone_Number, Street_Address, City, State, Postal_Code)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING Customer_ID
                """, (row['email'] or None, row['phone'], row['street'], row['city'], row['state'], row['postal']))
                cid = cursor.fetchone()[0]

                if row['customer_type'].lower() == 'person':
                    ssn = row['person_ssn']
                    cursor.execute("""
                        INSERT INTO Individual (SSN, Customer_ID, First_Name, Last_Name)
                        VALUES (%s, %s, %s, %s)
                    """, (ssn, cid, row['person_first'], row['person_last']))
                    customer_id_map[ssn] = cid
                else:
                    tax_id = row['biz_tax_id']
                    cursor.execute("""
                        INSERT INTO Business (Tax_ID, Customer_ID, Business_Name, Contact_First_Name, Contact_Last_Name, Contact_Title)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (tax_id, cid, row['biz_name'], row['biz_contact_first'], row['biz_contact_last'], row['biz_contact_title']))
                    customer_id_map[tax_id] = cid

        # 4. IMPORT VEHICLES
        print(f"Importing Vehicles from {f_vehicles}...")
        vehicle_acq_map = {}
        with open(f_vehicles, 'r', encoding='utf-8-sig') as f:
            for row in csv.DictReader(f, delimiter='\t'):
                vin = row['VIN']
                
                # Insert missing Types & Manufacturers to avoid foreign key errors
                cursor.execute("INSERT INTO Vehicle_Type (Vehicle_Type) VALUES (%s) ON CONFLICT DO NOTHING", (row['vehicle_type'],))
                cursor.execute("INSERT INTO Vehicle_Manufacturer (Manufacturer_Name) VALUES (%s) ON CONFLICT DO NOTHING", (row['manufacturer_name'],))
                
                cursor.execute("""
                    INSERT INTO Vehicle (VIN, Vehicle_Type, Manufacturer_Name, Model_Name, Model_Year, Fuel_Type, Horse_Power, Drive_Train, Notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING
                """, (vin, row['vehicle_type'], row['manufacturer_name'], row['model_name'], row['year'], row['fuel_type'], row['horsepower'], row['drivetrain'], row['notes']))
                
                # Insert Colors
                for c in row['colors'].split(','):
                    c = c.strip()
                    if c:
                        cursor.execute("INSERT INTO Vehicle_Color (VIN, Color) VALUES (%s, %s) ON CONFLICT DO NOTHING", (vin, c))

                # Insert Purchase Transaction
                seller_id = customer_id_map.get(row['purchased_from_customer'])
                if not seller_id:
                    continue # Skip if customer reference is broken in the TSV
                    
                vehicle_acq_map[vin] = row['acq_spec']
                cursor.execute("""
                    INSERT INTO Purchase_Transaction (VIN, Customer_ID, Username, Purchase_Date, Purchase_Price, Purchase_Condition)
                    VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING
                """, (vin, seller_id, row['acq_spec'], row['purchase_date'], row['purchase_price'], row['condition']))

                # Insert Sales Transaction (if sold)
                if row.get('sale_date'):
                    buyer_id = customer_id_map.get(row['sold_to_customer'])
                    # The provided TSV data doesn't include a final sales_price, so we calculate a dummy one
                    sales_price = float(row['purchase_price']) * 1.30 
                    cursor.execute("""
                        INSERT INTO Sales_Transaction (VIN, Customer_ID, Username, Sales_Date, Sales_Price)
                        VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING
                    """, (vin, buyer_id, row['salesperson'], row['sale_date'], sales_price))

        # 5. IMPORT PARTS
        print(f"Importing Parts from {f_parts}...")
        with open(f_parts, 'r', encoding='utf-8-sig') as f:
            for row in csv.DictReader(f, delimiter='\t'):
                vin = row['VIN']
                order_num = row['order_num']
                vendor = row['vendor_name']
                
                # Insert Parts Order wrapper
                cursor.execute("""
                    INSERT INTO Parts_Order (VIN, Ordinal_Number, Vendor_Name, AcquisitionSpecialist)
                    VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING
                """, (vin, order_num, vendor, vehicle_acq_map.get(vin, 'owner')))
                
                # Insert the specific part
                cursor.execute("""
                    INSERT INTO Part (VIN, Ordinal_Number, Vendor_Part_Number, part_name, Description, Unit_Price, Status, Quantity)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING
                """, (vin, order_num, row['part_number'], row['description'][:50], row['description'], row['price'], row['status'], row['qty']))

        conn.commit()
        print("✅ Successfully imported all demo data!")

    except Exception as e:
        conn.rollback()
        print(f"❌ An error occurred: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    run_import()