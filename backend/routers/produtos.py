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
    lote: int
    imagem: str = None  # opcional

class AtualizarQuantidadeProduto(BaseModel):
    quantidade: int

class ProdutoEdicao(BaseModel):
    nome: str
    sku: str
    quantidade: int
    quantidade_minima: int
    categoria: str
    lote: int = 0        # garante default
    imagem: str = None

    class Config:
        coerce_numbers_to_str = False


@router.get("/produtos")
def listar_produtos():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, sku, quantidade, quantidade_minima, categoria, lote, imagem, reservado FROM produtos WHERE ativo = true")
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
            "lote": p[6],
            "imagem": p[7],
            "reservado": p[8],
            "disponivel": p[3] - p[8]
        }
        for p in produtos
    ]

@router.post("/produtos")
def criar_produto(produto: ProdutoEntrada):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""INSERT INTO produtos (nome, sku, quantidade, quantidade_minima, categoria, lote, imagem)
                   VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""", (
                       produto.nome,
                       produto.sku,
                       produto.quantidade,
                       produto.quantidade_minima,
                       produto.categoria,
                       produto.lote,
                       produto.imagem
                   ))
    novo_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()
    return {"mensagem": "Produto criado com sucesso", "id": novo_id}

@router.get("/produtos/{id}")
def buscar_produto(id: int):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, sku, quantidade, quantidade_minima, categoria, lote, reservado FROM produtos WHERE id = %s", (id,))
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
        "categoria": produto[5],
        "lote": produto[6],
        "reservado": produto[7],
        "disponivel": produto[3] - produto[7]
    }

@router.put("/produtos/{id}/quantidade")
def atualizar_quantidade(id: int, dados: AtualizarQuantidadeProduto):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM produtos WHERE id = %s", (id,))
    produto = cursor.fetchone()

    if not produto:
        cursor.close()
        conn.close()
        return {"Mensagem": "Produto não encontrado"}

    cursor.execute("UPDATE produtos SET quantidade = %s WHERE id = %s", (dados.quantidade, id))
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"Mensagem": "Quantidade atualizada com sucesso"}

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
                   SET nome=%s, sku=%s, quantidade=%s, quantidade_minima=%s, 
                       categoria=%s, lote=%s, imagem=%s
                   WHERE id = %s""",
                   (produto.nome, produto.sku, produto.quantidade,
                    produto.quantidade_minima, produto.categoria,
                    produto.lote, produto.imagem, id))
    conn.commit()
    cursor.close()
    conn.close()
    return {"mensagem": "Produto atualizado com sucesso"}