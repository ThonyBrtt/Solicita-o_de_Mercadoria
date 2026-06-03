const API = "http://localhost:8000";

let itens = JSON.parse(localStorage.getItem("itensSolicitacao")) || [];

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    window.location.href = "login.html";
}

document.getElementById("usuarioNome").textContent = usuario.nome;
document.getElementById("perfilUsuario").textContent = usuario.perfil;
document.getElementById("avatarLetra").textContent = usuario.nome.charAt(0).toUpperCase();

async function buscarProduto() {
    const termo = document.getElementById("buscaProduto").value.trim().toLowerCase();
    const categoria = document.getElementById("categoria").value;

    if (!termo) return;

    const resposta = await fetch(`${API}/produtos`);
    const produtos = await resposta.json();

    const exato = produtos.find(p =>
        p.nome.toLowerCase() === termo || p.sku.toLowerCase() === termo
    );

    if (exato) {
        adicionarItem(exato.id, exato.nome, exato.sku, exato.categoria, exato.quantidade);
        document.getElementById("buscaProduto").value = "";
        document.getElementById("resultadoBusca").innerHTML = "";
        return;
    }

    // Se não achou exato, mostra resultado filtrado abaixo
    const filtrados = produtos.filter(p => {
        const nomeOk = p.nome.toLowerCase().includes(termo);
        const skuOk = p.sku.toLowerCase().includes(termo);
        const catOk = categoria ? p.categoria === categoria : true;
        return (nomeOk || skuOk) && catOk;
    });

    document.getElementById("resultadoBusca").innerHTML = filtrados.map(p => `
        <div class="produto-item">
            <div class="produto-info">
                <div class="produto-sku">${p.sku}</div>
                <div class="produto-nome">${p.nome}</div>
                <div class="produto-cat">${p.categoria} — Estoque: ${p.quantidade}</div>
            </div>
            <button class="btn-add" onclick="adicionarItem(${p.id}, '${p.nome}', '${p.sku}', '${p.categoria}', ${p.quantidade})">
                + Adicionar
            </button>
        </div>
    `).join("");
}

function adicionarItem(id, nome, sku, categoria, estoque) {
    const jaExiste = itens.find(i => i.produto_id === id);

    if (jaExiste) {
        showToast("Produto já adicionado!", "erro");
        return;
    }

    itens.push({ produto_id: id, nome, sku, categoria, estoque, quantidade: 1 });
    renderTabela();
    showToast(`${nome} adicionado!`, "sucesso");
}

function filtrarModal() {
    const termo = document.getElementById("filtroModal").value.toLowerCase();

    const filtrados = todosProdutos.filter(p =>
        p.nome.toLowerCase().includes(termo) || p.sku.toLowerCase().includes(termo)
    );

    document.getElementById("listaModal").innerHTML = filtrados.map(p => `
        <div class="produto-item">
            <div class="produto-info">
                <div class="produto-sku">${p.sku}</div>
                <div class="produto-nome">${p.nome}</div>
                <div class="produto-cat">${p.categoria} — Estoque: ${p.quantidade} — Lote: ${p.lote}</div>
            </div>
            <button class="btn-add" onclick="adicionarItem(${p.id}, '${p.nome}', '${p.sku}', '${p.categoria}', ${p.quantidade})">
                + Adicionar
            </button>
        </div>
    `).join("");
}

function showToast(msg, tipo = "sucesso") {
    const toast = document.getElementById("toast");
    document.getElementById("toastMsg").textContent = msg;
    toast.style.borderLeftColor = tipo === "erro" ? "var(--danger)" : "var(--gold)";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

function removerItem(idx) {
    itens.splice(idx, 1);
    renderTabela();
}

async function confirmarEnvio() {
    if (itens.length === 0) {
        alert("Adicione pelo menos um produto!");
        return;
    }

    const motivo = document.getElementById("motivo").value;
    if (!motivo) {
        alert("Selecione o motivo da saída!");
        return;
    }

    const observacoes = document.getElementById("observacoes").value.trim();
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    for (const item of itens) {
        await fetch(`${API}/solicitacoes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario_id: usuario.id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                motivo: motivo,
                observacoes: observacoes, // ← adicionado
                prioridade: "normal"
            })
        });
    }

    alert("Solicitação enviada com sucesso!");
    localStorage.removeItem("itensSolicitacao");
    itens = [];
    renderTabela();
    document.getElementById("motivo").value = "";
    document.getElementById("observacoes").value = "";
}

function renderTabela() {
    localStorage.setItem("itensSolicitacao", JSON.stringify(itens)); // ← adiciona essa linha
    const tbody = document.getElementById("itensTabela");
    document.getElementById("totalItens").textContent = itens.length;

    if (itens.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">Nenhum item adicionado. Use a busca acima para adicionar produtos.</td>
            </tr>`;
        return;
    }

    tbody.innerHTML = itens.map((item, idx) => `
        <tr>
            <td>${item.sku}</td>
            <td>${item.nome}</td>
            <td>${item.categoria}</td>
            <td>${item.estoque}</td>
            <td>${item.quantidade}</td>
            <td>
                <button class="btn-recusar" onclick="removerItem(${idx})">✕</button>
            </td>
        </tr>
    `).join("");
}

let todosProdutos = [];

async function abrirModalBusca() {
    const resposta = await fetch(`${API}/produtos`);
    todosProdutos = await resposta.json();
    
    document.getElementById("modalBusca").style.display = "flex";
    document.getElementById("filtroModal").value = "";
    filtrarModal();
}

function fecharModalBusca() {
    document.getElementById("modalBusca").style.display = "none";
}

function limparFormulario() {
    itens = [];
    localStorage.removeItem("itensSolicitacao");
    renderTabela();
    document.getElementById("motivo").value = "";
    document.getElementById("observacoes").value = "";
    document.getElementById("buscaProduto").value = "";
    document.getElementById("resultadoBusca").innerHTML = "";
    showToast("Formulário limpo!", "sucesso");
}

function logout() {
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
}

renderTabela();