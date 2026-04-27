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


@router.get("/produtos")
def listar_produtos():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, sku, quantidade, quantidade_minima, categoria FROM produtos")
    produtos = cursor.fetchall()
    cursor.close()
    conn.close()
    return [
        {
            "id": produtos[0],
            "nome": produtos[1],
            "sku": produtos[2],
            "quantidade": produtos[3],
            "quantidade_minima": produtos[4],
            "categoria": produtos[5]
        }
        for produtos in produtos
    ]

@router.post("/produtos")
def criar_produto(produto: ProdutoEntrada):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""INSERT INTO produtos (nome, sku, quantidade, quantidade_minima, categoria)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""",(
                       produto.nome,
                       produto.sku,
                       produto.quantidade,
                       produto.quantidade_minima,
                       produto.categoria
                   ))
    novo_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()
    return{"mensagem": "Produto criado com sucesso", "id": novo_id}


@router.get("/produtos/{id}")
def buscar_produto(id: int):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, sku, quantidade, quantidade_minima, categoria FROM produtos WHERE id = %s", (id,))
    produto = cursor.fetchone()
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
        "categoria": produto[5]
    }

@router.put("/produtos/{id}/quantidade")
def atualizar_quantidade(id:int, dados:dict):
    conn = get_conn()
    cursor = conn.cursor()