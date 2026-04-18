from flask import Blueprint, request, jsonify
import psycopg2.extras
from db import get_db_connection
from datetime import date

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/sell', methods=['POST'])
def sell_vehicle():
    data = request.get_json()
    vin = data.get('vin')
    customer_id = data.get('customer_id')
    username = data.get('username')
    sale_price = data.get('sale_price')

    if not all([vin, customer_id, username, sale_price]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        sale_price = float(sale_price)
    except ValueError:
        return jsonify({"error": "Invalid sale price provided"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        # 1. Check for pending parts - a vehicle cannot be sold if parts are not 'installed'
        cursor.execute("SELECT 1 FROM part WHERE vin = %s AND status != 'installed'", (vin,))
        if cursor.fetchone():
            return jsonify({"error": "Cannot sell vehicle with pending parts."}), 400

        # 2. Check if the vehicle is already sold
        cursor.execute("SELECT vin FROM sales_transaction WHERE vin = %s", (vin,))
        if cursor.fetchone():
            return jsonify({"error": "Vehicle is already sold."}), 400

        # 3. Calculate minimum required sale price
        cursor.execute("""
            SELECT ROUND(
                (MAX(pt.purchase_price) * 1.25) +
                (COALESCE(SUM(p.unit_price * p.quantity), 0) * 1.1),
                2
            ) as min_price
            FROM purchase_transaction pt
            LEFT JOIN part p ON pt.vin = p.vin
            WHERE pt.vin = %s
        """, (vin,))
        result = cursor.fetchone()
        
        if not result or result['min_price'] is None:
            return jsonify({"error": "Vehicle not found or missing purchase info."}), 404
            
        min_price = float(result['min_price'])
        if sale_price < min_price:
            return jsonify({"error": "Sale price is below the minimum required.", "minimum_required": min_price}), 400

        # 4. Insert the sales transaction
        sales_date = date.today().isoformat()
        cursor.execute("""
            INSERT INTO sales_transaction (vin, customer_id, username, sales_date, sales_price)
            VALUES (%s, %s, %s, %s, %s)
        """, (vin, customer_id, username, sales_date, sale_price))
        
        conn.commit()
        return jsonify({"message": "Vehicle sold successfully!"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()