from fastapi import APIRouter
from database import get_conn

router = APIRouter()

@router.get("/dashboard")
def get_dashboard():
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            COUNT(*) FILTER (WHERE criado_em::date = CURRENT_DATE) as hoje,
            COUNT(*) FILTER (WHERE criado_em >= date_trunc('week', CURRENT_DATE)) as semana,
            COUNT(*) FILTER (WHERE criado_em >= date_trunc('month', CURRENT_DATE)) as mes,
            COUNT(*) as total
        FROM solicitacoes
    """)
    totais = cursor.fetchone()

    cursor.execute("""
        SELECT
            COUNT(*) FILTER (WHERE status = 'aprovado') as aprovadas,
            COUNT(*) FILTER (WHERE status = 'recusado') as recusadas,
            COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
            COUNT(*) FILTER (WHERE status = 'retirado') as retiradas,
            COUNT(*) FILTER (WHERE status = 'cancelado') as canceladas,
            COUNT(*) as total
        FROM solicitacoes
    """)
    taxas = cursor.fetchone()

    cursor.execute("""
        SELECT ROUND(AVG(EXTRACT(EPOCH FROM (atualizado_em - criado_em)) / 3600)::numeric, 1)
        FROM solicitacoes
        WHERE status IN ('aprovado', 'recusado', 'retirado', 'cancelado') AND atualizado_em IS NOT NULL
    """)
    tempo_medio = cursor.fetchone()[0]

    cursor.execute("""
        SELECT p.nome, COUNT(s.id) as total
        FROM solicitacoes s
        JOIN produtos p ON p.id = s.produto_id
        GROUP BY p.nome
        ORDER BY total DESC
        LIMIT 5
    """)
    top_produtos = cursor.fetchall()

    cursor.execute("""
        SELECT u.nome, COUNT(s.id) as total
        FROM solicitacoes s
        JOIN usuarios u ON u.id = s.usuario_id
        GROUP BY u.nome
        ORDER BY total DESC
        LIMIT 5
    """)
    top_usuarios = cursor.fetchall()

    cursor.close()
    conn.close()

    total = taxas[5] or 1

    return {
        "totais": {
            "hoje": totais[0],
            "semana": totais[1],
            "mes": totais[2],
            "total": totais[3]
        },
        "taxas": {
            "aprovadas": taxas[0],
            "recusadas": taxas[1],
            "pendentes": taxas[2],
            "retiradas": taxas[3],
            "canceladas": taxas[4],
            "pct_aprovacao": round((taxas[0] / total) * 100, 1),
            "pct_recusa": round((taxas[1] / total) * 100, 1),
            "pct_retirada": round((taxas[3] / total) * 100, 1),
            "pct_cancelamento": round((taxas[4] / total) * 100, 1)
        },
        "tempo_medio_horas": tempo_medio or 0,
        "top_produtos": [{"nome": r[0], "total": r[1]} for r in top_produtos],
        "top_usuarios": [{"nome": r[0], "total": r[1]} for r in top_usuarios]
    }