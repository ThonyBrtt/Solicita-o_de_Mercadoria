from database import get_conn

def criar_tabelas():
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("""CREATE TABLE IF NOT EXISTS usuarios(
                   id SERIAL PRIMARY KEY,
                   nome VARCHAR(100) NOT NULL,
                   usuario VARCHAR(100) UNIQUE NOT NULL,
                   senha VARCHAR(100) NOT NULL,
                   perfil VARCHAR(20) NOT NULL
                   )""")
    
    cursor.execute("""CREATE TABLE IF NOT EXISTS produtos(
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                sku VARCHAR(50) UNIQUE NOT NULL,
                quantidade INTEGER NOT NULL DEFAULT 0,
                quantidade_minima INTEGER NOT NULL DEFAULT 0,
                reservado INTEGER NOT NULL DEFAULT 0,
                categoria VARCHAR(100) NOT NULL,
                ativo BOOLEAN NOT NULL DEFAULT true,
                imagem TEXT
                )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS lotes(
                id SERIAL PRIMARY KEY,
                produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
                codigo VARCHAR(100) NOT NULL,
                quantidade INTEGER NOT NULL DEFAULT 0,
                reservado INTEGER NOT NULL DEFAULT 0,
                data_entrada DATE DEFAULT CURRENT_DATE,
                ativo BOOLEAN NOT NULL DEFAULT true,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""")
    
    cursor.execute("""CREATE TABLE IF NOT EXISTS solicitacoes(
                   id SERIAL PRIMARY KEY,
                   usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
                   produto_id INTEGER NOT NULL REFERENCES produtos(id),
                   lote_id INTEGER NOT NULL REFERENCES lotes(id),
                   quantidade INTEGER NOT NULL,
                   motivo VARCHAR(50) NOT NULL,
                   prioridade VARCHAR(20) NOT NULL DEFAULT 'alta',
                   status VARCHAR(30) NOT NULL DEFAULT 'pendente',
                   criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                   observacoes TEXT,
                   atualizado_em TIMESTAMP
                   )""")

    cursor.execute("ALTER TABLE produtos ADD COLUMN IF NOT EXISTS reservado INTEGER NOT NULL DEFAULT 0")
    cursor.execute("ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS lote_id INTEGER REFERENCES lotes(id)")

    conn.commit()
    cursor.close()
    conn.close()

def migrar_lotes():
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'lote'")
    tem_coluna_lote = cursor.fetchone()

    if tem_coluna_lote:
        cursor.execute("SELECT id, lote, quantidade FROM produtos WHERE lote IS NOT NULL")
        produtos_com_lote = cursor.fetchall()

        for p in produtos_com_lote:
            cursor.execute(
                "INSERT INTO lotes (produto_id, codigo, quantidade) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                (p[0], f"LOTE-{p[1]}", p[2])
            )

        cursor.execute("ALTER TABLE produtos DROP COLUMN IF EXISTS lote")

        conn.commit()

    cursor.close()
    conn.close()