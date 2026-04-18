from flask import Blueprint, request, jsonify
import psycopg2.extras
from db import get_db_connection
from constants import PUBLIC, ACQUISITION_SPECIALIST, SALES_AGENT, OPERATING_MANAGER, OWNER

vehicles_bp = Blueprint('vehicles', __name__)

@vehicles_bp.route('/search', methods=['GET'])
def search_vehicles():
    role = request.args.get('role', PUBLIC) 
    keyword = request.args.get('keyword', '')
    vin_search = request.args.get('vin', '')
    vehicle_type = request.args.get('vehicle_type', '')
    manufacturer_name = request.args.get('manufacturer_name', '')
    model_year = request.args.get('model_year', '')
    color = request.args.get('color', '')
    min_price = request.args.get('min_price', '')
    max_price = request.args.get('max_price', '')
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    query = """
        SELECT * FROM (
            SELECT 
                v.VIN, 
                v.Vehicle_Type, 
                v.Manufacturer_Name, 
                v.Model_Name, 
                v.Model_Year, 
                v.Notes,
                (SELECT STRING_AGG(DISTINCT color, ',') FROM vehicle_color vc WHERE vc.vin = v.vin) AS colors,
                (
                    SELECT ROUND(
                        (MAX(pt.purchase_price) * 1.25) +
                        (COALESCE(SUM(p.unit_price * p.quantity), 0) * 1.1), 2
                    )
                    FROM purchase_transaction pt
                    LEFT JOIN part p ON pt.vin = p.vin
                    WHERE pt.vin = v.vin
                ) AS sales_price,
                EXISTS (
                    SELECT 1 
                    FROM Part p
                    WHERE p.VIN = v.VIN AND p.Status != 'installed'
                ) AS has_pending_parts
            FROM Vehicle v
            LEFT JOIN Sales_Transaction st ON v.VIN = st.VIN
            WHERE st.VIN IS NULL 
    """

    # Business Rule: Public and Sales Agents cannot see vehicles with pending parts
    if role in ['Public', 'Sales Agent']:
        query += """
            AND v.VIN NOT IN (
                SELECT po.VIN 
                FROM Parts_Order po
                JOIN Part p ON po.VIN = p.VIN AND po.Ordinal_Number = p.Ordinal_Number
                WHERE p.Status != 'installed'
            )
        """

    query += ") AS inventory WHERE 1=1"
    params = []

    if keyword:
        query += " AND (Manufacturer_Name ILIKE %s OR Model_Name ILIKE %s OR CAST(Model_Year AS TEXT) ILIKE %s OR Notes ILIKE %s)"
        search_term = f"%{keyword}%"
        params.extend([search_term, search_term, search_term, search_term])
        
    if vin_search and role != 'Public':
        query += " AND VIN ILIKE %s"
        params.append(f"%{vin_search}%")
        
    if vehicle_type:
        query += " AND Vehicle_Type ILIKE %s"
        params.append(f"%{vehicle_type}%")
        
    if manufacturer_name:
        query += " AND Manufacturer_Name ILIKE %s"
        params.append(f"%{manufacturer_name}%")
        
    if model_year:
        query += " AND Model_Year = %s"
        params.append(int(model_year))
        
    if color:
        query += " AND colors ILIKE %s"
        params.append(f"%{color}%")
        
    if min_price:
        query += " AND sales_price >= %s"
        params.append(float(min_price))
        
    if max_price:
        query += " AND sales_price <= %s"
        params.append(float(max_price))

    query += " ORDER BY VIN ASC"
    
    cursor.execute(query, tuple(params))
    vehicles = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify(vehicles), 200

