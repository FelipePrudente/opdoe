// Chaves de armazenamento
const STORAGE_KEY_USUARIOS = "gestao_diario_oficial_usuarios_v1";
const STORAGE_KEY_POUPATEMPOS = "gestao_diario_oficial_poupatempos_v1";
const STORAGE_KEY_REGISTROS = "gestao_diario_oficial_registros_v1";
const STORAGE_KEY_SESSAO = "gestao_diario_oficial_sessao_v1";
const STORAGE_KEY_INVESTIMENTOS = "gestao_diario_oficial_investimentos_v1";
const STORAGE_KEY_RECEITAS = "gestao_diario_oficial_receitas_v1";
const STORAGE_KEY_PARCEIROS = "gestao_diario_oficial_parceiros_v1";
const STORAGE_KEY_SERVICOS_PARCEIROS = "gestao_diario_oficial_servicos_parceiros_v1";
const STORAGE_KEY_FECHAMENTOS = "gestao_diario_oficial_fechamentos_v1";
const STORAGE_KEY_MENSAGENS = "gestao_diario_oficial_mensagens_v1";
const STORAGE_KEY_FATURAMENTO_ANUAL = "gestao_diario_oficial_faturamento_anual_v1";

// Dados globais
let usuarios = [];
let poupatempos = [];
let registros = [];
let investimentos = [];
let receitas = [];
let parceiros = [];
let servicosParceiros = [];
let fechamentos = [];
let mensagens = [];
let usuarioLogado = null;

// Verificar se as funções do Supabase já foram definidas
// Se sim, não definir as funções de localStorage para não sobrescrever
const funcoesSupabaseJaDefinidas = typeof carregarUsuarios === 'function' && 
                                    carregarUsuarios.constructor.name === 'AsyncFunction';

if (!funcoesSupabaseJaDefinidas) {
  console.log("⚠️ Definindo funções de localStorage (fallback)");
  
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
  // Verificar se já existe um Poupatempo com o mesmo nome
  const existeNome = poupatempos.some(
    (p) => p.nome.toLowerCase() === dados.nome.toLowerCase()
  );

  if (existeNome) {
    return { sucesso: false, mensagem: "Já existe um Poupatempo com este nome." };
  }

  // Verificar se os e-mails já estão cadastrados em outro Poupatempo
  const existeEmailGerente = poupatempos.some(
    (p) => p.gerenteEmail && p.gerenteEmail.toLowerCase() === dados.gerenteEmail.toLowerCase()
  );
  const existeEmailCoordenador = poupatempos.some(
    (p) => p.coordenadorEmail && p.coordenadorEmail.toLowerCase() === dados.coordenadorEmail.toLowerCase()
  );

  if (existeEmailGerente) {
    return { sucesso: false, mensagem: "O e-mail do gerente já está cadastrado em outro Poupatempo." };
  }

  if (existeEmailCoordenador) {
    return { sucesso: false, mensagem: "O e-mail do coordenador já está cadastrado em outro Poupatempo." };
  }

  const novo = {
    id: `poupa-${Date.now()}`,
    nome: dados.nome.trim(),
    cep: dados.cep ? dados.cep.replace(/\D/g, "") : "",
    endereco: dados.endereco.trim(),
    telefone: dados.telefone ? dados.telefone.trim() : "",
    gerenteNome: dados.gerenteNome.trim(),
    gerenteEmail: dados.gerenteEmail.toLowerCase().trim(),
    coordenadorNome: dados.coordenadorNome.trim(),
    coordenadorEmail: dados.coordenadorEmail.toLowerCase().trim(),
    quantidadeEsperada: Number(dados.quantidadeEsperada),
    criadoEm: new Date().toISOString(),
  };

  poupatempos.push(novo);
  salvarPoupatempos();

  // Criar usuários funcionários com as senhas definidas pelo administrador
  criarUsuarioFuncionario(novo.gerenteEmail, dados.gerenteSenha, novo.gerenteNome, novo.id);
  criarUsuarioFuncionario(novo.coordenadorEmail, dados.coordenadorSenha, novo.coordenadorNome, novo.id);

  return {
    sucesso: true,
    mensagem: "Poupatempo cadastrado com sucesso!",
    poupatempo: novo,
  };
}

