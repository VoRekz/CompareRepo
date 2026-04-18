from flask import Blueprint, request, jsonify
import psycopg2.extras
import csv
import io
from db import get_db_connection


customers_bp= Blueprint('customers', __name__)

@customers_bp.route('/search', methods=['GET'])
def search_customer():
    ssn=request.args.get('ssn', '') #serach ssn. default to empy ifstring if not provided
    tax_id=request.args.get('tax_id', '') #read tax_id from URL

    if not ssn and not tax_id:
        return jsonify({"error": "Proviude SSN or Tax ID"}), 400
    
    #connect to the database
    conn=get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        #the user provided a SSN to search
        if ssn:
            query = """
                SELECT c.Customer_ID, c.Email, c.Phone_Number, c.Street_Address, 
                       c.City, c.State, c.Postal_Code,
                       i.SSN, i.First_Name, i.Last_Name,
                       'Individual' as customer_type
                FROM Customer c
                JOIN Individual i ON c.Customer_ID = i.Customer_ID
                WHERE i.SSN = %s
            """            
            cursor.execute(query, (ssn,))
            customer=cursor.fetchone()

            #if customer is found, return to front end, else return a message
            if customer:
                return jsonify(customer), 200
            else:
                return jsonify({"message": "Customer not found"}), 404

        else:  #if front end provided a tax id instead
            query = """
                SELECT c.Customer_ID, c.Email, c.Phone_Number, c.Street_Address,
                       c.City, c.State, c.Postal_Code,
                       b.Tax_ID, b.Business_Name, b.Contact_First_Name,
                       b.Contact_Last_Name, b.Contact_Title,
                       'Business' as customer_type
                FROM Customer c
                JOIN Business b ON c.Customer_ID = b.Customer_ID
                WHERE b.Tax_ID = %s
            """
            cursor.execute(query, (tax_id,))
            customer = cursor.fetchone()

            if customer:
                return jsonify(customer), 200
            else:
                return jsonify({"message": "Customer not found"}), 404


    except Exception as e:
        return jsonify({"error": str(e)}),500

    finally:
        cursor.close()
        conn.close()


@customers_bp.route('/bulk-upload', methods=['POST'])
def bulk_upload_customers():
    # 1. Catch the uploaded file from the React frontend
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not file.filename.endswith('.csv'):
        return jsonify({"error": "Please upload a .csv file. (You can save Excel files as CSV)"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        # 2. Read the file directly from memory 
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        csv_reader = csv.DictReader(stream)

        count = 0
        for row in csv_reader:
            customer_type = row.get('customer_type', '').strip().lower()
            
            cursor.execute("""
                INSERT INTO Customer (Email, Phone_Number, Street_Address, City, State, Postal_Code)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING Customer_ID
            """, (row.get('email') or None, row.get('phone'), row.get('street'), row.get('city'), row.get('state'), row.get('postal')))
            customer_id = cursor.fetchone()['customer_id']

            if customer_type == 'person' or customer_type == 'individual':
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

        conn.commit()
        return jsonify({"message": f"Successfully imported {count} customers from file!"}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to process file: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

            

#route for adding individual customer..
#Post because we are sendin g data to create something new> a new customer 
@customers_bp.route('/add/individual', methods=['POST'])
def add_individual():
    #Get the data from the request.
    data=request.get_json()

    email=data.get('email', None) #email for customer optional as per schema
    phone_number=data.get('phone_number')
    street_address=data.get('street_address')
    city=data.get('city')
    state=data.get('state')
    postal_code=data.get('postal_code')
    ssn=data.get('ssn')
    first_name=data.get('first_name')
    last_name=data.get('last_name')

    #connect to Postgress database & create cursor?
    conn=get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        #insert the new data into the customer table first
        query="""
            INSERT INTO Customer (Email, Phone_number,street_address,city, state, postal_code)
            VALUES(%s,%s, %s, %s, %s, %s)
            RETURNING Customer_ID
            """
        cursor.execute(query,(email,phone_number,street_address, city, state,postal_code))
        customer_id= cursor.fetchone()['customer_id']

        #now insert the new data of the indivudal customer into the individual table of our database
        query2= """
            INSERT INTO individual (ssn, customer_id, first_name, last_name)
            VALUES (%s,%s, %s, %s)
            """
        cursor.execute(query2, (ssn,customer_id,first_name, last_name))

        conn.commit() #save both inserts into the database permanantly
        return jsonify({"message": "New Individual Customer added!", "customer_id": customer_id}), 201

    except Exception as e:
        #if there is an error undoe both inserts i.e the insert into indidual and insert into customer. 
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()


@customers_bp.route('/add/business', methods=['POST'])
def add_business():
    #get the data from json>front end
    data=request.get_json()

    #customer table information
    email = data.get('email', None)
    phone_number = data.get('phone_number')
    street_address = data.get('street_address')
    city = data.get('city')
    state = data.get('state')
    postal_code = data.get('postal_code')

    #business specific information
    tax_id=data.get('tax_id')
    business_name=data.get('business_name')
    first_name= data.get('contact_first_name')
    last_name= data.get('contact_last_name')
    title= data.get('contact_title')

    #connect to our database on postgress
    conn=get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        #inser the customer data into customer table
        query1="""
            INSERT INTO customer (email, phone_number, street_address, city, state, postal_code)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING customer_id 
            """
            #adds that data into customer table and generates a customer_id

        cursor.execute(query1, (email,phone_number,street_address,city,state,postal_code))
        customer_id=cursor.fetchone()['customer_id']

        #now inserting the data into the business table of the database.
        query2= """
            INSERT INTO business(tax_id, customer_id, business_name, contact_first_name, contact_last_name, contact_title)
            VALUES (%s,%s,%s,%s,%s,%s)
        """
        cursor.execute(query2, (tax_id,customer_id, business_name, first_name, last_name, title))

        conn.commit() #save both inserts into the database permanantly
        return jsonify({"message": "New Business Customer added!", "customer_id": customer_id}), 201

    except Exception as e:
        conn.rollback() #in case of error undo both inserts of data intoi customer table and the business table of database
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
