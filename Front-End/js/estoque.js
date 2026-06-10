const API = "http://localhost:8000";

const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) window.location.href = "login.html";

document.getElementById("usuarioNome").textContent = usuario.nome;
document.getElementById("perfilUsuario").textContent = usuario.perfil;
document.getElementById("avatarLetra").textContent = usuario.nome.charAt(0).toUpperCase();

let produtos = [];
let viewAtual = 'grid';

function getStatus(p) {
    const disp = (p.disponivel !== undefined) ? p.disponivel : p.quantidade;
    if (disp <= 0) return "sem";
    if (disp <= p.quantidade_minima) return "baixo";
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
        const imgHtml = p.imagem
            ? `<img src="${p.imagem}" alt="${p.nome}" style="width:100%;height:100%;object-fit:cover;">`
            : iconeCategoria();

        return `
    <div class="produto-card" style="animation-delay:${i * 0.04}s" onclick="abrirModal(${i})">
        <div class="produto-card-img">
            ${imgHtml}
            <span class="produto-card-badge ${getBadgeClass(status)}">${getBadgeLabel(status)}</span>
        </div>
        <div class="produto-card-body">
            <div class="produto-card-sku">${p.sku}</div>
            <div class="produto-card-nome">${p.nome}</div>
            <div class="produto-card-cat">${p.categoria} · ${p.lote}</div>
            <div class="produto-card-footer">
                <div class="estoque-info">
                    <strong>${p.disponivel ?? p.quantidade} m</strong><br>disponível
                </div>
                <button class="btn-recusar" onclick="event.stopPropagation(); excluirProduto(${p.id})">✕</button>
            </div>
        </div>
    </div>
`;
    }).join("");
}

function renderLista() {
    const tbody = document.getElementById("tabelaLista");

    if (produtos.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="10">Nenhum produto cadastrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = produtos.map(p => {
        const status = getStatus(p);
        const disponivel = (p.disponivel !== undefined) ? p.disponivel : p.quantidade;
        return `
            <tr>
                <td class="sku-cell">${p.sku}</td>
                <td><strong>${p.nome}</strong></td>
                <td>${p.categoria}</td>
                <td>${p.quantidade} m</td>
                <td>${p.reservado || 0} m</td>
                <td>${disponivel} m</td>
                <td>${p.quantidade_minima}</td>
                <td>${p.lote}</td>
                <td>
                    <span style="
                        display:inline-block; padding:3px 9px; border-radius:50px;
                        font-size:0.68rem; font-weight:700; text-transform:uppercase;
                        ${status === 'ok' ? 'background:#E8F8EE; color:#27AE60; border:1px solid #A8DDB8;' :
                          status === 'baixo' ? 'background:#FEF9E7; color:#D4A017; border:1px solid #F0D060;' :
                          'background:#FDECEA; color:#C0392B; border:1px solid #F5C0BA;'}
                    ">${getBadgeLabel(status)}</span>
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
    const lote = parseInt(document.getElementById('lote').value) || 0;
    const imgPreview = document.getElementById('imgPreview');
    const imagem = imgPreview && imgPreview.style.display !== 'none' ? imgPreview.src : null;

    if (!nome || !sku || !categoria) {
        showToast("Preencha nome, SKU e categoria.");
        return;
    }

    try {
        const resposta = await fetch(`${API}/produtos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, sku, categoria, quantidade, quantidade_minima, lote, imagem })
        });

        if (!resposta.ok) throw new Error("Erro ao cadastrar");

        ["nome", "sku", "quantidade", "quantidade_minima", "lote"].forEach(id => {
            document.getElementById(id).value = "";
        });
        document.getElementById("categoria").value = "";
        removerImagem();

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