function atualizarPoupatempo(id, dados) {
  const index = poupatempos.findIndex((p) => p.id === id);
  if (index === -1) {
    return { sucesso: false, mensagem: "Poupatempo não encontrado." };
  }

  const poupatempoAtual = poupatempos[index];

  // Verificar se já existe outro Poupatempo com o mesmo nome (exceto o atual)
  const existeNome = poupatempos.some(
    (p) => p.id !== id && p.nome.toLowerCase() === dados.nome.toLowerCase()
  );

  if (existeNome) {
    return { sucesso: false, mensagem: "Já existe outro Poupatempo com este nome." };
  }

  // Verificar se os e-mails já estão cadastrados em outro Poupatempo (exceto o atual)
  const existeEmailGerente = poupatempos.some(
    (p) => p.id !== id && p.gerenteEmail && p.gerenteEmail.toLowerCase() === dados.gerenteEmail.toLowerCase()
  );
  const existeEmailCoordenador = poupatempos.some(
    (p) => p.id !== id && p.coordenadorEmail && p.coordenadorEmail.toLowerCase() === dados.coordenadorEmail.toLowerCase()
  );

  if (existeEmailGerente) {
    return { sucesso: false, mensagem: "O e-mail do gerente já está cadastrado em outro Poupatempo." };
  }

  if (existeEmailCoordenador) {
    return { sucesso: false, mensagem: "O e-mail do coordenador já está cadastrado em outro Poupatempo." };
  }

  // Verificar se os e-mails mudaram
  const emailGerenteMudou = poupatempoAtual.gerenteEmail?.toLowerCase() !== dados.gerenteEmail.toLowerCase().trim();
  const emailCoordenadorMudou = poupatempoAtual.coordenadorEmail?.toLowerCase() !== dados.coordenadorEmail.toLowerCase().trim();
  
  // Atualizar dados do Poupatempo
  poupatempos[index] = {
    ...poupatempoAtual,
    nome: dados.nome.trim(),
    cep: dados.cep ? dados.cep.replace(/\D/g, "") : "",
    endereco: dados.endereco.trim(),
    telefone: dados.telefone ? dados.telefone.trim() : "",
    gerenteNome: dados.gerenteNome.trim(),
    gerenteEmail: dados.gerenteEmail.toLowerCase().trim(),
    coordenadorNome: dados.coordenadorNome.trim(),
    coordenadorEmail: dados.coordenadorEmail.toLowerCase().trim(),
    quantidadeEsperada: Number(dados.quantidadeEsperada),
  };

  salvarPoupatempos();

  // Atualizar usuários funcionários
  // Gerente
  const funcionarioGerente = usuarios.find((u) => u.poupatempoId === id && u.email === (poupatempoAtual.gerenteEmail || poupatempoAtual.responsavelEmail)?.toLowerCase());
  if (funcionarioGerente) {
    if (emailGerenteMudou) {
      funcionarioGerente.email = dados.gerenteEmail.toLowerCase().trim();
    }
    funcionarioGerente.nome = dados.gerenteNome.trim();
    // Se uma nova senha foi informada, atualizar
    if (dados.gerenteSenha && dados.gerenteSenha.trim() !== "") {
      funcionarioGerente.senha = dados.gerenteSenha;
    }
  } else if (emailGerenteMudou || !funcionarioGerente) {
    // Criar novo usuário se não existir (usar senha informada ou gerar uma padrão)
    const senhaGerente = dados.gerenteSenha && dados.gerenteSenha.trim() !== "" ? dados.gerenteSenha : `poupa${Date.now().toString().slice(-6)}`;
    criarUsuarioFuncionario(dados.gerenteEmail.toLowerCase().trim(), senhaGerente, dados.gerenteNome.trim(), id);
  }

  // Coordenador
  const funcionarioCoordenador = usuarios.find((u) => u.poupatempoId === id && u.email === poupatempoAtual.coordenadorEmail?.toLowerCase());
  if (funcionarioCoordenador) {
    if (emailCoordenadorMudou) {
      funcionarioCoordenador.email = dados.coordenadorEmail.toLowerCase().trim();
    }
    funcionarioCoordenador.nome = dados.coordenadorNome.trim();
    // Se uma nova senha foi informada, atualizar
    if (dados.coordenadorSenha && dados.coordenadorSenha.trim() !== "") {
      funcionarioCoordenador.senha = dados.coordenadorSenha;
    }
  } else if (emailCoordenadorMudou || !funcionarioCoordenador) {
    // Criar novo usuário se não existir (usar senha informada ou gerar uma padrão)
    const senhaCoordenador = dados.coordenadorSenha && dados.coordenadorSenha.trim() !== "" ? dados.coordenadorSenha : `poupa${(Date.now() + 1).toString().slice(-6)}`;
    criarUsuarioFuncionario(dados.coordenadorEmail.toLowerCase().trim(), senhaCoordenador, dados.coordenadorNome.trim(), id);
  }

  salvarUsuarios();

  return {
    sucesso: true,
    mensagem: "Poupatempo atualizado com sucesso!",
    poupatempo: poupatempos[index],
  };
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

// ========== GERENCIAMENTO DE INVESTIMENTOS ==========
function carregarInvestimentos() {
  const salvo = localStorage.getItem(STORAGE_KEY_INVESTIMENTOS);
  if (!salvo) {
    investimentos = [];
    return;
  }
  try {
    investimentos = JSON.parse(salvo) || [];
  } catch {
    investimentos = [];
  }
}

function salvarInvestimentos() {
  localStorage.setItem(STORAGE_KEY_INVESTIMENTOS, JSON.stringify(investimentos));
}

function cadastrarInvestimento(dados) {
  // Verificar se já existe investimento para o mesmo ano
  const existeAno = investimentos.some((i) => i.ano === Number(dados.ano));
  if (existeAno) {
    return { sucesso: false, mensagem: "Já existe um investimento cadastrado para este ano." };
  }

  const novo = {
    id: `inv-${Date.now()}`,
    ano: Number(dados.ano),
    operacional: Number(dados.operacional),
    impressao: Number(dados.impressao),
    distribuicao: Number(dados.distribuicao),
    criadoEm: new Date().toISOString(),
  };
  investimentos.push(novo);
  salvarInvestimentos();
  return { sucesso: true, mensagem: "Investimento cadastrado com sucesso!" };
}

function excluirInvestimento(id) {
  investimentos = investimentos.filter((i) => i.id !== id);
  salvarInvestimentos();
}

// ========== GERENCIAMENTO DE RECEITAS ==========
function carregarReceitas() {
  const salvo = localStorage.getItem(STORAGE_KEY_RECEITAS);
  if (!salvo) {
    receitas = [];
    return;
  }
  try {
    receitas = JSON.parse(salvo) || [];
  } catch {
    receitas = [];
  }
}

function salvarReceitas() {
  localStorage.setItem(STORAGE_KEY_RECEITAS, JSON.stringify(receitas));
}

function cadastrarReceita(dados) {
  const novo = {
    id: `rec-${Date.now()}`,
    data: dados.data,
    faturamento: Number(dados.faturamento),
    totalPedidos: Number(dados.totalPedidos),
    criadoEm: new Date().toISOString(),
  };
  receitas.push(novo);
  receitas.sort((a, b) => b.data.localeCompare(a.data));
  salvarReceitas();
  return { sucesso: true, mensagem: "Receita cadastrada com sucesso!" };
}

function excluirReceita(id) {
  receitas = receitas.filter((r) => r.id !== id);
  salvarReceitas();
}

// ========== GERENCIAMENTO DE FATURAMENTO ANUAL (REFERÊNCIA) ==========
function carregarFaturamentosAnuais() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY_FATURAMENTO_ANUAL);
    faturamentosAnuais = salvo ? JSON.parse(salvo) : [];
  } catch {
    faturamentosAnuais = [];
  }
}

