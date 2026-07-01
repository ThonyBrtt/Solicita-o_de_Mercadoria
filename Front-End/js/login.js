function toggleSenha() {
      const input = document.getElementById('senha');
      const icon  = document.getElementById('eye-icon');
      if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = `
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>`;
      } else {
        input.type = 'password';
        icon.innerHTML = `
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>`;
      }
    }

    async function handleLogin(e){
    e.preventDefault();
    
    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;

    const resposta = await fetch("http://localhost:8000/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({usuario, senha})
    });

    const dados = await resposta.json();

    if (dados.erro){
        alert(dados.erro);
        return;
    }

    localStorage.setItem("usuario", JSON.stringify(dados));

    const lembrar = document.getElementById("lembrar").checked;
    if (lembrar) {
        localStorage.setItem("rb_usuario", dados.usuario);
    } else {
        localStorage.removeItem("rb_usuario");
    }

    if (dados.perfil === "proprietario") {
        window.location.href = "proprietario.html";
    } else if (dados.perfil === "logistica") {
        window.location.href = "logistica.html";
    } else {
        window.location.href = "home.html";
    }
}

    window.addEventListener('DOMContentLoaded', () => {
      const salvo = localStorage.getItem('rb_usuario');
      if (salvo) {
        document.getElementById('usuario').value = salvo;
        document.getElementById('lembrar').checked = true;
      }
    });