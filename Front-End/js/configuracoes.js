const API = "http://localhost:8000";

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    window.location.href = "login.html";
}

document.getElementById("usuarioNome").textContent = usuario.nome;
document.getElementById("perfilUsuario").textContent = usuario.perfil;
document.getElementById("avatarLetra").textContent = usuario.nome.charAt(0).toUpperCase();
document.getElementById("novoNome").value = usuario.nome;
document.getElementById("novoEmail").value = usuario.email || '';

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

async function alterarEmail() {
    const novoEmail = document.getElementById("novoEmail").value.trim();
    const senha = document.getElementById("senhaConfirmaEmail").value;

    if (!novoEmail || !senha) {
        showToast("Preencha todos os campos!", "erro");
        return;
    }

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
            nome: usuario.nome,
            usuario: usuario.usuario,
            senha: senha,
            perfil: usuario.perfil,
            email: novoEmail
        })
    });

    usuario.email = novoEmail;
    localStorage.setItem("usuario", JSON.stringify(usuario));
    showToast("Email alterado com sucesso!");
    document.getElementById("senhaConfirmaEmail").value = "";
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