function obterFaturamentoAno(ano) {
  const fa = (typeof faturamentosAnuais !== "undefined" ? faturamentosAnuais : []).find((f) => f && (f.ano === ano || f.ano === String(ano)));
  return fa != null ? Number(fa.valor || 0) : null;
}

function cadastrarFaturamentoAnual(dados) {
  const a = (typeof faturamentosAnuais !== "undefined" ? faturamentosAnuais : []);
  const ano = Number(dados.ano);
  const valor = Number(dados.valor);
  const idx = a.findIndex((f) => f && (f.ano === ano || f.ano === String(ano)));
  const reg = { id: `fat-${Date.now()}`, ano, valor, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() };
  if (idx >= 0) {
    reg.id = a[idx].id;
    a[idx] = reg;
  } else {
    a.push(reg);
  }
  a.sort((x, y) => (y.ano || 0) - (x.ano || 0));
  faturamentosAnuais = a;
  localStorage.setItem(STORAGE_KEY_FATURAMENTO_ANUAL, JSON.stringify(faturamentosAnuais));
  return { sucesso: true, mensagem: idx >= 0 ? "Faturamento do ano " + ano + " atualizado com sucesso!" : "Faturamento do ano " + ano + " cadastrado com sucesso!" };
}

function excluirFaturamentoAnual(id) {
  faturamentosAnuais = (faturamentosAnuais || []).filter((f) => f && f.id !== id);
  localStorage.setItem(STORAGE_KEY_FATURAMENTO_ANUAL, JSON.stringify(faturamentosAnuais || []));
}