@vehicles_bp.route('/<vin>', methods=['GET'])
def get_vehicle_details(vin):
    role = request.args.get('role', PUBLIC)
    print(f"Received request for vehicle details with VIN: {vin} and role: {role}")

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    query = ""

    if role in [PUBLIC, SALES_AGENT]:
        query = """
        SELECT 
            v.vin,
            vt.vehicle_type,
            vm.manufacturer_name,
            v.model_name,
            v.model_year,
            v.fuel_type,
            v.horse_power,
            v.drive_train,
            (
                SELECT STRING_AGG(DISTINCT color, ',')
                FROM vehicle_color vc
                WHERE vc.vin = v.vin
            ) AS colors,
            v.notes,
            (
                SELECT ROUND(
                    (MAX(pt.purchase_price) * 1.25) +
                    (COALESCE(SUM(p.unit_price * p.quantity), 0) * 1.1),
                    2
                )
                FROM purchase_transaction pt
                LEFT JOIN part p ON pt.vin = p.vin
                WHERE pt.vin = v.vin
            ) AS sales_price
        FROM vehicle v
        JOIN vehicle_type vt ON v.vehicle_type = vt.vehicle_type
        JOIN vehicle_manufacturer vm ON v.manufacturer_name = vm.manufacturer_name
        WHERE v.vin = %s;
        """
    elif role in [ACQUISITION_SPECIALIST]:
        query = """
        SELECT 
            v.vin,
            vt.vehicle_type,
            vm.manufacturer_name,
            v.model_name,
            v.model_year,
            v.fuel_type,
            v.horse_power,
            v.drive_train,

            (
                SELECT STRING_AGG(DISTINCT color, ',')
                FROM vehicle_color vc
                WHERE vc.vin = v.vin
            ) AS colors,

            v.notes,

            (
                SELECT ROUND(
                    (MAX(pt.purchase_price) * 1.25) +
                    (COALESCE(SUM(p.unit_price * p.quantity), 0) * 1.1),
                    2
                )
                FROM purchase_transaction pt
                LEFT JOIN part p ON pt.vin = p.vin
                WHERE pt.vin = v.vin
            ) AS sales_price,

            (
                SELECT ROUND(pt.purchase_price, 2)
                FROM purchase_transaction pt
                WHERE pt.vin = v.vin
            ) AS purchase_price,

            (
                SELECT ROUND(COALESCE(SUM(p.unit_price * p.quantity), 0), 2)
                FROM purchase_transaction pt
                LEFT JOIN part p ON pt.vin = p.vin
                WHERE pt.vin = v.vin
            ) AS total_parts_cost,
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'vin', p.vin,
                            'ordinal_number', p.ordinal_number,
                            'vendor_part_number', p.vendor_part_number,
                            'part_name', p.part_name,
                            'description', p.description,
                            'unit_price', p.unit_price,
                            'status', p.status,
                            'quantity', p.quantity,
                            'vendor_name', p.vendor_name
                        )
                        ORDER BY p.ordinal_number
                    )
                    FROM part p
                    WHERE p.vin = v.vin
                ),
                '[]'::json
            ) AS parts

        FROM vehicle v
        JOIN vehicle_type vt ON v.vehicle_type = vt.vehicle_type
        JOIN vehicle_manufacturer vm ON v.manufacturer_name = vm.manufacturer_name
        WHERE v.vin = %s;
        """
    elif role in [OPERATING_MANAGER, OWNER]:
        query = """
        SELECT 
        v.vin,
        vt.vehicle_type,
        vm.manufacturer_name,
        v.model_name,
        v.model_year,
        v.fuel_type,
        v.horse_power,
        v.drive_train,

        (
            SELECT STRING_AGG(DISTINCT color, ',')
            FROM vehicle_color vc
            WHERE vc.vin = v.vin
        ) AS colors,

        v.notes,

        (
            SELECT ROUND(
                (MAX(pt.purchase_price) * 1.25) +
                (COALESCE(SUM(p.unit_price * p.quantity), 0) * 1.1),
                2
            )
            FROM purchase_transaction pt
            LEFT JOIN part p ON pt.vin = p.vin
            WHERE pt.vin = v.vin
        ) AS sales_price,

        (
            SELECT ROUND(pt.purchase_price, 2)
            FROM purchase_transaction pt
            WHERE pt.vin = v.vin
        ) AS purchase_price,

        (
            SELECT pt.purchase_date
            FROM purchase_transaction pt
            WHERE pt.vin = v.vin
        ) AS purchase_date,

        (
            SELECT ROUND(COALESCE(SUM(p.unit_price * p.quantity), 0), 2)
            FROM purchase_transaction pt
            LEFT JOIN part p ON pt.vin = p.vin
            WHERE pt.vin = v.vin
        ) AS total_parts_cost,            

        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'vin', p.vin,
                        'ordinal_number', p.ordinal_number,
                        'vendor_part_number', p.vendor_part_number,
                        'part_name', p.part_name,
                        'description', p.description,
                        'unit_price', p.unit_price,
                        'status', p.status,
                        'quantity', p.quantity,
                        'vendor_name', p.vendor_name
                    )
                    ORDER BY p.ordinal_number
                )
                FROM part p
                WHERE p.vin = v.vin
            ),
            '[]'::json
        ) AS parts,

        -- Seller info
        (
            SELECT json_build_object(
                'customer_id', c.customer_id,
                'email', c.email,
                'phone_number', c.phone_number,
                'street_address', c.street_address,
                'city', c.city,
                'state', c.state,
                'postal_code', c.postal_code,
                'customer_type', CASE WHEN i.customer_id IS NOT NULL THEN 'Individual' ELSE 'Business' END,
                'first_name', i.first_name,
                'last_name', i.last_name,
                'ssn', i.ssn,
                'business_name', b.business_name,
                'contact_first_name', b.contact_first_name,
                'contact_last_name', b.contact_last_name,
                'contact_title', b.contact_title,
                'contact_name', CASE 
                    WHEN i.customer_id IS NOT NULL THEN i.first_name || ' ' || i.last_name
                    ELSE b.contact_first_name || ' ' || b.contact_last_name
                END,
                'acquisition_specialist', s.first_name || ' ' || s.last_name
            )
            FROM purchase_transaction pt
            JOIN customer c ON pt.customer_id = c.customer_id
            LEFT JOIN individual i ON c.customer_id = i.customer_id
            LEFT JOIN business b ON c.customer_id = b.customer_id
            LEFT JOIN staff s ON pt.username = s.username
            WHERE pt.vin = v.vin
            LIMIT 1
        ) AS seller,

        -- Buyer info (if sold)
        (
            SELECT json_build_object(
                'customer_id', c.customer_id,
                'email', c.email,
                'phone_number', c.phone_number,
                'street_address', c.street_address,
                'city', c.city,
                'state', c.state,
                'postal_code', c.postal_code,
                'customer_type', CASE WHEN i.customer_id IS NOT NULL THEN 'Individual' ELSE 'Business' END,
                'first_name', i.first_name,
                'last_name', i.last_name,
                'ssn', i.ssn,
                'business_name', b.business_name,
                'contact_first_name', b.contact_first_name,
                'contact_last_name', b.contact_last_name,
                'contact_title', b.contact_title,
                'contact_name', CASE 
                    WHEN i.customer_id IS NOT NULL THEN i.first_name || ' ' || i.last_name
                    ELSE b.contact_first_name || ' ' || b.contact_last_name
                END,
                'sales_agent', stf.first_name || ' ' || stf.last_name,
                'sales_date', st.sales_date,
                'sales_price', st.sales_price
            )
            FROM sales_transaction st
            JOIN customer c ON st.customer_id = c.customer_id
            LEFT JOIN individual i ON c.customer_id = i.customer_id
            LEFT JOIN business b ON c.customer_id = b.customer_id
            LEFT JOIN staff stf ON st.username = stf.username
            WHERE st.vin = v.vin
            LIMIT 1
        ) AS buyer

    FROM vehicle v
    JOIN vehicle_type vt ON v.vehicle_type = vt.vehicle_type
    JOIN vehicle_manufacturer vm ON v.manufacturer_name = vm.manufacturer_name
    WHERE v.vin = %s;
        """

    cursor.execute(query, (vin,))
    vehicle = cursor.fetchone()

    cursor.close()
    conn.close()

    if vehicle:
        return jsonify(vehicle), 200
    return jsonify({"error": "Vehicle not found"}), 404


