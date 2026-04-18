from flask import Blueprint, request, jsonify
import psycopg2.extras
from db import get_db_connection

parts_bp = Blueprint('parts', __name__)


@parts_bp.route('/vendors/search', methods=['GET'])
def search_vendor():
    vendor_name = request.args.get('vendor_name', '')
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cursor.execute("SELECT * FROM Vendor WHERE Vendor_Name ILIKE %s", (f"%{vendor_name}%",))
    vendors = cursor.fetchall()

    cursor.close()
    conn.close()
    return jsonify(vendors), 200


@parts_bp.route('/order', methods=['POST'])
def add_parts_order():
    data = request.get_json()
    vin = data.get('vin')
    vendor_name = data.get('vendor_name')
    parts_list = data.get('parts')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT TO_CHAR(COUNT(*) + 1, 'FM000') FROM Parts_Order WHERE VIN = %s", (vin,))
        new_ordinal = cursor.fetchone()[0]

        # add acquisitionSpecialist column

        cursor.execute("""
            INSERT INTO Parts_Order (VIN, Ordinal_Number, Vendor_Name) 
            VALUES (%s, %s, %s)
        """, (vin, new_ordinal, vendor_name))

        for part in parts_list:
            cursor.execute("""
                INSERT INTO Part (VIN, Ordinal_Number, Vendor_Part_Number, Description, Unit_Price, Status, Quantity)
                VALUES (%s, %s, %s, %s, %s, 'ordered', %s)
            """, (vin, new_ordinal, part['vendor_part_number'], part['description'], part['unit_price'],
                  part['quantity']))

        conn.commit()
        return jsonify({"message": "Parts Order created!", "ordinal_number": new_ordinal}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@parts_bp.route('/update_status', methods=['PUT'])
def update_status():
    data = request.get_json()
    parts_order_number = data.get('parts_order_number')
    # ordinal_number = data.get('ordinal_number')
    vendor_part_number = data.get('vendor_part_number')
    new_status = data.get('status')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE Part 
            SET Status = %s 
            WHERE VIN = LEFT(%s, LENGTH(%s) - 4) AND
            ordinal_number = RIGHT(%s, 3) AND Vendor_Part_Number = %s
        """, (new_status, parts_order_number, parts_order_number, parts_order_number, vendor_part_number))

        conn.commit()
        return jsonify({"message": "Part status updated!"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@parts_bp.route('/parts_order/display', methods=['GET'])
def display_parts_order():
    vin = request.args.get('vin', '')
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cursor.execute("""SELECT 
    CONCAT(parts_order.VIN, '-', parts_order.ordinal_number) AS  parts_order_number,
    SUM(part.unit_price * part.quantity) AS total_cost,
    parts_order.vendor_name, parts_order.acquisitionspecialist
    FROM parts_order INNER JOIN part
    ON parts_order.VIN = part.vin
    AND parts_order.ordinal_number = part.ordinal_number
    WHERE parts_order.VIN = %s
    GROUP BY
    parts_order.VIN, parts_order.ordinal_number""", (vin,))
    parts_order = cursor.fetchall()

    cursor.close()
    conn.close()
    return jsonify(parts_order), 200


@parts_bp.route('/parts/display', methods=['GET'])
def display_parts():
    parts_order_number = request.args.get('$parts_order_number', '')
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cursor.execute("""SELECT
    VIN, ordinal_number, vendor_part_number, vendor_name, description, unit_price, status, quantity
    FROM part
    WHERE VIN = LEFT(%s, LENGTH(%s) - 4)
    AND ordinal_number = RIGHT(%s, 3)""", (f"%{parts_order_number}%",))
    parts = cursor.fetchall()

    cursor.close()
    conn.close()
    return jsonify(parts), 200


@parts_bp.route('/update_parts', methods=['PUT'])
def update_parts():
    data = request.get_json()
    parts_order_number = data.get('parts_order_number')
    vendor_part_number = data.get('vendor_part_number')
    update_parts_list = data.get('parts')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        for part in update_parts_list:
            cursor.execute("""
                UPDATE part
                SET
                quantity = COALESCE(%s, quantity),
                description = COALESCE(%s, description),
                unit_price = COALESCE(%s, unit_price),
                part_name = COALESCE(%s, part_name)
                WHERE
                VIN = LEFT(%s, LENGTH(%s) - 4)
                AND ordinal_number = RIGHT(%s, 3)
                AND vendor_part_number = '%s'
                AND
                status != 'Installed'
            """, (part['quantity'], part['description'], part['unit_price'], part['part_name'], parts_order_number,
                  parts_order_number, parts_order_number, vendor_part_number))

        conn.commit()
        return jsonify({"message": "Parts updated!"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@parts_bp.route('/vendor', methods=['POST'])
def add_vendor():
    data = request.get_json()
    vendor_list = data.get('vendors')
    conn = get_db_connection()
    cursor = conn.cursor()

    try:

        for vendor in vendor_list:
            cursor.execute("""
                INSERT INTO vendor(vendor_name, phone_number, street_address, city, state, postal_code) 
                VALUES (%s, %s, %s, %s, %s, %s); 
            """, (vendor['vendor_name'], vendor['phonenumber'], vendor['streetaddress'], vendor['city'],
                  vendor['state'], vendor['postalcode']))

        conn.commit()
        return jsonify({"message": "vendors added!"}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()