// ========== GERENCIAMENTO DE PARCEIROS ==========
function carregarParceiros() {
  const salvo = localStorage.getItem(STORAGE_KEY_PARCEIROS);
  if (!salvo) {
    parceiros = [];
    return;
  }
  try {
    parceiros = JSON.parse(salvo) || [];
  } catch {
    parceiros = [];
  }
}

function salvarParceiros() {
  localStorage.setItem(STORAGE_KEY_PARCEIROS, JSON.stringify(parceiros));
}

function cadastrarParceiro(dados) {
  // Verificar se já existe um Parceiro com o mesmo nome
  const existeNome = parceiros.some(
    (p) => p.nome.toLowerCase() === dados.nome.toLowerCase()
  );

  if (existeNome) {
    return { sucesso: false, mensagem: "Já existe um Parceiro com este nome." };
  }

  // Verificar se o e-mail já está cadastrado
  const existeEmail = parceiros.some(
    (p) => p.responsavelEmail.toLowerCase() === dados.responsavelEmail.toLowerCase()
  );

  if (existeEmail) {
    return { sucesso: false, mensagem: "Este e-mail já está cadastrado em outro Parceiro." };
  }

  const novo = {
    id: `parc-${Date.now()}`,
    nome: dados.nome.trim(),
    cep: dados.cep ? dados.cep.replace(/\D/g, "") : "",
    endereco: dados.endereco.trim(),
    servicosContratados: dados.servicosContratados.trim(),
    responsavelNome: dados.responsavelNome.trim(),
    responsavelEmail: dados.responsavelEmail.toLowerCase().trim(),
    criadoEm: new Date().toISOString(),
  };

  parceiros.push(novo);
  salvarParceiros();

  // Criar usuário parceiro automaticamente
  criarUsuarioParceiro(novo.responsavelEmail, dados.responsavelSenha, novo.responsavelNome, novo.id);

  return {
    sucesso: true,
    mensagem: "Parceiro cadastrado com sucesso!",
    parceiro: novo,
  };
}

function criarUsuarioParceiro(email, senha, nome, parceiroId) {
  const novo = {
    id: `parc-user-${Date.now()}`,
    tipo: "parceiro",
    email: email.toLowerCase().trim(),
    senha: senha,
    nome: nome.trim(),
    parceiroId: parceiroId,
    criadoEm: new Date().toISOString(),
  };
  usuarios.push(novo);
  salvarUsuarios();
  return novo;
}

function atualizarParceiro(id, dados) {
  const index = parceiros.findIndex((p) => p.id === id);
  if (index === -1) {
    return { sucesso: false, mensagem: "Parceiro não encontrado." };
  }

  const parceiroAtual = parceiros[index];

  // Verificar se já existe outro Parceiro com o mesmo nome (exceto o atual)
  const existeNome = parceiros.some(
    (p) => p.id !== id && p.nome.toLowerCase() === dados.nome.toLowerCase()
  );

  if (existeNome) {
    return { sucesso: false, mensagem: "Já existe outro Parceiro com este nome." };
  }

  // Verificar se o e-mail já está cadastrado em outro Parceiro (exceto o atual)
  const existeEmail = parceiros.some(
    (p) => p.id !== id && p.responsavelEmail.toLowerCase() === dados.responsavelEmail.toLowerCase()
  );

  if (existeEmail) {
    return { sucesso: false, mensagem: "Este e-mail já está cadastrado em outro Parceiro." };
  }

  // Verificar se o e-mail mudou
  const emailMudou = parceiroAtual.responsavelEmail?.toLowerCase() !== dados.responsavelEmail.toLowerCase().trim();
  
  // Atualizar dados do Parceiro
  parceiros[index] = {
    ...parceiroAtual,
    nome: dados.nome.trim(),
    cep: dados.cep ? dados.cep.replace(/\D/g, "") : "",
    endereco: dados.endereco.trim(),
    servicosContratados: dados.servicosContratados.trim(),
    responsavelNome: dados.responsavelNome.trim(),
    responsavelEmail: dados.responsavelEmail.toLowerCase().trim(),
  };

  salvarParceiros();

  // Atualizar usuário parceiro
  const usuarioParceiro = usuarios.find((u) => u.parceiroId === id && u.tipo === "parceiro");
  if (usuarioParceiro) {
    if (emailMudou) {
      usuarioParceiro.email = dados.responsavelEmail.toLowerCase().trim();
    }
    usuarioParceiro.nome = dados.responsavelNome.trim();
    // Se uma nova senha foi informada, atualizar
    if (dados.responsavelSenha && dados.responsavelSenha.trim() !== "") {
      usuarioParceiro.senha = dados.responsavelSenha;
    }
  } else if (emailMudou || !usuarioParceiro) {
    // Criar novo usuário se não existir
    const senhaParceiro = dados.responsavelSenha && dados.responsavelSenha.trim() !== "" ? dados.responsavelSenha : `parc${Date.now().toString().slice(-6)}`;
    criarUsuarioParceiro(dados.responsavelEmail.toLowerCase().trim(), senhaParceiro, dados.responsavelNome.trim(), id);
  }

  salvarUsuarios();

  return {
    sucesso: true,
    mensagem: "Parceiro atualizado com sucesso!",
    parceiro: parceiros[index],
  };
}

