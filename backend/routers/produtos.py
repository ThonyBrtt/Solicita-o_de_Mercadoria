from fastapi import APIRouter
from database import get_conn
from pydantic import BaseModel

router = APIRouter()

class ProdutoEntrada(BaseModel):
    nome: str
    sku: str
    quantidade: int
    quantidade_minima: int
    categoria: str
    imagem: str = None

class ProdutoEdicao(BaseModel):
    nome: str
    sku: str
    quantidade: int
    quantidade_minima: int
    categoria: str
    imagem: str = None

    class Config:
        coerce_numbers_to_str = False


def _buscar_produto_com_lotes(id: int, cursor):
    cursor.execute("""
        SELECT p.id, p.nome, p.sku, COALESCE(SUM(l.quantidade), 0),
               p.quantidade_minima, p.categoria, p.imagem,
               COALESCE(SUM(l.reservado), 0)
        FROM produtos p
        LEFT JOIN lotes l ON l.produto_id = p.id AND l.ativo = true
        WHERE p.id = %s AND p.ativo = true
        GROUP BY p.id
    """, (id,))
    return cursor.fetchone()


@router.get("/produtos")
def listar_produtos():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.id, p.nome, p.sku, COALESCE(SUM(l.quantidade), 0),
               p.quantidade_minima, p.categoria, p.imagem,
               COALESCE(SUM(l.reservado), 0)
        FROM produtos p
        LEFT JOIN lotes l ON l.produto_id = p.id AND l.ativo = true
        WHERE p.ativo = true
        GROUP BY p.id
        ORDER BY p.nome
    """)
    produtos = cursor.fetchall()
    cursor.close()
    conn.close()
    return [
        {
            "id": p[0],
            "nome": p[1],
            "sku": p[2],
            "quantidade": p[3],
            "quantidade_minima": p[4],
            "categoria": p[5],
            "imagem": p[6],
            "reservado": p[7],
            "disponivel": p[3] - p[7]
        }
        for p in produtos
    ]

@router.post("/produtos")
def criar_produto(produto: ProdutoEntrada):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""INSERT INTO produtos (nome, sku, quantidade_minima, categoria, imagem)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""", (
                       produto.nome,
                       produto.sku,
                       produto.quantidade_minima,
                       produto.categoria,
                       produto.imagem
                   ))
    novo_id = cursor.fetchone()[0]

    if produto.quantidade > 0:
        cursor.execute(
            "INSERT INTO lotes (produto_id, codigo, quantidade) VALUES (%s, %s, %s)",
            (novo_id, "Lote inicial", produto.quantidade)
        )

    conn.commit()
    cursor.close()
    conn.close()
    return {"mensagem": "Produto criado com sucesso", "id": novo_id}

@router.get("/produtos/{id}")
def buscar_produto(id: int):
    conn = get_conn()
    cursor = conn.cursor()
    produto = _buscar_produto_com_lotes(id, cursor)
    cursor.close()
    conn.close()

    if not produto:
        return {"Mensagem": "Produto não encontrado"}

    return {
        "id": produto[0],
        "nome": produto[1],
        "sku": produto[2],
        "quantidade": produto[3],
        "quantidade_minima": produto[4],
        "categoria": produto[5],
        "imagem": produto[6],
        "reservado": produto[7],
        "disponivel": produto[3] - produto[7]
    }

@router.patch("/produtos/{id}/desativar")
def desativar_produto(id: int):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM produtos WHERE id = %s", (id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        return {"erro": "Produto não encontrado"}

    cursor.execute("UPDATE produtos SET ativo = false WHERE id = %s", (id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"mensagem": "Produto desativado com sucesso"}

@router.put("/produtos/{id}")
def editar_produto(id: int, produto: ProdutoEdicao):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM produtos WHERE id = %s", (id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        return {"erro": "Produto não encontrado"}

    cursor.execute("""UPDATE produtos 
                   SET nome=%s, sku=%s, quantidade_minima=%s, 
                       categoria=%s, imagem=%s
                   WHERE id = %s""",
                   (produto.nome, produto.sku,
                    produto.quantidade_minima, produto.categoria,
                    produto.imagem, id))
    conn.commit()
    cursor.close()
    conn.close()
    return {"mensagem": "Produto atualizado com sucesso"}