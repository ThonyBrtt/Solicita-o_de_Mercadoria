from fastapi import APIRouter
from database import get_conn
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter()

class LoteEntrada(BaseModel):
    produto_id: int
    codigo: str
    quantidade: int
    data_entrada: Optional[str] = None

class LoteEditarQuantidade(BaseModel):
    quantidade: int

@router.get("/lotes")
def listar_todos_lotes():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, produto_id, codigo, quantidade, reservado, data_entrada FROM lotes WHERE ativo = true ORDER BY produto_id, data_entrada DESC"
    )
    lotes = cursor.fetchall()
    cursor.close()
    conn.close()
    return [
        {
            "id": l[0],
            "produto_id": l[1],
            "codigo": l[2],
            "quantidade": l[3],
            "reservado": l[4],
            "disponivel": l[3] - l[4],
            "data_entrada": str(l[5]) if l[5] else None
        }
        for l in lotes
    ]

@router.get("/produtos/{produto_id}/lotes")
def listar_lotes(produto_id: int, ativos: bool = True):
    conn = get_conn()
    cursor = conn.cursor()

    if ativos:
        cursor.execute(
            "SELECT id, codigo, quantidade, reservado, data_entrada, criado_em FROM lotes WHERE produto_id = %s AND ativo = true ORDER BY data_entrada DESC",
            (produto_id,)
        )
    else:
        cursor.execute(
            "SELECT id, codigo, quantidade, reservado, data_entrada, criado_em FROM lotes WHERE produto_id = %s ORDER BY data_entrada DESC",
            (produto_id,)
        )

    lotes = cursor.fetchall()

    resultado = []
    for l in lotes:
        lote_id = l[0]
        disponivel = l[2] - l[3]

        cursor.execute(
            "SELECT COUNT(*) FROM solicitacoes WHERE lote_id = %s AND status IN ('pendente', 'aprovado')",
            (lote_id,)
        )
        count_solicitacoes = cursor.fetchone()[0]
        pode_solicitar = count_solicitacoes == 0

        resultado.append({
            "id": lote_id,
            "codigo": l[1],
            "quantidade": l[2],
            "reservado": l[3],
            "disponivel": disponivel,
            "data_entrada": str(l[4]) if l[4] else None,
            "criado_em": str(l[5]) if l[5] else None,
            "pode_solicitar": pode_solicitar
        })

    cursor.close()
    conn.close()

    return resultado

@router.post("/lotes")
def criar_lote(lote: LoteEntrada):
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM produtos WHERE id = %s", (lote.produto_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        return {"erro": "Produto não encontrado"}

    data = lote.data_entrada if lote.data_entrada else str(date.today())

    cursor.execute(
        "INSERT INTO lotes (produto_id, codigo, quantidade, data_entrada) VALUES (%s, %s, %s, %s) RETURNING id",
        (lote.produto_id, lote.codigo, lote.quantidade, data)
    )
    novo_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return {"mensagem": "Lote criado com sucesso", "id": novo_id}

@router.put("/lotes/{id}/quantidade")
def editar_quantidade_lote(id: int, dados: LoteEditarQuantidade):
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM lotes WHERE id = %s", (id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        return {"erro": "Lote não encontrado"}

    cursor.execute("UPDATE lotes SET quantidade = %s WHERE id = %s", (dados.quantidade, id))
    conn.commit()
    cursor.close()
    conn.close()

    return {"mensagem": "Quantidade do lote atualizada"}

@router.patch("/lotes/{id}/desativar")
def desativar_lote(id: int):
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM lotes WHERE id = %s", (id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        return {"erro": "Lote não encontrado"}

    cursor.execute("UPDATE lotes SET ativo = false WHERE id = %s", (id,))
    conn.commit()
    cursor.close()
    conn.close()

    return {"mensagem": "Lote desativado com sucesso"}
