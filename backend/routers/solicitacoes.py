from fastapi import APIRouter
from database import get_conn
from pydantic import BaseModel

router = APIRouter()

class SolicitacaoEntrada(BaseModel):
    usuario_id: int
    produto_id: int
    quantidade: int
    motivo:str
    prioridade: str

@router.get("/solicitacoes")
def listar_solicitacoes():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, usuario_id, produto_id, quantidade, motivo, status FROM solicitacoes")
    solicitacoes = cursor.fetchall()
    cursor.close()
    conn.close()
    return [
        {
            "id": solicitacoes [0],
            "usuario_id": solicitacoes [1],
            "produto_id": solicitacoes [2],
            "quantidade": solicitacoes [3],
            "motivo": solicitacoes [4],
            "status": solicitacoes [5]
        }
        for solicitacoes in solicitacoes
    ]

@router.post("/solicitacoes")
def criar_solicitacao(solicitacao: SolicitacaoEntrada):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, quantidade FROM produtos WHERE id = %s",(solicitacao.produto_id, ))
    produto = cursor.fetchone()

    if not produto:
        cursor.close()
        conn.close()
        return {"Mensagem": "Produto não encontrado"}
    
    if produto[1] < solicitacao.quantidade:
        cursor.close()
        conn.close()
        return {"Mensagem": "Quantidade insuficiente em estoque"}

    cursor.execute("""INSERT INTO solicitacoes (usuario_id, produto_id, quantidade, motivo)
                   VALUES (%s, %s, %s, %s) RETURNING id""",(
                   solicitacao.usuario_id,
                   solicitacao.produto_id,
                   solicitacao.quantidade,
                   solicitacao.motivo                     
                   ))
    
    novo_id= cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    return {"mensagem": "Solicitação criada com sucesso", "id": novo_id[0]}