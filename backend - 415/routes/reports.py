from flask import Blueprint, jsonify
import psycopg2.extras
from db import get_db_connection

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/seller_history', methods=['GET'])
def seller_history():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("""
        SELECT 
            c.Customer_ID,
            COALESCE(c.Individual_First_Name || ' ' || c.Individual_Last_Name, c.Business_Name) AS Seller_Name,
            COUNT(p.VIN) AS Total_Vehicles_Sold_To_Us,
            AVG(p.Purchase_Price) AS Avg_Purchase_Price
        FROM Purchase_Transaction p
        JOIN Customer c ON p.Customer_ID = c.Customer_ID
        GROUP BY c.Customer_ID, Seller_Name
        ORDER BY Total_Vehicles_Sold_To_Us DESC, Avg_Purchase_Price DESC;
    """)
    reports = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(reports), 200

@reports_bp.route('/avg_time_inventory', methods=['GET'])
def avg_time_inventory():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("""
    SELECT 
        vt.vehicle_type,
        ROUND(AVG(s.sales_date - p.purchase_date), 1) AS avg_days_in_inventory
    FROM vehicle_type vt
    LEFT JOIN vehicle v ON vt.vehicle_type = v.vehicle_type
    LEFT JOIN purchase_transaction p ON v.vin = p.vin
    LEFT JOIN sales_transaction s ON v.vin = s.vin
    GROUP BY vt.vehicle_type
    ORDER BY vt.vehicle_type ASC;
    """)
    reports = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(reports), 200

@reports_bp.route('/price_per_condition', methods=['GET'])
def price_per_condition():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("""
    SELECT 
        vt.vehicle_type,
        pc.purchase_condition,
        AVG(p.purchase_price) AS avg_purchase_price
    FROM vehicle_type vt

    -- all possible conditions
    CROSS JOIN (
        SELECT DISTINCT purchase_condition 
        FROM purchase_transaction
    ) pc

    -- connect to actual vehicles
    LEFT JOIN vehicle v 
        ON vt.vehicle_type = v.vehicle_type

    -- connect to purchases
    LEFT JOIN purchase_transaction p 
        ON v.vin = p.vin 
        AND p.purchase_condition = pc.purchase_condition

    GROUP BY vt.vehicle_type, pc.purchase_condition
    ORDER BY vt.vehicle_type, pc.purchase_condition;
    """)
    reports = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(reports), 200

@reports_bp.route('/parts_statistics', methods=['GET'])
def parts_statistics():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("""
        SELECT 
            po.Vendor_Name,
            SUM(p.Quantity) AS Total_Quantity_Supplied,
            SUM(p.Quantity * p.Unit_Price) AS Total_Dollar_Amount_Spent
        FROM Part p
        JOIN Parts_Order po ON p.VIN = po.VIN AND p.Ordinal_Number = po.Ordinal_Number
        GROUP BY po.Vendor_Name
        ORDER BY Vendor_Name ASC;
    """)
    reports = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(reports), 200

@reports_bp.route('/monthly_sales', methods=['GET'])
def monthly_sales():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("""
        SELECT 
            TO_CHAR(s.Sales_Date, 'YYYY-MM') AS Sale_Month,
            COUNT(s.VIN) AS Total_Vehicles_Sold,
            SUM(s.Sales_Price) AS Total_Sales_Income,
            SUM(s.Sales_Price) - SUM(p.Purchase_Price) - COALESCE(SUM(part_costs.total_parts), 0) AS Net_Income
        FROM Sales_Transaction s
        JOIN Purchase_Transaction p ON s.VIN = p.VIN
        LEFT JOIN (
            SELECT VIN, SUM(Unit_Price * Quantity) AS total_parts 
            FROM Part 
            GROUP BY VIN
        ) part_costs ON s.VIN = part_costs.VIN
        GROUP BY TO_CHAR(s.Sales_Date, 'YYYY-MM')
        ORDER BY Sale_Month DESC;
    """)
    reports = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(reports), 200