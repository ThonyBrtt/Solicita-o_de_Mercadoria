const API = "http://localhost:8000";

// Auth
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) window.location.href = "login.html";

document.getElementById("usuarioNome").textContent = usuario.nome;
document.getElementById("perfilUsuario").textContent = usuario.perfil;
document.getElementById("avatarLetra").textContent = usuario.nome.charAt(0).toUpperCase();

// ─── Helpers de status ────────────────────────────────────────────
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

// ─── Renderiza a tabela ───────────────────────────────────────────
function renderTabela(lista) {
  const tbody = document.getElementById("tabelaProdutos");
  const totalEl = document.getElementById("totalProdutos");

  totalEl.textContent = lista.length;

  if (lista.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Nenhum produto cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(p => {
    const status = getStatus(p);
    return `
      <tr>
        <td>${p.sku}</td>
        <td>${p.nome}</td>
        <td>${p.categoria}</td>
        <td>${p.quantidade} m</td>
        <td>${p.quantidade_minima}</td>
        <td>${p.lote}</td>
        <td>
          <span class="produto-card-badge ${getBadgeClass(status)}"
                style="font-size:0.68rem; padding:3px 9px; border-radius:50px; font-weight:700; text-transform:uppercase;">
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

// ─── Carrega produtos do backend ──────────────────────────────────
async function carregarProdutos() {
  try {
    const resposta = await fetch(`${API}/produtos`);
    const dados = await resposta.json();
    renderTabela(dados);
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
    document.getElementById("tabelaProdutos").innerHTML =
      `<tr class="empty-row"><td colspan="7">Erro ao carregar produtos.</td></tr>`;
  }
}

// ─── Cadastra novo produto ────────────────────────────────────────
async function cadastrarProduto() {
  const nome             = document.getElementById("nome").value.trim();
  const sku              = document.getElementById("sku").value.trim();
  const categoria        = document.getElementById("categoria").value;
  const quantidade       = parseInt(document.getElementById("quantidade").value) || 0;
  const quantidade_minima = parseInt(document.getElementById("quantidade_minima").value) || 0;
  const lote             = parseInt(document.getElementById("lote").value) || 0;

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

    // Limpa os campos
    ["nome", "sku", "quantidade", "quantidade_minima", "lote"].forEach(id => {
      document.getElementById(id).value = "";
    });
    document.getElementById("categoria").value = "";

    showToast("Produto cadastrado com sucesso!");
    carregarProdutos(); // Atualiza a tabela
  } catch (err) {
    console.error(err);
    showToast("Erro ao cadastrar produto.");
  }
}

// ─── Exclui produto ───────────────────────────────────────────────
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

// ─── Toast ────────────────────────────────────────────────────────
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

// ─── Init ─────────────────────────────────────────────────────────
carregarProdutos();