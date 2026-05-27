const API = "http://localhost:8000";

const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) window.location.href = "login.html";

document.getElementById("usuarioNome").textContent = usuario.nome;
document.getElementById("perfilUsuario").textContent = usuario.perfil;
document.getElementById("avatarLetra").textContent = usuario.nome.charAt(0).toUpperCase();

let produtos = [];
let viewAtual = 'grid';

function getStatus(p) {
    if (p.quantidade === 0) return "sem";
    if (p.quantidade <= p.quantidade_minima) return "baixo";
    return "ok";
}

function getBadgeClass(status) {
    return status === "ok" ? "badge-ok" : status === "baixo" ? "badge-baixo" : "badge-sem";
}

function getBadgeLabel(status) {
    return status === "ok" ? "Disponível" : status === "baixo" ? "Estoque Baixo" : "Sem Estoque";
}

function iconeCategoria() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
    </svg>`;
}

function renderGrid() {
    const grid = document.getElementById("viewGrid");

    if (produtos.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:32px; color:var(--text-muted)">Nenhum produto cadastrado.</div>`;
        return;
    }

    grid.innerHTML = produtos.map((p, i) => {
        const status = getStatus(p);
        return `
            <div class="produto-card" style="animation-delay:${i * 0.04}s">
                <div class="produto-card-img">
                    ${iconeCategoria()}
                    <span class="produto-card-badge ${getBadgeClass(status)}">${getBadgeLabel(status)}</span>
                </div>
                <div class="produto-card-body">
                    <div class="produto-card-sku">${p.sku}</div>
                    <div class="produto-card-nome">${p.nome}</div>
                    <div class="produto-card-cat">${p.categoria} · ${p.lote}</div>
                    <div class="produto-card-footer">
                        <div class="estoque-info">
                            <strong>${p.quantidade} m</strong><br>em estoque
                        </div>
                        <button class="btn-recusar" onclick="excluirProduto(${p.id})">✕</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function renderLista() {
    const tbody = document.getElementById("tabelaProdutos");

    if (produtos.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="8">Nenhum produto cadastrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = produtos.map(p => {
        const status = getStatus(p);
        return `
            <tr>
                <td class="sku-cell">${p.sku}</td>
                <td><strong>${p.nome}</strong></td>
                <td>${p.categoria}</td>
                <td>${p.quantidade} m</td>
                <td>${p.quantidade_minima}</td>
                <td>${p.lote}</td>
                <td>
                    <span style="
                        display:inline-block;
                        padding:3px 9px;
                        border-radius:50px;
                        font-size:0.68rem;
                        font-weight:700;
                        text-transform:uppercase;
                        ${status === 'ok' ? 'background:#E8F8EE; color:#27AE60; border:1px solid #A8DDB8;' : 
                          status === 'baixo' ? 'background:#FEF9E7; color:#D4A017; border:1px solid #F0D060;' : 
                          'background:#FDECEA; color:#C0392B; border:1px solid #F5C0BA;'}
                    ">
                        ${getBadgeLabel(status)}
                    </span>
                </td>
                <td>
                    <button class="btn-recusar" onclick="excluirProduto(${p.id})">✕</button>
                </td>
            </tr>
        `;
    }).join("");
}

function render() {
    document.getElementById("totalProdutos").textContent = produtos.length;
    renderGrid();
    renderLista();
}

function setView(view) {
    viewAtual = view;
    document.getElementById("viewGrid").style.display = view === "grid" ? "grid" : "none";
    document.getElementById("viewLista").style.display = view === "lista" ? "block" : "none";
    document.getElementById("btnGrid").classList.toggle("active", view === "grid");
    document.getElementById("btnLista").classList.toggle("active", view === "lista");
}

async function carregarProdutos() {
    try {
        const resposta = await fetch(`${API}/produtos`);
        produtos = await resposta.json();
        render();
        setView(viewAtual);
    } catch (err) {
        console.error("Erro ao carregar produtos:", err);
    }
}

async function cadastrarProduto() {
    const nome = document.getElementById("nome").value.trim();
    const sku = document.getElementById("sku").value.trim();
    const categoria = document.getElementById("categoria").value;
    const quantidade = parseInt(document.getElementById("quantidade").value) || 0;
    const quantidade_minima = parseInt(document.getElementById("quantidade_minima").value) || 0;
    const lote = parseInt(document.getElementById("lote").value) || 0;

    if (!nome || !sku || !categoria) {
        showToast("Preencha nome, SKU e categoria.");
        return;
    }

    try {
        const resposta = await fetch(`${API}/produtos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, sku, categoria, quantidade, quantidade_minima, lote })
        });

        if (!resposta.ok) throw new Error("Erro ao cadastrar");

        ["nome", "sku", "quantidade", "quantidade_minima", "lote"].forEach(id => {
            document.getElementById(id).value = "";
        });
        document.getElementById("categoria").value = "";

        showToast("Produto cadastrado com sucesso!");
        carregarProdutos();
    } catch (err) {
        console.error(err);
        showToast("Erro ao cadastrar produto.");
    }
}

async function excluirProduto(id) {
    if (!confirm("Deseja desativar este produto? Ele não aparecerá mais no catálogo.")) return;

    try {
        const resposta = await fetch(`${API}/produtos/${id}/desativar`, { method: "PATCH" });
        const dados = await resposta.json();

        if (dados.erro) {
            showToast(dados.erro);
            return;
        }

        showToast("Produto desativado!");
        carregarProdutos();
    } catch (err) {
        console.error(err);
        showToast("Erro ao desativar produto.");
    }
}

function showToast(msg) {
    const t = document.getElementById("toast");
    document.getElementById("toastMsg").textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
}

function logout() {
    showToast("Saindo...");
    setTimeout(() => { window.location.href = "login.html"; }, 1000);
}

carregarProdutos();