// ========== GERENCIAMENTO DE SERVIÇOS PRESTADOS POR PARCEIROS ==========
function carregarServicosParceiros() {
  const salvo = localStorage.getItem(STORAGE_KEY_SERVICOS_PARCEIROS);
  if (!salvo) {
    servicosParceiros = [];
    return;
  }
  try {
    servicosParceiros = JSON.parse(salvo) || [];
  } catch {
    servicosParceiros = [];
  }
}

function salvarServicosParceiros() {
  localStorage.setItem(STORAGE_KEY_SERVICOS_PARCEIROS, JSON.stringify(servicosParceiros));
}

function cadastrarServicoParceiro(dados) {
  const novo = {
    id: `serv-parc-${Date.now()}`,
    parceiroId: dados.parceiroId,
    data: dados.data,
    servicoPrestado: dados.servicoPrestado.trim(),
    quantidade: Number(dados.quantidade),
    quantidadePaginas: Number(dados.quantidadePaginas) || 0,
    valorNota: Number(dados.valorNota),
    observacao: dados.observacao || "",
    pdfNotaFiscal: dados.pdfNotaFiscal || null,
    nomeArquivoPdf: dados.nomeArquivoPdf || null,
    criadoEm: new Date().toISOString(),
  };
  servicosParceiros.push(novo);
  salvarServicosParceiros();
  return { sucesso: true, mensagem: "Serviço cadastrado com sucesso!", servico: novo };
}

function obterServicosPorParceiro(parceiroId) {
  return servicosParceiros.filter((s) => s.parceiroId === parceiroId);
}

function excluirServicoParceiro(id) {
  const servico = servicosParceiros.find((s) => s.id === id);
  if (!servico) {
    return { sucesso: false, mensagem: "Serviço não encontrado." };
  }

  const fechAprov = servico.fechamentoAprovado ?? servico.fechamento_aprovado;
  const fechPend = servico.fechamentoPendente ?? servico.fechamento_pendente;
  if (fechAprov || fechPend) {
    return { sucesso: false, mensagem: "Não é possível excluir um serviço que está em fechamento aprovado ou pendente." };
  }

  servicosParceiros = servicosParceiros.filter((s) => s.id !== id);
  salvarServicosParceiros();
  return { sucesso: true, mensagem: "Serviço excluído com sucesso!" };
}

function obterServicoPorId(id) {
  return servicosParceiros.find((s) => s.id === id);
}

// ========== GERENCIAMENTO DE FECHAMENTOS ==========
function carregarFechamentos() {
  const salvo = localStorage.getItem(STORAGE_KEY_FECHAMENTOS);
  if (!salvo) {
    fechamentos = [];
    return;
  }
  try {
    fechamentos = JSON.parse(salvo) || [];
  } catch {
    fechamentos = [];
  }
}

function salvarFechamentos() {
  localStorage.setItem(STORAGE_KEY_FECHAMENTOS, JSON.stringify(fechamentos));
}

