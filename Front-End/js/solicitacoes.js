const API = "http://localhost:8000";

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    window.location.href = "../login.html";
}

document.getElementById("usuarioNome").textContent = usuario.nome;
document.getElementById("perfilUsuario").textContent = usuario.perfil;
document.getElementById("avatarLetra").textContent = usuario.nome.charAt(0).toUpperCase();

async function carregarSolicitacoes() {
    const resposta = await fetch(`${API}/solicitacoes?usuario_id=${usuario.id}`);
    const solicitacoes = await resposta.json();

    const tbody = document.getElementById("tabelaSolicitacoes");

    if (solicitacoes.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">Nenhuma solicitação encontrada.</td>
            </tr>`;
        return;
    }

    const statusCores = {
        pendente: '#FEF9E7',
        aprovado: '#E8F8EE',
        recusado: '#FDECEA',
        retirado: '#D6EAF8',
        cancelado: '#f0f0f0'
    };

    const statusCoresTexto = {
        pendente: '#856404',
        aprovado: '#1a6b3a',
        recusado: '#922b21',
        retirado: '#1a5276',
        cancelado: '#666'
    };

    const statusBorda = {
        pendente: '#F0D060',
        aprovado: '#A8DDB8',
        recusado: '#F5C0BA',
        retirado: '#85C1E9',
        cancelado: '#ccc'
    };

    const resLotes = await fetch(`${API}/lotes`);
    const todosLotes = await resLotes.json();

    function getLoteCodigo(lote_id) {
        if (!lote_id) return "—";
        const lote = todosLotes.find(l => l.id === lote_id);
        return lote ? lote.codigo : "—";
    }

    const linhas = await Promise.all(solicitacoes.map(async s => {
        const respostaProduto = await fetch(`${API}/produtos/${s.produto_id}`);
        const produto = await respostaProduto.json();

        const cor = statusCores[s.status] || '#f9f9f9';
        const textCor = statusCoresTexto[s.status] || '#333';
        const borda = statusBorda[s.status] || '#ddd';

        return `
            <tr>
                <td class="sku-cell">#${s.id}</td>
                <td>${produto.nome}</td>
                <td>${s.quantidade}</td>
                <td>${getLoteCodigo(s.lote_id)}</td>
                <td>${s.motivo}</td>
                <td>
                    <span style="display:inline-block; padding:3px 9px; border-radius:50px;
                        font-size:0.68rem; font-weight:700; text-transform:uppercase;
                        background:${cor}; color:${textCor}; border:1px solid ${borda};">
                        ${s.status}
                    </span>
                </td>
                <td>
                    ${s.status === 'pendente' ? `
                        <button class="btn-recusar" onclick="cancelarSolicitacao(${s.id})" style="font-size:0.7rem; padding:2px 8px;">
                            ✕ Cancelar
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }));

    tbody.innerHTML = linhas.join("");
}

async function cancelarSolicitacao(id) {
    if (!confirm("Deseja cancelar esta solicitação?")) return;

    await fetch(`${API}/Solicitacoes/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelado" })
    });

    showToast("Solicitação cancelada!");
    carregarSolicitacoes();
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    document.getElementById("toastMsg").textContent = msg;
    toast.style.borderLeftColor = "var(--gold)";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

function logout() {
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
}

carregarSolicitacoes();