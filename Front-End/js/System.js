const API = "http://localhost:8000";

let itens = [];

async function buscarProduto() {
    const termo = document.getElementById("buscaProduto").value.toLowerCase();
    const categoria = document.getElementById("categoria").value;

    const resposta = await fetch(`${API}/produtos`);
    const produtos = await resposta.json();

    const filtrados = produtos.filter(p => {
        const nomeOk = p.nome.toLowerCase().includes(termo);
        const skuOk = p.sku.toLowerCase().includes(termo);
        const catOk = categoria ? p.categoria === categoria : true;
        return (nomeOk || skuOk) && catOk;
    });

    const resultado = document.getElementById("resultadoBusca");
    resultado.innerHTML = filtrados.map(p => `
        <div>
            <strong>${p.nome}</strong> - SKU ${p.sku} - Estoque: ${p.quantidade}
            <button onclick="adicionarItem(${p.id}, '${p.nome}', '${p.sku}', '${p.categoria}', ${p.quantidade})">
                + Adicionar
            </button>
        </div>
    `).join("");
}

    function adicionarItem(id, nome, sku, categoria, estoque) {
    const jaExiste = itens.find(i => i.produto_id === id);
    
    if (jaExiste) {
        alert("Produto já adicionado!");
        return;
    }

    itens.push({
        produto_id: id,
        nome: nome,
        sku: sku,
        categoria: categoria,
        estoque: estoque,
        quantidade: 1
    });

    renderTabela();
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
                prioridade: "normal"
            })
        });
    }

    alert("Solicitação enviada com sucesso!");
    itens = [];
    renderTabela();
    document.getElementById("motivo").value = "";
}

function renderTabela() {
    const tbody = document.getElementById("itensTabela");

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
                <button onclick="removerItem(${idx})">✕</button>
            </td>
        </tr>
    `).join("");

    document.getElementById("totalItens").textContent = itens.length;
}

buscarProduto();