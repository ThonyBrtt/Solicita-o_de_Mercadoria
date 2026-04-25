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
    
    cursor.execute("""CREATE TABLE IF NOT EXISTS produtos(
                   id SERIAL PRIMARY KEY,
                   nome VARCHAR(100) NOT NULL,
                   sku VARCHAR(50) UNIQUE NOT NULL,
                   quantidade INTEGER NOT NULL DEFAULT 0,
                   quantidade_minima INTEGER NOT NULL DEFAULT 0,
                   categoria VARCHAR(100) NOT NULL
                   )""")
    
    cursor.execute("""CREATE TABLE IF NOT EXISTS solicitacoes(
                   id SERIAL PRIMARY KEY,
                   usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
                   produtto_id INTEGER NOT NULL REFERENCES produtos(id),
                   quantidade INTEGER NOT NULL,
                   mootivo VARCHAR(50) NOT NULL,
                   prioridade VARCHAR(20) NOT NULL DEFAULT 'media',
                   status VARCHAR(30) NOT NULL DEFAULT 'pendente',
                   criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                   )""")

    conn.commit()
    cursor.close()
    conn.close()