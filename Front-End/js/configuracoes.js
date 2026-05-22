const API = "http://localhost:8000";

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    window.location.href = "login.html";
}

document.getElementById("usuarioNome").textContent = usuario.nome;
document.getElementById("perfilUsuario").textContent = usuario.perfil;
document.getElementById("avatarLetra").textContent = usuario.nome.charAt(0).toUpperCase();
document.getElementById("novoNome").value = usuario.nome;

async function alterarSenha() {
    const senhaAtual = document.getElementById("senhaAtual").value;
    const novaSenha = document.getElementById("novaSenha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        showToast("Preencha todos os campos!", "erro");
        return;
    }

    if (novaSenha !== confirmarSenha) {
        showToast("As senhas não coincidem!", "erro");
        return;
    }

    // Valida a senha atual no back-end
    const respostaLogin = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.usuario, senha: senhaAtual })
    });

    const dadosLogin = await respostaLogin.json();

    if (dadosLogin.erro) {
        showToast("Senha atual incorreta!", "erro");
        return;
    }

    // Atualiza a senha
    await fetch(`${API}/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nome: usuario.nome,
            usuario: usuario.usuario,
            senha: novaSenha,
            perfil: usuario.perfil
        })
    });

    showToast("Senha alterada com sucesso!");
    document.getElementById("senhaAtual").value = "";
    document.getElementById("novaSenha").value = "";
    document.getElementById("confirmarSenha").value = "";
}

async function alterarNome() {
    const novoNome = document.getElementById("novoNome").value.trim();
    const senha = document.getElementById("senhaConfirmaNome").value;

    if (!novoNome || !senha) {
        showToast("Preencha todos os campos!", "erro");
        return;
    }

    // Valida a senha no back-end
    const respostaLogin = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.usuario, senha: senha })
    });

    const dadosLogin = await respostaLogin.json();

    if (dadosLogin.erro) {
        showToast("Senha incorreta!", "erro");
        return;
    }

    await fetch(`${API}/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nome: novoNome,
            usuario: usuario.usuario,
            senha: senha,
            perfil: usuario.perfil
        })
    });

    usuario.nome = novoNome;
    localStorage.setItem("usuario", JSON.stringify(usuario));
    document.getElementById("usuarioNome").textContent = novoNome;
    document.getElementById("avatarLetra").textContent = novoNome.charAt(0).toUpperCase();
    showToast("Nome alterado com sucesso!");
    document.getElementById("senhaConfirmaNome").value = "";
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

function renderSidebar() {
    const menu = document.getElementById("menuPerfil");
    const secao = document.getElementById("secaoMenu");

    if (usuario.perfil === "logistica") {
        secao.textContent = "Painel";
        menu.innerHTML = `
            <a class="nav-item" href="logistica.html">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Todas as Solicitações
            </a>`;
    } else if (usuario.perfil === "vendas") {
        secao.textContent = "Menu";
        menu.innerHTML = `
            <a class="nav-item" href="home.html">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Nova Solicitação
            </a>
            <a class="nav-item" href="solicitacoes.html">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                </svg>
                Minhas Solicitações
            </a>`;
    } else if (usuario.perfil === "proprietario") {
        secao.textContent = "Painel";
        menu.innerHTML = `
            <a class="nav-item" href="proprietario.html">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
                Painel Geral
            </a>`;
    }
}

renderSidebar();

renderSidebar();