function criarFechamento(parceiroId, servicosIds) {
  // Verificar se algum serviço já está em fechamento pendente ou aprovado
  const servicosInvalidos = servicosIds.filter((id) => {
    const servico = servicosParceiros.find((s) => s.id === id);
    return servico && (servico.fechamentoPendente || servico.fechamentoAprovado);
  });

  if (servicosInvalidos.length > 0) {
    return { sucesso: false, mensagem: "Alguns serviços selecionados já estão em fechamento." };
  }

  // Calcular totais
  const servicos = servicosIds.map((id) => servicosParceiros.find((s) => s.id === id)).filter(Boolean);
  const valorTotal = servicos.reduce((sum, s) => sum + s.valorNota, 0);
  const quantidadeTotal = servicos.reduce((sum, s) => sum + s.quantidade, 0);

  const novo = {
    id: `fech-${Date.now()}`,
    parceiroId: parceiroId,
    servicosIds: servicosIds,
    quantidadeTotal: quantidadeTotal,
    valorTotal: valorTotal,
    status: "pendente", // pendente, aprovado, rejeitado
    criadoEm: new Date().toISOString(),
    aprovadoEm: null,
    aprovadoPor: null,
  };

  fechamentos.push(novo);
  salvarFechamentos();

  // Marcar serviços como pendentes
  servicosIds.forEach((id) => {
    const servico = servicosParceiros.find((s) => s.id === id);
    if (servico) {
      servico.fechamentoPendente = novo.id;
      servico.fechamentoId = novo.id;
    }
  });
  salvarServicosParceiros();

  return { sucesso: true, mensagem: "Fechamento criado com sucesso!", fechamento: novo };
}

function obterFechamentosPendentes() {
  return fechamentos.filter((f) => f.status === "pendente");
}

function obterFechamentosAprovados() {
  return fechamentos.filter((f) => f.status === "aprovado");
}

function obterFechamentosPorParceiro(parceiroId) {
  return fechamentos.filter((f) => f.parceiroId === parceiroId);
}

function aprovarFechamento(fechamentoId) {
  const fechamento = fechamentos.find((f) => f.id === fechamentoId);
  if (!fechamento) {
    return { sucesso: false, mensagem: "Fechamento não encontrado." };
  }

  if (fechamento.status !== "pendente") {
    return { sucesso: false, mensagem: "Este fechamento já foi processado." };
  }

  fechamento.status = "aprovado";
  fechamento.aprovadoEm = new Date().toISOString();
  fechamento.aprovadoPor = usuarioLogado.id;

  // Marcar serviços como aprovados
  fechamento.servicosIds.forEach((id) => {
    const servico = servicosParceiros.find((s) => s.id === id);
    if (servico) {
      servico.fechamentoAprovado = true;
      servico.fechamentoPendente = false;
    }
  });

  salvarFechamentos();
  salvarServicosParceiros();

  return { sucesso: true, mensagem: "Fechamento aprovado com sucesso!" };
}

function rejeitarFechamento(fechamentoId) {
  const fechamento = fechamentos.find((f) => f.id === fechamentoId);
  if (!fechamento) {
    return { sucesso: false, mensagem: "Fechamento não encontrado." };
  }

  if (fechamento.status !== "pendente") {
    return { sucesso: false, mensagem: "Este fechamento já foi processado." };
  }

  fechamento.status = "rejeitado";
  fechamento.aprovadoEm = new Date().toISOString();
  fechamento.aprovadoPor = usuarioLogado.id;

  // Remover marcação de pendente dos serviços
  fechamento.servicosIds.forEach((id) => {
    const servico = servicosParceiros.find((s) => s.id === id);
    if (servico) {
      servico.fechamentoPendente = false;
      servico.fechamentoId = null;
    }
  });

  salvarFechamentos();
  salvarServicosParceiros();

  return { sucesso: true, mensagem: "Fechamento rejeitado." };
}

// ========== GERENCIAMENTO DE MENSAGENS ==========
function carregarMensagens() {
  const salvo = localStorage.getItem(STORAGE_KEY_MENSAGENS);
  if (!salvo) {
    mensagens = [];
    return;
  }
  try {
    mensagens = JSON.parse(salvo) || [];
  } catch {
    mensagens = [];
  }
}

function salvarMensagens() {
  localStorage.setItem(STORAGE_KEY_MENSAGENS, JSON.stringify(mensagens));
}

function enviarMensagem(dados) {
  const novaMensagem = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    remetenteId: dados.remetenteId,
    remetenteNome: dados.remetenteNome,
    remetenteEmail: dados.remetenteEmail,
    remetenteTipo: dados.remetenteTipo,
    destinatarios: dados.destinatarios, // Array de IDs ou "todos"
    assunto: dados.assunto.trim(),
    mensagem: dados.mensagem.trim(),
    criadoEm: new Date().toISOString(),
    lidaPor: [], // Array de IDs de usuários que leram
    respostaPara: dados.respostaPara || null, // ID da mensagem original se for resposta
  };

  mensagens.push(novaMensagem);
  salvarMensagens();

  return { sucesso: true, mensagem: "Mensagem enviada com sucesso!", mensagemObj: novaMensagem };
}

