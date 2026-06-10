const API = "http://localhost:8000";

const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.perfil !== "logistica") window.location.href = "login.html";

document.getElementById("usuarioNome").textContent = usuario.nome;
document.getElementById("perfilUsuario").textContent = usuario.perfil;
document.getElementById("avatarLetra").textContent = usuario.nome.charAt(0).toUpperCase();

let solicitacoes = [];
let produtos = [];
let usuarios = [];

async function carregarSolicitacoes() {
    try {
        const [resSol, resProd, resUs] = await Promise.all([
            fetch(`${API}/solicitacoes`),
            fetch(`${API}/produtos`),
            fetch(`${API}/usuarios`)
        ]);

        solicitacoes = await resSol.json();
        produtos     = await resProd.json();
        usuarios     = await resUs.json();

        console.log("Solicitações:", solicitacoes);
        console.log("Primeiro status:", solicitacoes[0]?.status);

        renderKanban();
    } catch (err) {
        console.error("Erro ao carregar:", err);
        document.getElementById("colPendente").innerHTML = 
            `<div class="kanban-empty">Erro ao carregar solicitações.</div>`;
    }
}

function renderKanban() {
    const colunas = {
        pendente:  document.getElementById("colPendente"),
        aprovado:  document.getElementById("colAprovado"),
        retirado:  document.getElementById("colRetirado"),
        recusado:  document.getElementById("colRecusado"),
        cancelado: document.getElementById("colCancelado")
    };

    // Limpa e zera contadores
    Object.keys(colunas).forEach(k => {
        colunas[k].innerHTML = "";
        document.getElementById(`count-${k}`).textContent = 0;
    });

    if (solicitacoes.length === 0) {
        colunas.pendente.innerHTML = `<div class="kanban-empty">Nenhuma solicitação encontrada.</div>`;
        return;
    }

    solicitacoes.forEach(s => {
        const produto    = produtos.find(p => p.id === s.produto_id);
        const solicitante = usuarios.find(u => u.id === s.usuario_id);
        const status     = s.status || "pendente";
        const col        = colunas[status] || colunas.pendente;

        // Incrementa contador
        const countEl = document.getElementById(`count-${status}`);
        if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;

        const card = document.createElement("div");
        card.className = "kanban-card";
        card.innerHTML = `
            <div class="kanban-card-header">
                <span class="kanban-id">#${s.id}</span>
                <span class="kanban-motivo">${s.motivo}</span>
            </div>
            <div class="kanban-produto">${produto ? produto.nome : "Produto desconhecido"}</div>
            <div class="kanban-solicitante">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
                ${solicitante ? solicitante.nome : "Desconhecido"} · ${s.quantidade} un.
            </div>
            ${s.observacoes ? `<div class="kanban-obs">"${s.observacoes}"</div>` : ""}
            ${status === "pendente" ? `
            <div class="kanban-actions">
                <button class="btn-aprovar" onclick="atualizarStatus(${s.id}, 'aprovado')">✔ Aprovar</button>
                <button class="btn-recusar" onclick="atualizarStatus(${s.id}, 'recusado')">✘ Recusar</button>
            </div>` : status === "aprovado" ? `
            <div class="kanban-actions">
                <button class="btn-aprovar" onclick="atualizarStatus(${s.id}, 'retirado')">📦 Confirmar Retirada</button>
                <button class="btn-recusar" onclick="atualizarStatus(${s.id}, 'cancelado')">✕ Cancelar</button>
            </div>` : ""}
            ${status === "retirado" ? `
            <div class="kanban-obs" style="color: var(--success); font-weight: 600;">✓ Retirado</div>` : ""}
        `;
        col.appendChild(card);
    });
}

async function atualizarStatus(id, status) {
    await fetch(`${API}/Solicitacoes/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
    });

    showToast(status === "aprovado" ? "Solicitação aprovada!" : "Solicitação recusada!",
              status === "aprovado" ? "sucesso" : "erro");
    carregarSolicitacoes();
}

function showToast(msg, tipo = "sucesso") {
    const toast = document.getElementById("toast");
    document.getElementById("toastMsg").textContent = msg;
    toast.style.borderLeftColor = tipo === "erro" ? "var(--danger)" : "var(--gold)";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

function logout() {
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
}

async function carregarDashboard() {
    try {
        const res = await fetch(`${API}/dashboard`);
        const d = await res.json();

        // Totais
        document.getElementById("dHoje").textContent   = d.totais.hoje;
        document.getElementById("dSemana").textContent = d.totais.semana;
        document.getElementById("dMes").textContent    = d.totais.mes;

        // Taxas
        document.getElementById("dAprovadas").textContent  = `${d.taxas.pct_aprovacao}%`;
        document.getElementById("dRecusadas").textContent  = `${d.taxas.pct_recusa}%`;
        document.getElementById("dPendentes").textContent  = d.taxas.pendentes;
        document.getElementById("dRetiradas").textContent  = `${d.taxas.pct_retirada}%`;
        document.getElementById("dCanceladas").textContent = `${d.taxas.pct_cancelamento}%`;

        // Tempo médio
        document.getElementById("dTempo").textContent = d.tempo_medio_horas
            ? `${d.tempo_medio_horas}h` : "—";

        // Top produtos
        document.getElementById("topProdutos").innerHTML = d.top_produtos.map((p, i) => `
            <div class="rank-item">
                <span class="rank-pos">${i + 1}</span>
                <span class="rank-nome">${p.nome}</span>
                <span class="rank-total">${p.total}</span>
            </div>
        `).join("");

        // Top usuários
        document.getElementById("topUsuarios").innerHTML = d.top_usuarios.map((u, i) => `
            <div class="rank-item">
                <span class="rank-pos">${i + 1}</span>
                <span class="rank-nome">${u.nome}</span>
                <span class="rank-total">${u.total}</span>
            </div>
        `).join("");

    } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
    }
}

carregarSolicitacoes();
carregarDashboard();
carregarSolicitacoes();