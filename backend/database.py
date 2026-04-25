import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_conn():
    return psycopg2.connect(
        host="localhost",
        database="revestbem",
        user="postgres",
        password=os.getenv("DB_PASSWORD")
    )