
    // ── DADOS DE EXEMPLO ──
    const produtos = [
      { sku: 'CT-001', nome: 'Cortina Blackout Premium', categoria: 'Blackout', material: 'Tecido 100% Poliéster', estoque: 45, unidade: 'm', status: 'ok' },
      { sku: 'CT-002', nome: 'Cortina Voil Branca', categoria: 'Cortina', material: 'Voil Transparente', estoque: 120, unidade: 'm', status: 'ok' },
      { sku: 'CT-003', nome: 'Cortina Linho Natural', categoria: 'Cortina', material: 'Linho Importado', estoque: 8, unidade: 'm', status: 'baixo' },
      { sku: 'CP-001', nome: 'Tecido Capotaria Preto', categoria: 'Capotaria', material: 'Tecido Automotivo', estoque: 0, unidade: 'm', status: 'sem' },
      { sku: 'ES-001', nome: 'Espuma D33 Alta Densidade', categoria: 'Estofados', material: 'Espuma Injetada', estoque: 30, unidade: 'm²', status: 'ok' },
      { sku: 'ES-002', nome: 'Tecido Suede Bege', categoria: 'Estofados', material: 'Suede Sintético', estoque: 5, unidade: 'm', status: 'baixo' },
      { sku: 'AT-001', nome: 'Couro Automotivo Marrom', categoria: 'Automotivo', material: 'Couro Ecológico', estoque: 22, unidade: 'm', status: 'ok' },
      { sku: 'AT-002', nome: 'Carpete Automotivo Preto', categoria: 'Automotivo', material: 'Carpete Pelúcia', estoque: 0, unidade: 'm²', status: 'sem' },
      { sku: 'BK-001', nome: 'Blackout Duplo Face', categoria: 'Blackout', material: '100% Blackout', estoque: 60, unidade: 'm', status: 'ok' },
      { sku: 'CT-004', nome: 'Cortina Veludo Cinza', categoria: 'Cortina', material: 'Veludo Nacional', estoque: 14, unidade: 'm', status: 'ok' },
      { sku: 'ES-003', nome: 'Manta Acrílica Branca', categoria: 'Estofados', material: 'Acrílico 300g', estoque: 3, unidade: 'm', status: 'baixo' },
      { sku: 'CP-002', nome: 'Tecido Teto Automotivo', categoria: 'Capotaria', material: 'Espumado 3mm', estoque: 18, unidade: 'm', status: 'ok' },
    ];

    let produtosFiltrados = [...produtos];
    let viewAtual = 'grid';
    let produtoSelecionado = null;

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
        setTimeout(() => { window.location.href = 'solicitacoes.html'; }, 1200);
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