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
        abrirSeletorLote(exato.id, exato.nome, exato.sku, exato.categoria, exato.disponivel ?? exato.quantidade);
        document.getElementById("buscaProduto").value = "";
        document.getElementById("resultadoBusca").innerHTML = "";
        return;
    }

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
                <div class="produto-cat">${p.categoria} — Disponível: ${p.disponivel ?? p.quantidade}</div>
            </div>
            <button class="btn-add" onclick="abrirSeletorLote(${p.id}, '${p.nome}', '${p.sku}', '${p.categoria}', ${p.disponivel ?? p.quantidade})">
                + Adicionar
            </button>
        </div>
    `).join("");
}

async function abrirSeletorLote(produto_id, nome, sku, categoria, estoque) {
    const jaExiste = itens.find(i => i.produto_id === produto_id);
    if (jaExiste) {
        showToast("Produto já adicionado!", "erro");
        return;
    }

    const resposta = await fetch(`${API}/produtos/${produto_id}/lotes`);
    const lotes = await resposta.json();
    const selecionaveis = lotes.filter(l => l.disponivel > 0 && l.pode_solicitar);
    const indisponiveis = lotes.filter(l => l.disponivel > 0 && !l.pode_solicitar);

    if (selecionaveis.length === 0 && indisponiveis.length === 0) {
        showToast("Nenhum lote disponível para este produto!", "erro");
        return;
    }

    document.getElementById("loteProdutoId").value = produto_id;
    document.getElementById("loteNome").textContent = nome;
    document.getElementById("loteSku").textContent = sku;
    document.getElementById("loteCategoria").textContent = categoria;

    document.getElementById("listaLotes").innerHTML = [
        ...selecionaveis.map(l => `
            <div class="lote-row" data-id="${l.id}" data-codigo="${l.codigo}" data-disponivel="${l.disponivel}">
                <label class="lote-row-check">
                    <input type="checkbox" class="lote-checkbox" onchange="atualizarContagem()"/>
                </label>
                <div class="lote-row-info">
                    <span class="lote-row-codigo">${l.codigo}</span>
                </div>
                <span class="lote-row-qtd">${l.disponivel} m</span>
                <span class="lote-row-data">${l.data_entrada || '—'}</span>
            </div>
        `),
        ...indisponiveis.map(l => `
            <div class="lote-row" style="opacity:0.5;">
                <label class="lote-row-check">
                    <input type="checkbox" disabled/>
                </label>
                <div class="lote-row-info">
                    <span class="lote-row-codigo">${l.codigo}</span>
                    <span style="font-size:0.7rem; color:var(--danger); font-weight:600;">Já utilizado</span>
                </div>
                <span class="lote-row-qtd">${l.disponivel} m</span>
                <span class="lote-row-data">${l.data_entrada || '—'}</span>
            </div>
        `)
    ].join("");

    document.getElementById("loteCount").textContent = "0";
    document.getElementById("modalLote").classList.add("show");
}

function atualizarContagem() {
    const checks = document.querySelectorAll(".lote-checkbox:checked");
    document.getElementById("loteCount").textContent = checks.length;
}

function confirmarSelecaoLote() {
    const produto_id = parseInt(document.getElementById("loteProdutoId").value);
    const rows = document.querySelectorAll(".lote-row");

    let adicionados = 0;

    rows.forEach(row => {
        const checkbox = row.querySelector(".lote-checkbox");
        if (!checkbox.checked) return;

        const lote_id = parseInt(row.dataset.id);
        const lote_codigo = row.dataset.codigo;
        const disponivel = parseInt(row.dataset.disponivel);

        itens.push({
            produto_id,
            nome: document.getElementById("loteNome").textContent,
            sku: document.getElementById("loteSku").textContent,
            categoria: document.getElementById("loteCategoria").textContent,
            estoque: disponivel,
            lote_id,
            lote_codigo,
            quantidade: 1
        });
        adicionados++;
    });

    if (adicionados === 0) {
        showToast("Selecione ao menos um lote!", "erro");
        return;
    }

    document.getElementById("modalLote").classList.remove("show");
    renderTabela();
    showToast(`${adicionados} lote(s) adicionado(s)!`, "sucesso");
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
                <div class="produto-cat">${p.categoria} — Disponível: ${p.disponivel ?? p.quantidade}</div>
            </div>
            <button class="btn-add" onclick="abrirSeletorLote(${p.id}, '${p.nome}', '${p.sku}', '${p.categoria}', ${p.disponivel ?? p.quantidade})">
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
        const res = await fetch(`${API}/solicitacoes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario_id: usuario.id,
                produto_id: item.produto_id,
                lote_id: item.lote_id,
                quantidade: item.quantidade,
                motivo: motivo,
                observacoes: observacoes,
                prioridade: "normal"
            })
        });
        const data = await res.json();
        if (data.Mensagem && data.Mensagem.includes("insuficiente")) {
            alert(`Erro: ${data.Mensagem}`);
            return;
        }
    }

    alert("Solicitação enviada com sucesso!");
    localStorage.removeItem("itensSolicitacao");
    itens = [];
    renderTabela();
    document.getElementById("motivo").value = "";
    document.getElementById("observacoes").value = "";
}

function renderTabela() {
    localStorage.setItem("itensSolicitacao", JSON.stringify(itens));
    const tbody = document.getElementById("itensTabela");
    document.getElementById("totalItens").textContent = itens.length;

    if (itens.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">Nenhum item adicionado. Use a busca acima para adicionar produtos.</td>
            </tr>`;
        return;
    }

    tbody.innerHTML = itens.map((item, idx) => `
        <tr>
            <td>${item.sku}</td>
            <td>${item.nome}</td>
            <td>${item.categoria}</td>
            <td>${item.lote_codigo || '—'}</td>
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

function fecharModalLote() {
    document.getElementById("modalLote").classList.remove("show");
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

const pending = localStorage.getItem("pendingProduto");
if (pending) {
    localStorage.removeItem("pendingProduto");
    try {
        const p = JSON.parse(pending);
        abrirSeletorLote(p.id, p.nome, p.sku, p.categoria, p.estoque);
    } catch (e) {}
}

renderTabela();