function abrirModal(idx) {
    const p = produtos[idx];
    document.getElementById('modalTitulo').textContent = 'Editar Produto';
    document.getElementById('modalFields').innerHTML = `
        <div class="modal-field">
            <label>Nome</label>
            <input type="text" class="input-base" id="editNome" value="${p.nome}"/>
        </div>
        <div class="modal-field">
            <label>SKU</label>
            <input type="text" class="input-base" id="editSku" value="${p.sku}"/>
        </div>
        <div class="modal-field">
            <label>Categoria</label>
            <select class="input-base" id="editCategoria">
                <option value="Cortina" ${p.categoria === 'Cortina' ? 'selected' : ''}>Cortina</option>
                <option value="Blackout" ${p.categoria === 'Blackout' ? 'selected' : ''}>Blackout</option>
                <option value="Capotaria" ${p.categoria === 'Capotaria' ? 'selected' : ''}>Capotaria</option>
                <option value="Estofados" ${p.categoria === 'Estofados' ? 'selected' : ''}>Estofados</option>
                <option value="Automotivo" ${p.categoria === 'Automotivo' ? 'selected' : ''}>Automotivo</option>
            </select>
        </div>
        <div class="modal-field">
            <label>Quantidade</label>
            <input type="number" class="input-base" id="editQuantidade" value="${p.quantidade}" min="0"/>
        </div>
        <div class="modal-field">
            <label>Quantidade Mínima</label>
            <input type="number" class="input-base" id="editQuantidadeMinima" value="${p.quantidade_minima}" min="0"/>
        </div>
        <div class="modal-field">
            <label>Reservado</label>
            <input type="text" class="input-base" value="${p.reservado || 0} m" disabled style="opacity:0.7"/>
        </div>
        <div class="modal-field">
            <label>Disponível</label>
            <input type="text" class="input-base" value="${p.disponivel ?? p.quantidade} m" disabled style="opacity:0.7"/>
        </div>
        <div class="modal-field">
            <label>Lote</label>
            <input type="number" class="input-base" id="editLote" value="${p.lote}" min="0"/>
        </div>
        <div class="modal-field" style="grid-column: 1/-1">
            <label>Imagem</label>
            <label class="img-upload-label" id="editImgLabel">
                <input type="file" id="editImagem" accept="image/*" style="display:none" onchange="previewImagemEdit(this)"/>
                <div class="img-upload-placeholder" id="editImgPlaceholder" style="${p.imagem ? 'display:none' : 'display:flex'}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Clique para selecionar uma imagem</span>
                </div>
                <img id="editImgPreview" src="${p.imagem || ''}" alt="Preview" style="display:${p.imagem ? 'block' : 'none'}; width:100%; height:160px; object-fit:cover; border-radius:7px;"/>
            </label>
            <button class="btn-remover-img" id="editBtnRemoverImg" style="display:${p.imagem ? 'inline-block' : 'none'}" onclick="removerImagemEdit()">✕ Remover imagem</button>
        </div>
    `;

    document.getElementById('btnConfirm').textContent = 'Salvar Alterações';
    document.getElementById('btnConfirm').onclick = () => salvarEdicao(p.id);
    document.getElementById('overlay').classList.add('show');
}

function previewImagemEdit(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('editImgPreview').src = e.target.result;
        document.getElementById('editImgPreview').style.display = 'block';
        document.getElementById('editImgPlaceholder').style.display = 'none';
        document.getElementById('editBtnRemoverImg').style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
}

function removerImagemEdit() {
    document.getElementById('editImagem').value = '';
    document.getElementById('editImgPreview').src = '';
    document.getElementById('editImgPreview').style.display = 'none';
    document.getElementById('editImgPlaceholder').style.display = 'flex';
    document.getElementById('editBtnRemoverImg').style.display = 'none';
}

async function salvarEdicao(id) {
    const nome = document.getElementById('editNome').value.trim();
    const sku = document.getElementById('editSku').value.trim();
    const categoria = document.getElementById('editCategoria').value;
    const quantidade = parseInt(document.getElementById('editQuantidade').value) || 0;
    const quantidade_minima = parseInt(document.getElementById('editQuantidadeMinima').value) || 0;
    const lote = parseInt(document.getElementById('editLote').value) || 0;
    const editImgPreview = document.getElementById('editImgPreview');
    const imagem = editImgPreview.style.display !== 'none' ? editImgPreview.src : null;

    if (!nome || !sku || !categoria) {
        showToast("Preencha nome, SKU e categoria.");
        return;
    }

    try {
        const resposta = await fetch(`${API}/produtos/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, sku, categoria, quantidade, quantidade_minima, lote, imagem })
        });

        if (!resposta.ok) throw new Error("Erro ao atualizar");

        fecharModal();
        showToast("Produto atualizado com sucesso!");
        carregarProdutos();
    } catch (err) {
        console.error(err);
        showToast("Erro ao atualizar produto.");
    }
}

function fecharModal() {
    document.getElementById('overlay').classList.remove('show');
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

function previewImagem(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('imgPreview').src = e.target.result;
        document.getElementById('imgPreview').style.display = 'block';
        document.getElementById('imgPlaceholder').style.display = 'none';
        document.getElementById('btnRemoverImg').style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
}

function removerImagem() {
    document.getElementById('imagemProduto').value = '';
    document.getElementById('imgPreview').src = '';
    document.getElementById('imgPreview').style.display = 'none';
    document.getElementById('imgPlaceholder').style.display = 'flex';
    document.getElementById('btnRemoverImg').style.display = 'none';
}

carregarProdutos();
