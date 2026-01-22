// Chaves de armazenamento
const STORAGE_KEY_USUARIOS = "gestao_diario_oficial_usuarios_v1";
const STORAGE_KEY_POUPATEMPOS = "gestao_diario_oficial_poupatempos_v1";
const STORAGE_KEY_REGISTROS = "gestao_diario_oficial_registros_v1";
const STORAGE_KEY_SESSAO = "gestao_diario_oficial_sessao_v1";

// Dados globais
let usuarios = [];
let poupatempos = [];
let registros = [];
let usuarioLogado = null;

// ========== GERENCIAMENTO DE USUÁRIOS ==========
function carregarUsuarios() {
  const salvo = localStorage.getItem(STORAGE_KEY_USUARIOS);
  if (!salvo) {
    // Criar admin padrão na primeira vez
    usuarios = [
      {
        id: "admin-1",
        tipo: "admin",
        email: "admin@diariooficial.sp.gov.br",
        senha: "admin123", // Em produção, usar hash
        nome: "Administrador",
        criadoEm: new Date().toISOString(),
      },
    ];
    salvarUsuarios();
    return;
  }
  try {
    usuarios = JSON.parse(salvo) || [];
  } catch {
    usuarios = [];
  }
}

function salvarUsuarios() {
  localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
}

function criarUsuarioAdmin(email, senha, nome) {
  const novo = {
    id: `admin-${Date.now()}`,
    tipo: "admin",
    email: email.toLowerCase().trim(),
    senha: senha, // Em produção, usar hash
    nome: nome.trim(),
    criadoEm: new Date().toISOString(),
  };
  usuarios.push(novo);
  salvarUsuarios();
  return novo;
}

// ========== GERENCIAMENTO DE POUPATEMPOS ==========
function carregarPoupatempos() {
  const salvo = localStorage.getItem(STORAGE_KEY_POUPATEMPOS);
  if (!salvo) {
    poupatempos = [];
    return;
  }
  try {
    poupatempos = JSON.parse(salvo) || [];
  } catch {
    poupatempos = [];
  }
}

function salvarPoupatempos() {
  localStorage.setItem(STORAGE_KEY_POUPATEMPOS, JSON.stringify(poupatempos));
}

function cadastrarPoupatempo(dados) {
  // Verificar se já existe um Poupatempo com o mesmo nome ou e-mail
  const existeNome = poupatempos.some(
    (p) => p.nome.toLowerCase() === dados.nome.toLowerCase()
  );
  const existeEmail = poupatempos.some(
    (p) => p.responsavelEmail.toLowerCase() === dados.responsavelEmail.toLowerCase()
  );

  if (existeNome) {
    return { sucesso: false, mensagem: "Já existe um Poupatempo com este nome." };
  }

  if (existeEmail) {
    return { sucesso: false, mensagem: "Este e-mail já está cadastrado em outro Poupatempo." };
  }

  const novo = {
    id: `poupa-${Date.now()}`,
    nome: dados.nome.trim(),
    endereco: dados.endereco.trim(),
    responsavelNome: dados.responsavelNome.trim(),
    responsavelEmail: dados.responsavelEmail.toLowerCase().trim(),
    quantidadeEsperada: Number(dados.quantidadeEsperada),
    criadoEm: new Date().toISOString(),
  };

  poupatempos.push(novo);
  salvarPoupatempos();

  // Criar usuário funcionário automaticamente
  const senhaPadrao = `poupa${Date.now().toString().slice(-6)}`;
  criarUsuarioFuncionario(novo.responsavelEmail, senhaPadrao, novo.responsavelNome, novo.id);

  return {
    sucesso: true,
    mensagem: `Poupatempo cadastrado com sucesso! Senha do funcionário: ${senhaPadrao}`,
    poupatempo: novo,
  };
}

function criarUsuarioFuncionario(email, senha, nome, poupatempoId) {
  const novo = {
    id: `func-${Date.now()}`,
    tipo: "funcionario",
    email: email.toLowerCase().trim(),
    senha: senha,
    nome: nome.trim(),
    poupatempoId: poupatempoId,
    criadoEm: new Date().toISOString(),
  };
  usuarios.push(novo);
  salvarUsuarios();
  return novo;
}

function obterPoupatempoPorId(id) {
  return poupatempos.find((p) => p.id === id);
}