@vehicles_bp.route('/add', methods= ['POST'])
def add_vehicles():
    data= request.get_json()

    vin= data.get('vin')
    vehicle_type = data.get('vehicle_type')
    manufacturer_name = data.get('manufacturer_name')
    model_name = data.get('model_name')
    model_year = data.get('model_year')
    fuel_type = data.get('fuel_type')
    horse_power = data.get('horse_power')
    drive_train = data.get('drive_train')
    notes = data.get('notes', '')
    colors = data.get('colors', [])
    purchase_price = data.get('purchase_price')
    purchase_condition = data.get('purchase_condition')
    customer_id = data.get('customer_id')
    username = data.get('username')
    purchase_date = data.get('purchase_date')

    conn= get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cursor.execute("""
            INSERT INTO vehicle (vin, vehicle_type, manufacturer_name, model_name, model_year, fuel_type, horse_power, drive_train, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (vin, vehicle_type, manufacturer_name, model_name, model_year, fuel_type, horse_power, drive_train, notes))

        for color in colors:
            cursor.execute("""
                INSERT INTO vehicle_color (vin, color) VALUES (%s, %s)
            """, (vin, color))

        cursor.execute("""
            INSERT INTO purchase_transaction (vin, customer_id, username, purchase_date, purchase_price, purchase_condition)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (vin, customer_id, username, purchase_date, purchase_price, purchase_condition))

        conn.commit()
        return jsonify({"message": "Vehicle added successfully!", "vin": vin}), 201   
    
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()