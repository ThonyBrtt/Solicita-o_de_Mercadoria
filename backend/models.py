from database import get_conn

def criar_tabelas():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""CREATE TABLE IF NOT EXISTS usuarios(
                   id SERIAL PRIMARY KEY,
                   nome VARCHAR(100) NOT NULL,
                   email VARCHAR(100) UNIQUE NOT NULL,
                   senha VARCHAR(100) NOT NULL,
                   perfil VARCHAR(20) NOT NULL -- solicitante, estoquista, gerente, administrador
                   )""")
    
    conn.commit()
    cursor.close()
    conn.close()