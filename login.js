// Configuração da página de login
document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.getElementById("loginForm");
  const tipoUsuario = document.getElementById("tipoUsuario");
  const campoEmail = document.getElementById("campoEmail");
  const mensagemLogin = document.getElementById("mensagemLogin");

  // Mostrar/ocultar campo de e-mail conforme o tipo
  tipoUsuario.addEventListener("change", () => {
    const precisaEmail = tipoUsuario.value === "funcionario" || tipoUsuario.value === "parceiro";
    campoEmail.style.display = precisaEmail ? "block" : "none";
    document.getElementById("emailLogin").required = precisaEmail;
  });

  // Processar login
  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    mensagemLogin.classList.add("d-none");

    const tipo = tipoUsuario.value;
    const email = (tipo === "funcionario" || tipo === "parceiro") ? document.getElementById("emailLogin").value.trim() : "";
    const senha = document.getElementById("senhaLogin").value;

    if (!tipo) {
      mensagemLogin.textContent = "Selecione o tipo de usuário.";
      mensagemLogin.classList.remove("d-none");
      return;
    }

    if (!senha) {
      mensagemLogin.textContent = "Informe a senha.";
      mensagemLogin.classList.remove("d-none");
      return;
    }

    if ((tipo === "funcionario" || tipo === "parceiro") && !email) {
      mensagemLogin.textContent = "Informe o e-mail.";
      mensagemLogin.classList.remove("d-none");
      return;
    }

    const resultado = fazerLogin(tipo, email, senha);
    if (resultado.sucesso) {
      // Redirecionar para a página apropriada
      if (resultado.usuario.tipo === "admin") {
        window.location.href = "admin.html";
      } else if (resultado.usuario.tipo === "parceiro") {
        window.location.href = "parceiro.html";
      } else {
        window.location.href = "funcionario.html";
      }
    } else {
      mensagemLogin.textContent = resultado.mensagem || "Erro ao fazer login.";
      mensagemLogin.classList.remove("d-none");
    }
  });

  // Verificar se já está logado
  const sessao = carregarSessao();
  if (sessao) {
    if (sessao.tipo === "admin") {
      window.location.href = "admin.html";
    } else if (sessao.tipo === "parceiro") {
      window.location.href = "parceiro.html";
    } else {
      window.location.href = "funcionario.html";
    }
  }
});
