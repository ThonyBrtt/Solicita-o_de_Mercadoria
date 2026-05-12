import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_conn():
    return psycopg2.connect(
        host="aws-1-sa-east-1.pooler.supabase.com",
        database="postgres",
        user="postgres.rqjdeorqsrfqgugmncnm",
        password=os.getenv("DB_PASSWORD"),
        port=5432
    )