function obterPoupatempoPorEmail(email) {
  const funcionario = usuarios.find(
    (u) => u.tipo === "funcionario" && u.email === email.toLowerCase()
  );
  if (!funcionario) return null;
  return obterPoupatempoPorId(funcionario.poupatempoId);
}

// ========== GERENCIAMENTO DE REGISTROS ==========
function carregarRegistros() {
  const salvo = localStorage.getItem(STORAGE_KEY_REGISTROS);
  if (!salvo) {
    registros = [];
    return;
  }
  try {
    registros = JSON.parse(salvo) || [];
  } catch {
    registros = [];
  }
}

function salvarRegistros() {
  localStorage.setItem(STORAGE_KEY_REGISTROS, JSON.stringify(registros));
}

// ========== SESSÃO ==========
function salvarSessao(usuario) {
  usuarioLogado = usuario;
  localStorage.setItem(STORAGE_KEY_SESSAO, JSON.stringify(usuario));
}

function carregarSessao() {
  const salvo = localStorage.getItem(STORAGE_KEY_SESSAO);
  if (salvo) {
    try {
      usuarioLogado = JSON.parse(salvo);
      return usuarioLogado;
    } catch {
      usuarioLogado = null;
    }
  }
  return null;
}

function limparSessao() {
  usuarioLogado = null;
  localStorage.removeItem(STORAGE_KEY_SESSAO);
}

// ========== LOGIN ==========
function fazerLogin(tipo, email, senha) {
  if (tipo === "admin") {
    // Para admin, busca apenas por senha (não precisa de email)
    const usuario = usuarios.find(
      (u) => u.tipo === "admin" && u.senha === senha
    );
    if (!usuario) {
      return { sucesso: false, mensagem: "Senha incorreta." };
    }
    salvarSessao(usuario);
    return { sucesso: true, usuario };
  } else if (tipo === "funcionario") {
    // Para funcionário, precisa de email e senha
    if (!email) {
      return { sucesso: false, mensagem: "Informe o e-mail." };
    }
    const usuario = usuarios.find(
      (u) => u.tipo === "funcionario" && u.email === email.toLowerCase() && u.senha === senha
    );
    if (!usuario) {
      return { sucesso: false, mensagem: "E-mail ou senha incorretos." };
    }
    salvarSessao(usuario);
    return { sucesso: true, usuario };
  }
  return { sucesso: false, mensagem: "Tipo de usuário inválido." };
}

// ========== INTERFACE - LOGIN ==========
function mostrarTelaLogin() {
  document.getElementById("telaLogin").style.display = "flex";
  document.getElementById("telaAdmin").style.display = "none";
  document.getElementById("telaFuncionario").style.display = "none";
}

function mostrarTelaAdmin() {
  document.getElementById("telaLogin").style.display = "none";
  document.getElementById("telaAdmin").style.display = "block";
  document.getElementById("telaFuncionario").style.display = "none";
  document.getElementById("nomeUsuarioAdmin").textContent = usuarioLogado.nome;
  atualizarTabelaPoupatempos();
  atualizarTabelaRegistrosAdmin();
  popularSelectFiltroAdmin();
}

function mostrarTelaFuncionario() {
  document.getElementById("telaLogin").style.display = "none";
  document.getElementById("telaAdmin").style.display = "none";
  document.getElementById("telaFuncionario").style.display = "block";

  const poupatempo = obterPoupatempoPorId(usuarioLogado.poupatempoId);
  if (poupatempo) {
    document.getElementById("nomePoupatempoFuncionario").textContent = poupatempo.nome;
    document.getElementById("quantidadeEsperadaFuncionario").textContent = poupatempo.quantidadeEsperada;
    document.getElementById("infoFuncionario").textContent = `${poupatempo.nome} - ${usuarioLogado.nome}`;
  }
  atualizarTabelaRegistrosFuncionario();
}

