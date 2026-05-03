import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_conn():
    return psycopg2.connect(
        host="db.rqjdeorqsrfqgugmncnm.supabase.co",
        database="postgres",
        user="postgres",
        password=os.getenv("DB_PASSWORD"),
        port=5432
    )