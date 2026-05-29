from database import get_conn

def criar_tabelas():
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("""CREATE TABLE IF NOT EXISTS usuarios(
                   id SERIAL PRIMARY KEY,
                   nome VARCHAR(100) NOT NULL,
                   usuario VARCHAR(100) UNIQUE NOT NULL,
                   senha VARCHAR(100) NOT NULL,
                   perfil VARCHAR(20) NOT NULL -- logistica, vendas, administrador
                   )""")
    
    cursor.execute("""CREATE TABLE IF NOT EXISTS produtos(
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                sku VARCHAR(50) UNIQUE NOT NULL,
                quantidade INTEGER NOT NULL DEFAULT 0,
                quantidade_minima INTEGER NOT NULL DEFAULT 0,
                categoria VARCHAR(100) NOT NULL,
                lote INT,
                ativo BOOLEAN NOT NULL DEFAULT true,
                imagem TEXT
                )""")
    
    cursor.execute("""CREATE TABLE IF NOT EXISTS solicitacoes(
                   id SERIAL PRIMARY KEY,
                   usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
                   produto_id INTEGER NOT NULL REFERENCES produtos(id),
                   quantidade INTEGER NOT NULL,
                   motivo VARCHAR(50) NOT NULL,
                   prioridade VARCHAR(20) NOT NULL DEFAULT 'alta',
                   status VARCHAR(30) NOT NULL DEFAULT 'pendente',
                   criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                   observacoes TEXT
                   )""")

    conn.commit()
    cursor.close()
    conn.close()