function configurarLogin() {
  const formLogin = document.getElementById("loginForm");
  const tipoUsuario = document.getElementById("tipoUsuario");
  const campoEmail = document.getElementById("campoEmail");
  const mensagemLogin = document.getElementById("mensagemLogin");

  tipoUsuario.addEventListener("change", () => {
    campoEmail.style.display = tipoUsuario.value === "funcionario" ? "block" : "none";
    document.getElementById("emailLogin").required = tipoUsuario.value === "funcionario";
  });

  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    mensagemLogin.classList.add("d-none");

    const tipo = tipoUsuario.value;
    const email = tipo === "funcionario" ? document.getElementById("emailLogin").value.trim() : "";
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

    if (tipo === "funcionario" && !email) {
      mensagemLogin.textContent = "Informe o e-mail.";
      mensagemLogin.classList.remove("d-none");
      return;
    }

    const resultado = fazerLogin(tipo, email, senha);
    if (resultado.sucesso) {
      if (resultado.usuario.tipo === "admin") {
        mostrarTelaAdmin();
      } else {
        mostrarTelaFuncionario();
      }
    } else {
      mensagemLogin.textContent = resultado.mensagem || "Erro ao fazer login.";
      mensagemLogin.classList.remove("d-none");
    }
  });

  document.getElementById("btnLogoutAdmin").addEventListener("click", () => {
    limparSessao();
    mostrarTelaLogin();
    formLogin.reset();
  });

  document.getElementById("btnLogoutFuncionario").addEventListener("click", () => {
    limparSessao();
    mostrarTelaLogin();
    formLogin.reset();
  });
}

// ========== INTERFACE - ADMINISTRAÇÃO ==========
function configurarAdmin() {
  const formCadastro = document.getElementById("cadastroPoupatempoForm");
  const mensagemCadastro = document.getElementById("mensagemCadastro");

  formCadastro.addEventListener("submit", (e) => {
    e.preventDefault();
    mensagemCadastro.classList.add("d-none");

    const dados = {
      nome: document.getElementById("nomePoupatempo").value.trim(),
      endereco: document.getElementById("enderecoPoupatempo").value.trim(),
      responsavelNome: document.getElementById("responsavelNome").value.trim(),
      responsavelEmail: document.getElementById("responsavelEmail").value.trim(),
      quantidadeEsperada: document.getElementById("quantidadeEsperada").value,
    };

    const resultado = cadastrarPoupatempo(dados);
    if (resultado.sucesso) {
      mensagemCadastro.textContent = resultado.mensagem;
      mensagemCadastro.className = "alert alert-success";
      mensagemCadastro.classList.remove("d-none");
      formCadastro.reset();
      atualizarTabelaPoupatempos();
      popularSelectFiltroAdmin();
    } else {
      mensagemCadastro.textContent = resultado.mensagem;
      mensagemCadastro.className = "alert alert-danger";
      mensagemCadastro.classList.remove("d-none");
    }
  });

  document.getElementById("exportarPoupatempos").addEventListener("click", exportarPoupatemposCsv);
  document.getElementById("exportarCsvAdmin").addEventListener("click", exportarRegistrosCsvAdmin);
  document.getElementById("aplicarFiltrosAdmin").addEventListener("click", aplicarFiltrosAdmin);
  document.getElementById("limparFiltrosAdmin").addEventListener("click", limparFiltrosAdmin);
}

function atualizarTabelaPoupatempos() {
  const tbody = document.querySelector("#tabelaPoupatempos tbody");
  tbody.innerHTML = "";

  if (!poupatempos.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "text-center text-muted";
    td.textContent = "Nenhum Poupatempo cadastrado.";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    poupatempos.forEach((p) => {
      const tr = document.createElement("tr");

      tr.appendChild(criarTd(p.nome));
      tr.appendChild(criarTd(p.endereco));
      tr.appendChild(criarTd(p.responsavelNome));
      tr.appendChild(criarTd(p.responsavelEmail));
      const tdQtd = criarTd(p.quantidadeEsperada);
      tdQtd.className = "text-end";
      tr.appendChild(tdQtd);

      const tdAcoes = document.createElement("td");
      tdAcoes.className = "text-end";
      const btnExcluir = document.createElement("button");
      btnExcluir.className = "btn btn-sm btn-outline-danger";
      btnExcluir.textContent = "Excluir";
      btnExcluir.addEventListener("click", () => excluirPoupatempo(p.id));
      tdAcoes.appendChild(btnExcluir);
      tr.appendChild(tdAcoes);

      tbody.appendChild(tr);
    });
  }

  document.getElementById("resumoPoupatempos").textContent = `Total: ${poupatempos.length} Poupatempo(s) cadastrado(s).`;
}

function criarTd(texto) {
  const td = document.createElement("td");
  td.textContent = texto;
  return td;
}

