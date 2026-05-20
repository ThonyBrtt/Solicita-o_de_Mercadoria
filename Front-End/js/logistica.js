const API = "http://localhost:8000";

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario || usuario.perfil !== "logistica") {
    window.location.href = "login.html";
}

document.getElementById("usuarioNome").textContent = usuario.nome;
document.getElementById("perfilUsuario").textContent = usuario.perfil;
document.getElementById("avatarLetra").textContent = usuario.nome.charAt(0).toUpperCase();

async function carregarSolicitacoes() {
    const [resSolicitacoes, resProdutos, resUsuarios] = await Promise.all([
        fetch(`${API}/solicitacoes`),
        fetch(`${API}/produtos`),
        fetch(`${API}/usuarios`)
    ]);

    const solicitacoes = await resSolicitacoes.json();
    const produtos = await resProdutos.json();
    const usuarios = await resUsuarios.json();

    const tbody = document.getElementById("tabelaAdmin");

    if (solicitacoes.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">Nenhuma solicitação encontrada.</td>
            </tr>`;
        return;
    }

    tbody.innerHTML = solicitacoes.map(s => {
        const produto = produtos.find(p => p.id === s.produto_id);
        const solicitante = usuarios.find(u => u.id === s.usuario_id);

        return `
            <tr>
                <td class="sku-cell">#${s.id}</td>
                <td>${solicitante ? solicitante.nome : "Desconhecido"}</td>
                <td>${produto ? produto.nome : "Desconhecido"}</td>
                <td>${s.quantidade}</td>
                <td>${s.motivo}</td>
                <td>${s.status}</td>
                <td>
                    <button class="btn-aprovar" onclick="atualizarStatus(${s.id}, 'aprovado')">✔</button>
                    <button class="btn-recusar" onclick="atualizarStatus(${s.id}, 'recusado')">✘</button>
                </td>
            </tr>
        `;
    }).join("");
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

carregarSolicitacoes();