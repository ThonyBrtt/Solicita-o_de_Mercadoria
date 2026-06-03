const API = "http://localhost:8000";

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario || usuario.perfil !== "logistica") {
    window.location.href = "login.html";
}

document.getElementById("usuarioNome").textContent = usuario.nome;
document.getElementById("perfilUsuario").textContent = usuario.perfil;
document.getElementById("avatarLetra").textContent = usuario.nome.charAt(0).toUpperCase();

async function carregarUsuarios() {
    const [resSolicitacoes, resUsuarios] = await Promise.all([
        fetch(`${API}/solicitacoes`),
        fetch(`${API}/usuarios`)
    ]);

    const usuarios = await resUsuarios.json();
    const tbody = document.getElementById("tabelaUsuarios");

    document.getElementById("totalUsuarios").textContent = usuarios.length;

    if (usuarios.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">Nenhum usuário cadastrado.</td>
            </tr>`;
        return;
    }

    tbody.innerHTML = usuarios.map(u => `
        <tr>
            <td class="sku-cell">#${u.id}</td>
            <td>${u.nome}</td>
            <td>${u.usuario}</td>
            <td>${u.perfil}</td>
            <td>
                <select class="input-base" style="padding:4px 8px; font-size:0.8rem"
                        onchange="alterarPerfil(${u.id}, this.value, '${u.nome}', '${u.usuario}', '${u.senha}')">
                    <option value="vendas" ${u.perfil === 'vendas' ? 'selected' : ''}>Vendas</option>
                    <option value="logistica" ${u.perfil === 'logistica' ? 'selected' : ''}>Logística</option>
                </select>
            </td>
            <td>
                <button class="btn-recusar" onclick="excluirUsuario(${u.id})">✕</button>
            </td>
        </tr>
    `).join("");
}

async function cadastrarUsuario() {
    const nome   = document.getElementById("nome").value.trim();
    const user   = document.getElementById("usuario").value.trim();
    const senha  = document.getElementById("senha").value;
    const perfil = document.getElementById("perfil").value;

    if (!nome || !user || !senha || !perfil) {
        showToast("Preencha todos os campos!", "erro");
        return;
    }

    const resposta = await fetch(`${API}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, usuario: user, senha, perfil })
    });

    const dados = await resposta.json();
    showToast("Usuário cadastrado com sucesso!");
    document.getElementById("nome").value = "";
    document.getElementById("usuario").value = "";
    document.getElementById("senha").value = "";
    document.getElementById("perfil").value = "";
    carregarUsuarios();
}

async function alterarPerfil(id, perfil, nome, user, senha) {
    await fetch(`${API}/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, usuario: user, senha, perfil })
    });

    showToast("Perfil atualizado!");
    carregarUsuarios();
}

async function excluirUsuario(id) {
    if (!confirm("Deseja excluir este usuário?")) return;

    await fetch(`${API}/usuarios/${id}`, { method: "DELETE" });
    showToast("Usuário excluído!");
    carregarUsuarios();
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

carregarUsuarios();