function excluirPoupatempo(id) {
  if (!confirm("Confirma a exclusão deste Poupatempo? Esta ação não pode ser desfeita.")) return;
  poupatempos = poupatempos.filter((p) => p.id !== id);
  usuarios = usuarios.filter((u) => u.poupatempoId !== id);
  salvarPoupatempos();
  salvarUsuarios();
  atualizarTabelaPoupatempos();
  popularSelectFiltroAdmin();
}

function popularSelectFiltroAdmin() {
  const select = document.getElementById("filtroPoupatempoAdmin");
  select.innerHTML = '<option value="">Todos</option>';
  poupatempos.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.nome;
    select.appendChild(opt);
  });
}

function atualizarTabelaRegistrosAdmin(filtrados = null) {
  const tbody = document.querySelector("#tabelaRegistrosAdmin tbody");
  tbody.innerHTML = "";

  const lista = filtrados || registros;

  if (!lista.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "text-center text-muted";
    td.textContent = "Nenhum registro encontrado.";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    lista.forEach((reg) => {
      const poupatempo = obterPoupatempoPorId(reg.poupatempoId);
      const tr = document.createElement("tr");

      tr.appendChild(criarTd(poupatempo ? poupatempo.nome : "N/A"));
      tr.appendChild(criarTd(formatarData(reg.dataEdicao)));
      tr.appendChild(criarTd(formatarData(reg.dataRecebimento)));
      const tdQtd = criarTd(reg.quantidade);
      tdQtd.className = "text-end";
      tr.appendChild(tdQtd);
      tr.appendChild(criarTd(reg.observacoes || "-"));

      const tdAcoes = document.createElement("td");
      tdAcoes.className = "text-end";
      const btnExcluir = document.createElement("button");
      btnExcluir.className = "btn btn-sm btn-outline-danger";
      btnExcluir.textContent = "Excluir";
      btnExcluir.addEventListener("click", () => excluirRegistro(reg.id));
      tdAcoes.appendChild(btnExcluir);
      tr.appendChild(tdAcoes);

      tbody.appendChild(tr);
    });
  }

  atualizarResumoAdmin(lista);
}

function atualizarResumoAdmin(lista) {
  const el = document.getElementById("resumoRegistrosAdmin");
  const total = lista.length;
  const totalExemplares = lista.reduce((soma, reg) => soma + Number(reg.quantidade || 0), 0);
  if (!total) {
    el.textContent = "Nenhum registro cadastrado.";
  } else {
    el.textContent = `Total: ${total} registro(s) | ${totalExemplares} exemplar(es) recebido(s)`;
  }
}

function aplicarFiltrosAdmin() {
  const filtroPoupa = document.getElementById("filtroPoupatempoAdmin").value;
  const filtroDataEd = document.getElementById("filtroDataEdicaoAdmin").value;

  let lista = [...registros];

  if (filtroPoupa) {
    lista = lista.filter((r) => r.poupatempoId === filtroPoupa);
  }

  if (filtroDataEd) {
    lista = lista.filter((r) => r.dataEdicao === filtroDataEd);
  }

  atualizarTabelaRegistrosAdmin(lista);
}

function limparFiltrosAdmin() {
  document.getElementById("filtroPoupatempoAdmin").value = "";
  document.getElementById("filtroDataEdicaoAdmin").value = "";
  atualizarTabelaRegistrosAdmin();
}

