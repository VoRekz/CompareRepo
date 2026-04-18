from flask import Blueprint, request, jsonify
import psycopg2.extras
import csv
import io
from db import get_db_connection

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/bulk-upload', methods=['POST'])
def bulk_upload():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file_type = request.form.get('file_type')
    if not file_type:
        return jsonify({"error": "No file type specified"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        # Read the file directly from memory, handling both TSV and CSV
        content = file.stream.read().decode("UTF8")
        delimiter = '\t' if file.filename.lower().endswith('.tsv') else ','
        stream = io.StringIO(content, newline=None)
        csv_reader = csv.DictReader(stream, delimiter=delimiter)

        count = 0

        if file_type == 'staff':
            role_map = {
                'acq_spec': 'Acquisition Specialist',
                'sales_agent': 'Sales Agent',
                'op_man': 'Operating Manager',
                'owner': 'Owner',
                'acq_spec,sales_agent,op_man': 'Owner'
            }
            for row in csv_reader:
                if not row.get('username'):
                    continue
                role = role_map.get(row.get('role', '').strip().lower(), 'Sales Agent')
                cursor.execute("""
                    INSERT INTO Staff (Username, Password, First_Name, Last_Name, Role)
                    VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING
                """, (row['username'], row['password'], row['first_name'], row['last_name'], role))
                count += 1

        elif file_type == 'vendors':
            for row in csv_reader:
                if not row.get('vendor_name'):
                    continue
                cursor.execute("""
                    INSERT INTO Vendor (Vendor_Name, Phone_Number, Street_Address, City, State, Postal_Code)
                    VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING
                """, (row.get('vendor_name'), row.get('phone'), row.get('street'), row.get('city'), row.get('state'), row.get('postal_code')))
                count += 1

        elif file_type == 'customers':
            for row in csv_reader:
                if not any(v for v in row.values() if v and str(v).strip()):
                    continue
                customer_type = row.get('customer_type', '').strip().lower()
                cursor.execute("""
                    INSERT INTO Customer (Email, Phone_Number, Street_Address, City, State, Postal_Code)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING Customer_ID
                """, (row.get('email') or None, row.get('phone'), row.get('street'), row.get('city'), row.get('state'), row.get('postal') or row.get('postal_code')))
                customer_id = cursor.fetchone()['customer_id']

                if customer_type in ['person', 'individual']:
                    cursor.execute("""
                        INSERT INTO Individual (SSN, Customer_ID, First_Name, Last_Name)
                        VALUES (%s, %s, %s, %s)
                    """, (row.get('person_ssn'), customer_id, row.get('person_first'), row.get('person_last')))
                else:
                    cursor.execute("""
                        INSERT INTO Business (Tax_ID, Customer_ID, Business_Name, Contact_First_Name, Contact_Last_Name, Contact_Title)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (row.get('biz_tax_id'), customer_id, row.get('biz_name'), row.get('biz_contact_first'), row.get('biz_contact_last'), row.get('biz_contact_title')))
                count += 1

        elif file_type == 'vehicles':
            # Helper to retrieve an existing Customer ID by SSN or Tax ID
            def get_cid(identifier):
                if not identifier: return None
                cursor.execute("""
                    SELECT c.Customer_ID FROM Customer c
                    LEFT JOIN Individual i ON c.Customer_ID = i.Customer_ID
                    LEFT JOIN Business b ON c.Customer_ID = b.Customer_ID
                    WHERE i.SSN = %s OR b.Tax_ID = %s
                """, (identifier, identifier))
                res = cursor.fetchone()
                return res['customer_id'] if res else None

            for row in csv_reader:
                vin = row.get('VIN') or row.get('vin')
                if not vin:
                    continue
                
                year_val = row.get('year') or row.get('model_year')
                year = int(year_val) if year_val and str(year_val).strip() else None
                
                hp_val = row.get('horsepower') or row.get('horse_power')
                hp = int(hp_val) if hp_val and str(hp_val).strip() else None

                cursor.execute("INSERT INTO Vehicle_Type (Vehicle_Type) VALUES (%s) ON CONFLICT DO NOTHING", (row.get('vehicle_type'),))
                cursor.execute("INSERT INTO Vehicle_Manufacturer (Manufacturer_Name) VALUES (%s) ON CONFLICT DO NOTHING", (row.get('manufacturer_name'),))
                
                cursor.execute("""
                    INSERT INTO Vehicle (VIN, Vehicle_Type, Manufacturer_Name, Model_Name, Model_Year, Fuel_Type, Horse_Power, Drive_Train, Notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING
                """, (vin, row.get('vehicle_type'), row.get('manufacturer_name'), row.get('model_name'), year, row.get('fuel_type'), hp, row.get('drivetrain'), row.get('notes')))
                
                colors_str = row.get('colors', '')
                for c in colors_str.split(','):
                    c = c.strip()
                    if c:
                        cursor.execute("INSERT INTO Vehicle_Color (VIN, Color) VALUES (%s, %s) ON CONFLICT DO NOTHING", (vin, c))

                seller_id = get_cid(row.get('purchased_from_customer'))
                if seller_id:
                    cursor.execute("""
                        INSERT INTO Purchase_Transaction (VIN, Customer_ID, Username, Purchase_Date, Purchase_Price, Purchase_Condition)
                        VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING
                    """, (vin, seller_id, row['acq_spec'], row['purchase_date'], row['purchase_price'], row['condition']))

                if row.get('sale_date'):
                    buyer_id = get_cid(row.get('sold_to_customer'))
                    sales_price = float(row['purchase_price']) * 1.30 
                    cursor.execute("""
                        INSERT INTO Sales_Transaction (VIN, Customer_ID, Username, Sales_Date, Sales_Price)
                        VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING
                    """, (vin, buyer_id, row['salesperson'], row.get('sale_date'), sales_price))
                count += 1

        elif file_type == 'parts':
            for row in csv_reader:
                vin = row.get('VIN') or row.get('vin')
                if not vin:
                    continue
                order_num = row.get('order_num')
                vendor = row.get('vendor_name')
                
                cursor.execute("SELECT Username FROM Purchase_Transaction WHERE VIN = %s", (vin,))
                acq_res = cursor.fetchone()
                acq_spec = acq_res['username'] if acq_res else 'owner'

                qty_val = row.get('qty') or row.get('quantity')
                qty = int(qty_val) if qty_val and str(qty_val).strip() else None
                price_val = row.get('price') or row.get('unit_price')
                price = float(price_val) if price_val and str(price_val).strip() else None

                cursor.execute("INSERT INTO Parts_Order (VIN, Ordinal_Number, Vendor_Name, AcquisitionSpecialist) VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING", (vin, order_num, vendor, acq_spec))
                cursor.execute("INSERT INTO Part (VIN, Ordinal_Number, Vendor_Part_Number, Description, Unit_Price, Status, Quantity, Vendor_Name) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING", (vin, order_num, row.get('part_number'), row.get('description'), price, row.get('status'), qty, vendor))
                count += 1

        conn.commit()
        return jsonify({"message": f"Successfully imported {count} records for {file_type}!"}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to process file: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()