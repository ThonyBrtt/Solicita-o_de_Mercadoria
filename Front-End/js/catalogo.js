const API = "http://localhost:8000";

const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) window.location.href = "login.html";

document.getElementById("usuarioNome").textContent = usuario.nome;
document.getElementById("perfilUsuario").textContent = usuario.perfil;
document.getElementById("avatarLetra").textContent = usuario.nome.charAt(0).toUpperCase();
let produtos = [];
let produtosFiltrados = [];
let viewAtual = 'grid';
let produtoSelecionado = null;

async function carregarProdutos() {
    const resposta = await fetch(`${API}/produtos`);
    const dados = await resposta.json();

    // Mapeia os dados do banco para o formato que o catálogo usa
    produtos = dados.map(p => ({
        id: p.id,
        sku: p.sku,
        nome: p.nome,
        categoria: p.categoria,
        material: p.lote,
        estoque: p.quantidade,
        unidade: 'm',
        status: p.quantidade === 0 ? 'sem' : p.quantidade <= p.quantidade_minima ? 'baixo' : 'ok'
    }));

    produtosFiltrados = [...produtos];
    render();
}
    function getBadgeClass(status) {
      return status === 'ok' ? 'badge-ok' : status === 'baixo' ? 'badge-baixo' : 'badge-sem';
    }

    function getBadgeLabel(status) {
      return status === 'ok' ? 'Disponível' : status === 'baixo' ? 'Estoque Baixo' : 'Sem Estoque';
    }

    function iconeCategoria() {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>`;
    }

    function renderGrid() {
      const grid = document.getElementById('viewGrid');
      if (produtosFiltrados.length === 0) {
        grid.innerHTML = `<div class="sem-resultados" style="grid-column:1/-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Nenhum produto encontrado para os filtros selecionados.
        </div>`;
        return;
      }
      grid.innerHTML = produtosFiltrados.map((p, i) => `
        <div class="produto-card" style="animation-delay:${i * 0.04}s" onclick="abrirModal(${produtos.indexOf(p)})">
          <div class="produto-card-img">
            ${iconeCategoria()}
            <span class="produto-card-badge ${getBadgeClass(p.status)}">${getBadgeLabel(p.status)}</span>
          </div>
          <div class="produto-card-body">
            <div class="produto-card-sku">${p.sku}</div>
            <div class="produto-card-nome">${p.nome}</div>
            <div class="produto-card-cat">${p.categoria} · ${p.material}</div>
            <div class="produto-card-footer">
              <div class="estoque-info">
                <strong>${p.estoque} ${p.unidade}</strong><br>em estoque
              </div>
              <button class="btn-ver" onclick="event.stopPropagation(); abrirModal(${produtos.indexOf(p)})">Ver</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    function renderLista() {
      const tbody = document.getElementById('tabelaLista');
      if (produtosFiltrados.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Nenhum produto encontrado para os filtros selecionados.</td></tr>`;
        return;
      }
      tbody.innerHTML = produtosFiltrados.map(p => `
        <tr>
          <td class="sku-cell">${p.sku}</td>
          <td><strong>${p.nome}</strong></td>
          <td>${p.categoria}</td>
          <td>${p.material}</td>
          <td>${p.estoque} ${p.unidade}</td>
          <td><span class="produto-card-badge ${getBadgeClass(p.status)}" style="font-size:0.68rem; padding:3px 9px; border-radius:50px; font-weight:700; text-transform:uppercase;">${getBadgeLabel(p.status)}</span></td>
          <td><button class="btn-ver" onclick="abrirModal(${produtos.indexOf(p)})">Ver</button></td>
        </tr>
      `).join('');
    }

    function render() {
      document.getElementById('totalProdutos').textContent = produtosFiltrados.length;
      renderGrid();
      renderLista();
    }

    function filtrar() {
      const nome = document.getElementById('filtroNome').value.toLowerCase();
      const cat = document.getElementById('filtroCategoria').value;
      const est = document.getElementById('filtroEstoque').value;

      produtosFiltrados = produtos.filter(p => {
        const matchNome = !nome || p.nome.toLowerCase().includes(nome) || p.sku.toLowerCase().includes(nome);
        const matchCat = !cat || p.categoria === cat;
        const matchEst = !est || p.status === est;
        return matchNome && matchCat && matchEst;
      });

      render();
    }

    function limparFiltros() {
      document.getElementById('filtroNome').value = '';
      document.getElementById('filtroCategoria').value = '';
      document.getElementById('filtroEstoque').value = '';
      produtosFiltrados = [...produtos];
      render();
    }

    function setView(view) {
      viewAtual = view;
      document.getElementById('viewGrid').style.display = view === 'grid' ? 'grid' : 'none';
      document.getElementById('viewLista').style.display = view === 'lista' ? 'block' : 'none';
      document.getElementById('btnGrid').classList.toggle('active', view === 'grid');
      document.getElementById('btnLista').classList.toggle('active', view === 'lista');
    }

    function abrirModal(idx) {
      const p = produtos[idx];
      produtoSelecionado = p;
      document.getElementById('modalTitulo').textContent = p.nome;
      document.getElementById('modalFields').innerHTML = `
        <div class="modal-field"><label>SKU</label><span>${p.sku}</span></div>
        <div class="modal-field"><label>Categoria</label><span>${p.categoria}</span></div>
        <div class="modal-field"><label>Material</label><span>${p.material}</span></div>
        <div class="modal-field"><label>Unidade</label><span>${p.unidade}</span></div>
        <div class="modal-field"><label>Em Estoque</label><span>${p.estoque} ${p.unidade}</span></div>
        <div class="modal-field"><label>Status</label><span class="produto-card-badge ${getBadgeClass(p.status)}" style="font-size:0.72rem; padding:3px 10px; border-radius:50px;">${getBadgeLabel(p.status)}</span></div>
      `;
      document.getElementById('overlay').classList.add('show');
    }

    function fecharModal() {
      document.getElementById('overlay').classList.remove('show');
      produtoSelecionado = null;
    }

    function irParaSolicitacao() {
      if (produtoSelecionado) {
        showToast('Redirecionando para nova solicitação...');
        fecharModal();
        setTimeout(() => { window.location.href = 'home.html'; }, 1200);
      }
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      document.getElementById('toastMsg').textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    function logout() {
      showToast('Saindo...');
      setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    }

    // Fechar modal clicando fora
    document.getElementById('overlay').addEventListener('click', function(e) {
      if (e.target === this) fecharModal();
    });

    // Init
    render();

    carregarProdutos();