import psycopg2
import psycopg2.extras
import os

# Set these to match your local pgAdmin setup
DB_HOST = "127.0.0.1"
DB_NAME = "midtown_motors"
DB_USER = "postgres"
DB_PASS = "Nike2626$"

def get_db_connection():
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    return conn