function exportarPoupatemposCsv() {
  if (!poupatempos.length) {
    alert("Não há Poupatempos para exportar.");
    return;
  }

  const cabecalho = ["Nome", "Endereco", "Responsavel", "Email", "Quantidade_Esperada"];
  const linhas = poupatempos.map((p) => [
    p.nome,
    p.endereco,
    p.responsavelNome,
    p.responsavelEmail,
    p.quantidadeEsperada,
  ]);

  const conteudo = [cabecalho, ...linhas]
    .map((cols) => cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  downloadCsv(conteudo, `poupatempos_${new Date().toISOString().slice(0, 10)}.csv`);
}

function exportarRegistrosCsvAdmin() {
  if (!registros.length) {
    alert("Não há registros para exportar.");
    return;
  }

  const cabecalho = ["Poupatempo", "Data_Edicao", "Data_Recebimento", "Quantidade", "Observacoes"];
  const linhas = registros.map((r) => {
    const poupatempo = obterPoupatempoPorId(r.poupatempoId);
    return [
      poupatempo ? poupatempo.nome : "N/A",
      r.dataEdicao,
      r.dataRecebimento,
      r.quantidade,
      (r.observacoes || "").replace(/"/g, '""'),
    ];
  });

  const conteudo = [cabecalho, ...linhas]
    .map((cols) => cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  downloadCsv(conteudo, `registros_diario_oficial_${new Date().toISOString().slice(0, 10)}.csv`);
}

function downloadCsv(conteudo, nomeArquivo) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ========== INTERFACE - FUNCIONÁRIO ==========
function configurarFuncionario() {
  const formRecebimento = document.getElementById("recebimentoForm");

  formRecebimento.addEventListener("submit", (e) => {
    e.preventDefault();

    const dataEdicao = document.getElementById("dataEdicao").value;
    const dataRecebimento = document.getElementById("dataRecebimento").value;
    const quantidade = document.getElementById("quantidade").value;
    const observacoes = document.getElementById("observacoes").value.trim();

    if (!dataEdicao || !dataRecebimento || !quantidade) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const novo = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      poupatempoId: usuarioLogado.poupatempoId,
      dataEdicao,
      dataRecebimento,
      quantidade: Number(quantidade),
      observacoes,
      criadoEm: new Date().toISOString(),
    };

    registros.push(novo);
    registros.sort((a, b) => b.dataEdicao.localeCompare(a.dataEdicao));
    salvarRegistros();
    atualizarTabelaRegistrosFuncionario();

    formRecebimento.reset();
    alert("Registro salvo com sucesso!");
  });
}

function atualizarTabelaRegistrosFuncionario() {
  const tbody = document.querySelector("#tabelaRegistros tbody");
  tbody.innerHTML = "";

  const meusRegistros = registros.filter((r) => r.poupatempoId === usuarioLogado.poupatempoId);

  if (!meusRegistros.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.className = "text-center text-muted";
    td.textContent = "Nenhum registro encontrado.";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    meusRegistros.forEach((reg) => {
      const tr = document.createElement("tr");

      tr.appendChild(criarTd(formatarData(reg.dataEdicao)));
      tr.appendChild(criarTd(formatarData(reg.dataRecebimento)));
      const tdQtd = criarTd(reg.quantidade);
      tdQtd.className = "text-end";
      tr.appendChild(tdQtd);
      tr.appendChild(criarTd(reg.observacoes || "-"));

      const tdAcoes = document.createElement("td");
      tdAcoes.className = "text-end";
      const btnExcluir = document.createElement("button");
      btnExcluir.className = "btn btn-sm btn-outline-danger";
      btnExcluir.textContent = "Excluir";
      btnExcluir.addEventListener("click", () => excluirRegistro(reg.id));
      tdAcoes.appendChild(btnExcluir);
      tr.appendChild(tdAcoes);

      tbody.appendChild(tr);
    });
  }

  atualizarResumoFuncionario(meusRegistros);
}

function atualizarResumoFuncionario(lista) {
  const el = document.getElementById("resumoRegistros");
  const total = lista.length;
  const totalExemplares = lista.reduce((soma, reg) => soma + Number(reg.quantidade || 0), 0);
  if (!total) {
    el.textContent = "Nenhum registro cadastrado.";
  } else {
    el.textContent = `Total: ${total} registro(s) | ${totalExemplares} exemplar(es) recebido(s)`;
  }
}

function excluirRegistro(id) {
  if (!confirm("Confirma a exclusão deste registro?")) return;
  registros = registros.filter((r) => r.id !== id);
  salvarRegistros();
  if (usuarioLogado.tipo === "admin") {
    aplicarFiltrosAdmin();
  } else {
    atualizarTabelaRegistrosFuncionario();
  }
}

function formatarData(yyyyMmDd) {
  if (!yyyyMmDd) return "-";
  const [ano, mes, dia] = yyyyMmDd.split("-");
  return `${dia}/${mes}/${ano}`;
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener("DOMContentLoaded", () => {
  carregarUsuarios();
  carregarPoupatempos();
  carregarRegistros();

  configurarLogin();
  configurarAdmin();
  configurarFuncionario();

  // Verificar se já existe sessão ativa
  const sessao = carregarSessao();
  if (sessao) {
    if (sessao.tipo === "admin") {
      mostrarTelaAdmin();
    } else {
      mostrarTelaFuncionario();
    }
  } else {
    mostrarTelaLogin();
  }
});
