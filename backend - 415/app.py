from flask import Flask, jsonify
from flask_cors import CORS

# Import blueprints (routes)
from routes.auth import auth_bp
from routes.vehicles import vehicles_bp
from routes.transactions import transactions_bp
from routes.parts import parts_bp    
from routes.reports import reports_bp 
from routes.customers import customers_bp
from routes.admin import admin_bp

app = Flask(__name__)
CORS(app) # Allows your React frontend to communicate with this API

# Register the API routes
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(vehicles_bp, url_prefix='/api/vehicles')
app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
app.register_blueprint(parts_bp, url_prefix='/api/parts')       
app.register_blueprint(reports_bp, url_prefix='/api/reports')   
app.register_blueprint(customers_bp, url_prefix='/api/customers')  
app.register_blueprint(admin_bp, url_prefix='/api/admin')


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "Midtown Motors API is running!"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)