function obterMensagensRecebidas(usuarioId) {
  return mensagens.filter((msg) => {
    if (msg.destinatarios === "todos") {
      return msg.remetenteId !== usuarioId; // Não mostrar mensagens próprias enviadas para todos
    }
    return Array.isArray(msg.destinatarios) && msg.destinatarios.includes(usuarioId);
  }).sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
}

function obterMensagensEnviadas(usuarioId) {
  return mensagens.filter((msg) => msg.remetenteId === usuarioId)
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
}

function obterMensagensNaoLidas(usuarioId) {
  return mensagens.filter((msg) => {
    const foiEnviadaParaUsuario = msg.destinatarios === "todos" || 
      (Array.isArray(msg.destinatarios) && msg.destinatarios.includes(usuarioId));
    const naoFoiLida = !msg.lidaPor || !msg.lidaPor.includes(usuarioId);
    return foiEnviadaParaUsuario && msg.remetenteId !== usuarioId && naoFoiLida;
  });
}

function marcarMensagemComoLida(mensagemId, usuarioId) {
  const mensagem = mensagens.find((m) => m.id === mensagemId);
  if (mensagem) {
    if (!mensagem.lidaPor) {
      mensagem.lidaPor = [];
    }
    if (!mensagem.lidaPor.includes(usuarioId)) {
      mensagem.lidaPor.push(usuarioId);
      salvarMensagens();
    }
  }
}

} // Fim do bloco if (!funcoesSupabaseJaDefinidas)

// ========== FUNÇÕES QUE DEVEM ESTAR SEMPRE DISPONÍVEIS ==========
// Estas funções não dependem do tipo de armazenamento (Supabase ou localStorage)

function obterPoupatempoPorId(id) {
  return (poupatempos || []).find((p) => p.id === id);
}

function obterPoupatempoPorEmail(email) {
  const funcionario = (usuarios || []).find(
    (u) => u.tipo === "funcionario" && u.email === email.toLowerCase()
  );
  if (!funcionario) return null;
  const id = funcionario.poupatempoId ?? funcionario.poupatempo_id;
  return obterPoupatempoPorId(id);
}

function obterMensagemPorId(mensagemId) {
  return (mensagens || []).find((m) => m.id === mensagemId);
}

function excluirMensagem(mensagemId) {
  mensagens = (mensagens || []).filter((m) => m.id !== mensagemId);
  salvarMensagens();
  return { sucesso: true, mensagem: "Mensagem excluída com sucesso!" };
}

function excluirMensagens(mensagemIds) {
  if (!Array.isArray(mensagemIds) || mensagemIds.length === 0) {
    return { sucesso: false, mensagem: "Nenhuma mensagem selecionada." };
  }
  mensagens = (mensagens || []).filter((m) => !mensagemIds.includes(m.id));
  salvarMensagens();
  return { sucesso: true, mensagem: `${mensagemIds.length} mensagem(ns) excluída(s) com sucesso!` };
}

function obterParceiroPorId(id) {
  return (parceiros || []).find((p) => p.id === id);
}

function obterTodosUsuariosParaMensagem() {
  const listaUsuarios = [];
  const us = usuarios || [];
  const pp = poupatempos || [];
  const pc = parceiros || [];

  us.filter((u) => u.tipo === "admin").forEach((admin) => {
    listaUsuarios.push({
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      tipo: "admin",
      tipoLabel: "Administrador",
      textoExibicao: `${admin.nome} (Administrador)`,
    });
  });

  us.filter((u) => u.tipo === "funcionario").forEach((func) => {
    const pid = func.poupatempoId ?? func.poupatempo_id;
    const poupatempo = pp.find((p) => p.id === pid);
    const poupaNome = poupatempo ? poupatempo.nome : "—";
    listaUsuarios.push({
      id: func.id,
      nome: func.nome,
      email: func.email,
      tipo: "funcionario",
      tipoLabel: `Funcionário - ${poupatempo ? poupatempo.nome : "N/A"}`,
      poupatempoNome: poupatempo ? poupatempo.nome : null,
      textoExibicao: `${func.nome} — ${poupaNome}`,
    });
  });

  pc.forEach((parc) => {
    const usuarioParceiro = us.find(
      (u) => (u.parceiroId === parc.id || u.parceiro_id === parc.id) && u.tipo === "parceiro"
    );
    if (usuarioParceiro) {
      listaUsuarios.push({
        id: usuarioParceiro.id,
        nome: parc.nome,
        email: parc.responsavelEmail ?? parc.responsavel_email,
        tipo: "parceiro",
        tipoLabel: `Parceiro - ${parc.nome}`,
        textoExibicao: `${parc.nome} (Parceiro)`,
      });
    }
  });

  return listaUsuarios;
}

