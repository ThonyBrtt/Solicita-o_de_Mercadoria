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
                <td colspan="5">Nenhuma solicitação encontrada.</td>
            </tr>`;
        return;
    }

    const linhas = await Promise.all(solicitacoes.map(async s => {
        const respostaProduto = await fetch(`${API}/produtos/${s.produto_id}`);
        const produto = await respostaProduto.json();

        return `
            <tr>
                <td class="sku-cell">#${s.id}</td>
                <td>${produto.nome}</td>
                <td>${s.quantidade}</td>
                <td>${s.motivo}</td>
                <td>${s.status}</td>
            </tr>
        `;
    }));

    tbody.innerHTML = linhas.join("");
}

function logout() {
    localStorage.removeItem("usuario");
    window.location.href = "../login.html";
}

carregarSolicitacoes();