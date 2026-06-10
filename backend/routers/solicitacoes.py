from fastapi import APIRouter
from database import get_conn
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class SolicitacaoEntrada(BaseModel):
    usuario_id: int
    produto_id: int
    lote_id: int
    quantidade: int
    motivo: str
    prioridade: str
    observacoes: Optional[str] = None

class AtualizarStatus(BaseModel):
    status: str

@router.get("/solicitacoes")
def listar_solicitacoes(status: str = None, usuario_id: int = None):
    conn = get_conn()
    cursor = conn.cursor()

    if status and usuario_id:
        cursor.execute("SELECT id, usuario_id, produto_id, lote_id, quantidade, motivo, status, observacoes FROM solicitacoes WHERE status = %s AND usuario_id = %s", (status, usuario_id))
    elif usuario_id:
        cursor.execute("SELECT id, usuario_id, produto_id, lote_id, quantidade, motivo, status, observacoes FROM solicitacoes WHERE usuario_id = %s", (usuario_id,))
    elif status:
        cursor.execute("SELECT id, usuario_id, produto_id, lote_id, quantidade, motivo, status, observacoes FROM solicitacoes WHERE status = %s", (status,))
    else:
        cursor.execute("SELECT id, usuario_id, produto_id, lote_id, quantidade, motivo, status, observacoes FROM solicitacoes")

    solicitacoes = cursor.fetchall()
    cursor.close()
    conn.close()
    return [
        {
            "id": s[0],
            "usuario_id": s[1],
            "produto_id": s[2],
            "lote_id": s[3],
            "quantidade": s[4],
            "motivo": s[5],
            "status": s[6],
            "observacoes": s[7]
        }
        for s in solicitacoes
    ]

@router.get("/soliciitacoes/{id}")
def buscar_solicitacao(id:int):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, usuario_id, produto_id, lote_id, quantidade, motivo, status FROM solicitacoes WHERE id = %s", (id,))
    solicitacao = cursor.fetchone()
    cursor.close()
    conn.close()

    if not solicitacao:
        return {"mensagem": "Solicitação não encontrada"}
    
    return {
        "id": solicitacao[0],
        "usuario_id": solicitacao[1],
        "produto_id": solicitacao[2],
        "lote_id": solicitacao[3],
        "quantidade": solicitacao[4],
        "motivo": solicitacao[5],
        "status": solicitacao[6]
    }

@router.post("/solicitacoes")
def criar_solicitacao(solicitacao: SolicitacaoEntrada):
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, quantidade, reservado FROM lotes WHERE id = %s AND ativo = true",
        (solicitacao.lote_id,)
    )
    lote = cursor.fetchone()

    if not lote:
        cursor.close()
        conn.close()
        return {"Mensagem": "Lote não encontrado ou inativo"}

    disponivel = lote[1] - lote[2]
    if disponivel < solicitacao.quantidade:
        cursor.close()
        conn.close()
        return {"Mensagem": f"Quantidade insuficiente no lote. Disponível: {disponivel}"}

    cursor.execute("""INSERT INTO solicitacoes (usuario_id, produto_id, lote_id, quantidade, motivo, observacoes)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""", (
               solicitacao.usuario_id,
               solicitacao.produto_id,
               solicitacao.lote_id,
               solicitacao.quantidade,
               solicitacao.motivo,
               solicitacao.observacoes
               ))
    
    novo_id= cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    return {"mensagem": "Solicitação criada com sucesso", "id": novo_id[0]}

@router.put("/solicitacoes/{id}")
def atualizar_solicitacoes( id:int, solicitacao: SolicitacaoEntrada):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM solicitacoes WHERE id = %s", (id,))
    solicitacoes = cursor.fetchone()

    if not solicitacoes:
        cursor.close()
        conn.close()
        return {"Mensagem": "Solicitação não encontrada"}
    
    cursor.execute("UPDATE solicitacoes SET usuario_id = %s, produto_id = %s, lote_id = %s, quantidade = %s, motivo = %s WHERE id = %s",(
        solicitacao.usuario_id,
        solicitacao.produto_id,
        solicitacao.lote_id,
        solicitacao.quantidade,
        solicitacao.motivo,
        id
    ))
    conn.commit()
    cursor.close()
    conn.close()
    return {"Mensagem": "Solicitação atualizada com sucesso!"}

@router.patch("/Solicitacoes/{id}/status")
def atualizar_status(id:int, status: AtualizarStatus):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, produto_id, lote_id, quantidade, status FROM solicitacoes WHERE id = %s", (id,))
    solicitacao = cursor.fetchone()

    if not solicitacao:
        cursor.close()
        conn.close()
        return {"Mensagem": "Solicitação não encontrada"}

    status_atual = solicitacao[4]
    novo_status = status.status
    lote_id = solicitacao[2]
    qtd = solicitacao[3]

    if novo_status == "aprovado":
        if status_atual != "pendente":
            cursor.close()
            conn.close()
            return {"Mensagem": "Só é possível aprovar solicitações pendentes"}

        cursor.execute("SELECT quantidade, reservado FROM lotes WHERE id = %s", (lote_id,))
        lote = cursor.fetchone()
        if not lote:
            cursor.close()
            conn.close()
            return {"Mensagem": "Lote não encontrado"}

        disponivel = lote[0] - lote[1]
        if disponivel < qtd:
            cursor.close()
            conn.close()
            return {"Mensagem": f"Estoque insuficiente no lote para aprovação. Disponível: {disponivel}"}

        cursor.execute(
            "UPDATE lotes SET quantidade = quantidade - %s, reservado = reservado + %s WHERE id = %s",
            (qtd, qtd, lote_id)
        )

    elif novo_status == "retirado":
        if status_atual != "aprovado":
            cursor.close()
            conn.close()
            return {"Mensagem": "Só é possível retirar solicitações aprovadas"}
        cursor.execute(
            "UPDATE lotes SET reservado = reservado - %s WHERE id = %s",
            (qtd, lote_id)
        )

    elif novo_status == "cancelado":
        if status_atual == "aprovado":
            cursor.execute(
                "UPDATE lotes SET quantidade = quantidade + %s, reservado = reservado - %s WHERE id = %s",
                (qtd, qtd, lote_id)
            )
        elif status_atual not in ("pendente", "aprovado"):
            cursor.close()
            conn.close()
            return {"Mensagem": "Só é possível cancelar solicitações pendentes ou aprovadas"}

    elif novo_status == "recusado":
        if status_atual != "pendente":
            cursor.close()
            conn.close()
            return {"Mensagem": "Só é possível recusar solicitações pendentes"}

    else:
        cursor.close()
        conn.close()
        return {"Mensagem": f"Status inválido: {novo_status}"}

    cursor.execute(
        "UPDATE solicitacoes SET status = %s, atualizado_em = CURRENT_TIMESTAMP WHERE id = %s",
        (novo_status, id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"Mensagem": f"Solicitação {novo_status} com sucesso!"}