/**
 * Retorna o texto de exibição dos destinatários de uma mensagem (para "Para:" em mensagens enviadas).
 * @param {string|string[]} destinatarios - "todos" ou array de IDs de usuário
 * @returns {string} Ex.: "Todos", "Maria — Poupatempo Centro, João (Administrador)", "—"
 */
function obterTextosDestinatarios(destinatarios) {
  if (destinatarios == null) return "—";
  if (destinatarios === "todos") return "Todos";
  const arr = Array.isArray(destinatarios) ? destinatarios : [destinatarios];
  if (arr.includes("todos")) return "Todos";
  const ids = arr.filter((id) => id && id !== "todos");
  if (!ids.length) return "—";
  const lista = obterTodosUsuariosParaMensagem();
  const mapa = new Map(lista.map((u) => [u.id, u.textoExibicao]));
  const nomes = ids.map((id) => mapa.get(id) || String(id));
  return nomes.join(", ");
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
  } else if (tipo === "parceiro") {
    // Para parceiro, precisa de email e senha
    if (!email) {
      return { sucesso: false, mensagem: "Informe o e-mail." };
    }
    const usuario = usuarios.find(
      (u) => u.tipo === "parceiro" && u.email === email.toLowerCase() && u.senha === senha
    );
    if (!usuario) {
      return { sucesso: false, mensagem: "E-mail ou senha incorretos." };
    }
    salvarSessao(usuario);
    return { sucesso: true, usuario };
  }
  return { sucesso: false, mensagem: "Tipo de usuário inválido." };
}

// ========== VERIFICAÇÃO DE AUTENTICAÇÃO ==========
function verificarAutenticacao(tipoEsperado) {
  const sessao = carregarSessao();
  if (!sessao) {
    window.location.href = "login.html";
    return false;
  }
  if (tipoEsperado && sessao.tipo !== tipoEsperado) {
    limparSessao();
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// ========== UTILITÁRIOS ==========
function formatarData(yyyyMmDd) {
  if (!yyyyMmDd || typeof yyyyMmDd !== "string") return "-";
  const [ano, mes, dia] = yyyyMmDd.split("-");
  return `${dia}/${mes}/${ano}`;
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

// Inicializar dados ao carregar
// Verifica se está usando Supabase (funções assíncronas) ou localStorage (síncronas)
(async function inicializarDados() {
  try {
    // Aguardar um pouco para garantir que os scripts foram carregados
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Verifica se o Supabase está disponível E se as funções são assíncronas
    const usandoSupabase = (typeof window.supabaseClient !== 'undefined' && window.supabaseClient !== null) &&
                           typeof carregarUsuarios === 'function' && 
                           carregarUsuarios.constructor.name === 'AsyncFunction';
    
    if (usandoSupabase) {
      console.log("✅ Usando Supabase para armazenamento de dados");
      // Usando Supabase - funções assíncronas do supabase-db.js
      await carregarUsuarios();
      await carregarPoupatempos();
      await carregarRegistros();
      await carregarInvestimentos();
      await carregarReceitas();
      if (typeof carregarFaturamentosAnuais === "function") await carregarFaturamentosAnuais();
      await carregarParceiros();
      await carregarServicosParceiros();
      await carregarFechamentos();
      await carregarMensagens();
      if (typeof carregarConfirmacoesNaoRecebimento === 'function') {
        await carregarConfirmacoesNaoRecebimento();
      }
    } else {
      console.log("⚠️ Usando localStorage para armazenamento de dados");
      // Usando localStorage - funções síncronas
      if (typeof carregarUsuarios === 'function') {
        carregarUsuarios();
        carregarPoupatempos();
        carregarRegistros();
        carregarInvestimentos();
        carregarReceitas();
        if (typeof carregarFaturamentosAnuais === "function") carregarFaturamentosAnuais();
        carregarParceiros();
        carregarServicosParceiros();
        carregarFechamentos();
        carregarMensagens();
      }
    }
  } catch (error) {
    console.error("Erro ao inicializar dados:", error);
    // Continuar mesmo com erro para não quebrar a aplicação
  } finally {
    window.dadosInicializados = true;
    window.dispatchEvent(new CustomEvent("dadosInicializados"));
  }
})();