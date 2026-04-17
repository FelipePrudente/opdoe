// Funções de acesso ao banco de dados Supabase
// Este arquivo substitui as funções de localStorage por chamadas ao Supabase

// Função auxiliar para obter o cliente Supabase
function getSupabaseClient() {
  return window.supabaseClient || null;
}

// ========== GERENCIAMENTO DE USUÁRIOS ==========
async function carregarUsuarios() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase não inicializado");
      usuarios = [];
      return;
    }
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao carregar usuários:", error);
      usuarios = [];
      return;
    }

    usuarios = data || [];
    
    // Se não houver usuários, criar admin padrão
    if (usuarios.length === 0) {
      await criarAdminPadrao();
    }
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    usuarios = [];
  }
}

async function criarAdminPadrao() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  
  const adminPadrao = {
    id: "admin-1",
    tipo: "admin",
    email: "admin@diariooficial.sp.gov.br",
    senha: "admin123", // Em produção, usar hash
    nome: "Administrador",
    criado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("usuarios")
    .insert([adminPadrao])
    .select();

  if (!error && data) {
    usuarios = [data[0]];
  }
}

async function salvarUsuarios() {
  // No Supabase, não precisamos salvar tudo de uma vez
  // As operações individuais já são salvas automaticamente
  console.log("salvarUsuarios: No Supabase, os dados são salvos automaticamente nas operações individuais");
}

async function criarUsuarioAdmin(email, senha, nome) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  
  const novo = {
    id: `admin-${Date.now()}`,
    tipo: "admin",
    email: email.toLowerCase().trim(),
    senha: senha,
    nome: nome.trim(),
    criado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("usuarios")
    .insert([novo])
    .select();

  if (error) {
    console.error("Erro ao criar usuário admin:", error);
    return null;
  }

  if (data && data.length > 0) {
    usuarios.push(data[0]);
    return data[0];
  }

  return null;
}

// ========== GERENCIAMENTO DE POUPATEMPOS ==========
async function carregarPoupatempos() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      poupatempos = [];
      return;
    }
    const { data, error } = await supabase
      .from("poupatempos")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao carregar poupatempos:", error);
      poupatempos = [];
      return;
    }

    poupatempos = data || [];
  } catch (error) {
    console.error("Erro ao carregar poupatempos:", error);
    poupatempos = [];
  }
}

async function salvarPoupatempos() {
  console.log("salvarPoupatempos: No Supabase, os dados são salvos automaticamente nas operações individuais");
}

async function cadastrarPoupatempo(dados) {
  const existeNome = poupatempos.some(
    (p) => p.nome.toLowerCase() === dados.nome.toLowerCase()
  );
  const existeEmail = poupatempos.some(
    (p) => p.gerente_email?.toLowerCase() === dados.gerenteEmail.toLowerCase() ||
           p.coordenador_email?.toLowerCase() === dados.coordenadorEmail.toLowerCase()
  );

  if (existeNome) {
    return { sucesso: false, mensagem: "Já existe um Poupatempo com este nome." };
  }

  if (existeEmail) {
    return { sucesso: false, mensagem: "Este e-mail já está cadastrado em outro Poupatempo." };
  }

  // Verificar se os emails já existem na tabela de usuários
  const supabase = getSupabaseClient();
  if (supabase) {
    const gerenteEmail = dados.gerenteEmail.toLowerCase().trim();
    const coordenadorEmail = dados.coordenadorEmail.toLowerCase().trim();
    
    const { data: usuariosExistentes } = await supabase
      .from("usuarios")
      .select("email")
      .in("email", [gerenteEmail, coordenadorEmail]);
    
    if (usuariosExistentes && usuariosExistentes.length > 0) {
      const emailsExistentes = usuariosExistentes.map(u => u.email);
      if (emailsExistentes.includes(gerenteEmail) && emailsExistentes.includes(coordenadorEmail)) {
        return { sucesso: false, mensagem: "Os e-mails do gerente e coordenador já estão cadastrados no sistema." };
      } else if (emailsExistentes.includes(gerenteEmail)) {
        return { sucesso: false, mensagem: "O e-mail do gerente já está cadastrado no sistema." };
      } else if (emailsExistentes.includes(coordenadorEmail)) {
        return { sucesso: false, mensagem: "O e-mail do coordenador já está cadastrado no sistema." };
      }
    }
  }

  if (!supabase) {
    return { sucesso: false, mensagem: "Supabase não inicializado" };
  }

  const novo = {
    id: `poupa-${Date.now()}`,
    nome: dados.nome.trim(),
    cep: dados.cep?.trim() || null,
    endereco: dados.endereco.trim(),
    telefone: dados.telefone?.trim() || null,
    gerente_nome: dados.gerenteNome.trim(),
    gerente_email: dados.gerenteEmail.toLowerCase().trim(),
    gerente_senha: dados.gerenteSenha,
    coordenador_nome: dados.coordenadorNome.trim(),
    coordenador_email: dados.coordenadorEmail.toLowerCase().trim(),
    coordenador_senha: dados.coordenadorSenha,
    quantidade_esperada: Number(dados.quantidadeEsperada),
    criado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("poupatempos")
    .insert([novo])
    .select();

  if (error) {
    console.error("Erro ao cadastrar poupatempo:", error);
    return { sucesso: false, mensagem: "Erro ao cadastrar Poupatempo: " + error.message };
  }

  if (data && data.length > 0) {
    poupatempos.push(data[0]);
    
    // Criar usuários funcionários
    await criarUsuarioFuncionario(data[0].id, dados.gerenteNome, dados.gerenteEmail, dados.gerenteSenha, "gerente");
    await criarUsuarioFuncionario(data[0].id, dados.coordenadorNome, dados.coordenadorEmail, dados.coordenadorSenha, "coordenador");

    return { sucesso: true, mensagem: "Poupatempo cadastrado com sucesso!" };
  }

  return { sucesso: false, mensagem: "Erro ao cadastrar Poupatempo." };
}

async function atualizarPoupatempo(id, dados) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const atualizacao = {
    nome: dados.nome.trim(),
    cep: dados.cep?.trim() || null,
    endereco: dados.endereco.trim(),
    telefone: dados.telefone?.trim() || null,
    gerente_nome: dados.gerenteNome.trim(),
    gerente_email: dados.gerenteEmail.toLowerCase().trim(),
    coordenador_nome: dados.coordenadorNome.trim(),
    coordenador_email: dados.coordenadorEmail.toLowerCase().trim(),
    quantidade_esperada: Number(dados.quantidadeEsperada),
  };

  // Atualizar senhas apenas se fornecidas
  if (dados.gerenteSenha) {
    atualizacao.gerente_senha = dados.gerenteSenha;
  }
  if (dados.coordenadorSenha) {
    atualizacao.coordenador_senha = dados.coordenadorSenha;
  }

  const { data, error } = await supabase
    .from("poupatempos")
    .update(atualizacao)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Erro ao atualizar poupatempo:", error);
    return { sucesso: false, mensagem: "Erro ao atualizar Poupatempo: " + error.message };
  }

  if (data && data.length > 0) {
    const index = poupatempos.findIndex((p) => p.id === id);
    if (index !== -1) {
      poupatempos[index] = data[0];
    }
    return { sucesso: true, mensagem: "Poupatempo atualizado com sucesso!" };
  }

  return { sucesso: false, mensagem: "Erro ao atualizar Poupatempo." };
}

async function excluirPoupatempo(id) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const { error } = await supabase
    .from("poupatempos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir poupatempo:", error);
    return { sucesso: false, mensagem: "Erro ao excluir Poupatempo: " + error.message };
  }

  poupatempos = poupatempos.filter((p) => p.id !== id);
  return { sucesso: true, mensagem: "Poupatempo excluído com sucesso!" };
}

// ========== GERENCIAMENTO DE REGISTROS ==========
async function carregarRegistros() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase não inicializado");
      registros = [];
      return;
    }
    const { data, error } = await supabase
      .from("registros")
      .select("*")
      .order("data_edicao", { ascending: false });

    if (error) {
      console.error("Erro ao carregar registros:", error);
      registros = [];
      return;
    }

    registros = data || [];
  } catch (error) {
    console.error("Erro ao carregar registros:", error);
    registros = [];
  }
}

async function salvarRegistros() {
  console.log("salvarRegistros: No Supabase, os dados são salvos automaticamente nas operações individuais");
}

async function criarRegistro(dados) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const novo = {
    id: dados.id || `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    poupatempo_id: dados.poupatempoId,
    data_edicao: dados.dataEdicao,
    data_recebimento: dados.dataRecebimento || null,
    quantidade: Number(dados.quantidade),
    observacoes: dados.observacoes || null,
    criado_em: dados.criadoEm || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("registros")
    .insert([novo])
    .select();

  if (error) {
    console.error("Erro ao criar registro:", error);
    return { sucesso: false, mensagem: "Erro ao criar registro: " + error.message };
  }

  if (data && data.length > 0) {
    registros.push(data[0]);
    return { sucesso: true, mensagem: "Registro criado com sucesso!", registro: data[0] };
  }

  return { sucesso: false, mensagem: "Erro ao criar registro." };
}

async function excluirRegistro(id) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const { error } = await supabase
    .from("registros")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir registro:", error);
    return { sucesso: false, mensagem: "Erro ao excluir registro: " + error.message };
  }

  registros = registros.filter((r) => r.id !== id);
  return { sucesso: true, mensagem: "Registro excluído com sucesso!" };
}

// ========== GERENCIAMENTO DE DESCARTES ==========
async function carregarDescartes() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      if (typeof descartes !== "undefined") descartes = [];
      return;
    }
    const { data, error } = await supabase
      .from("descartes")
      .select("*")
      .order("data_descarte", { ascending: false });

    if (error) {
      console.error("Erro ao carregar descartes:", error);
      if (typeof descartes !== "undefined") descartes = [];
      return;
    }
    if (typeof descartes !== "undefined") descartes = data || [];
  } catch (error) {
    console.error("Erro ao carregar descartes:", error);
    if (typeof descartes !== "undefined") descartes = [];
  }
}

async function criarDescarte(dados) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const novo = {
    id: `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    poupatempo_id: dados.poupatempoId ?? dados.poupatempo_id,
    data_descarte: dados.dataDescarte ?? dados.data_descarte,
    quantidade: Number(dados.quantidade),
    motivo: dados.motivo?.trim() || null,
    observacoes: dados.observacoes?.trim() || null,
    criado_em: dados.criadoEm || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("descartes")
    .insert([novo])
    .select();

  if (error) {
    console.error("Erro ao criar descarte:", error);
    return { sucesso: false, mensagem: "Erro ao registrar descarte: " + error.message };
  }

  if (data && data.length > 0) {
    if (typeof descartes !== "undefined") {
      descartes = descartes || [];
      descartes.unshift(data[0]);
    }
    return { sucesso: true, mensagem: "Descarte registrado com sucesso!", descarte: data[0] };
  }

  return { sucesso: false, mensagem: "Erro ao registrar descarte." };
}

// ========== GERENCIAMENTO DE INVESTIMENTOS ==========
async function carregarInvestimentos() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase não inicializado");
      investimentos = [];
      return;
    }
    const { data, error } = await supabase
      .from("investimentos")
      .select("*")
      .order("ano", { ascending: false });

    if (error) {
      console.error("Erro ao carregar investimentos:", error);
      investimentos = [];
      return;
    }

    investimentos = data || [];
  } catch (error) {
    console.error("Erro ao carregar investimentos:", error);
    investimentos = [];
  }
}

async function salvarInvestimentos() {
  console.log("salvarInvestimentos: No Supabase, os dados são salvos automaticamente nas operações individuais");
}

async function cadastrarInvestimento(dados) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

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
    criado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("investimentos")
    .insert([novo])
    .select();

  if (error) {
    console.error("Erro ao cadastrar investimento:", error);
    return { sucesso: false, mensagem: "Erro ao cadastrar investimento: " + error.message };
  }

  if (data && data.length > 0) {
    investimentos.push(data[0]);
    return { sucesso: true, mensagem: "Investimento cadastrado com sucesso!" };
  }

  return { sucesso: false, mensagem: "Erro ao cadastrar investimento." };
}

async function excluirInvestimento(id) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("investimentos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir investimento:", error);
    return;
  }

  investimentos = investimentos.filter((i) => i.id !== id);
}

// ========== GERENCIAMENTO DE RECEITAS ==========
async function carregarReceitas() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase não inicializado");
      receitas = [];
      return;
    }
    const { data, error } = await supabase
      .from("receitas")
      .select("*")
      .order("data", { ascending: false });

    if (error) {
      console.error("Erro ao carregar receitas:", error);
      receitas = [];
      return;
    }

    receitas = data || [];
  } catch (error) {
    console.error("Erro ao carregar receitas:", error);
    receitas = [];
  }
}

async function salvarReceitas() {
  console.log("salvarReceitas: No Supabase, os dados são salvos automaticamente nas operações individuais");
}

async function cadastrarReceita(dados) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const novo = {
    id: `rec-${Date.now()}`,
    data: dados.data,
    faturamento: Number(dados.faturamento),
    total_pedidos: Number(dados.totalPedidos),
    criado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("receitas")
    .insert([novo])
    .select();

  if (error) {
    console.error("Erro ao cadastrar receita:", error);
    return { sucesso: false, mensagem: "Erro ao cadastrar receita: " + error.message };
  }

  if (data && data.length > 0) {
    receitas.push(data[0]);
    return { sucesso: true, mensagem: "Receita cadastrada com sucesso!" };
  }

  return { sucesso: false, mensagem: "Erro ao cadastrar receita." };
}

async function excluirReceita(id) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("receitas")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir receita:", error);
    return;
  }

  receitas = receitas.filter((r) => r.id !== id);
}

// ========== GERENCIAMENTO DE FATURAMENTO ANUAL (REFERÊNCIA) ==========
async function carregarFaturamentosAnuais() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn("Supabase não inicializado ao carregar faturamentos anuais");
      faturamentosAnuais = [];
      return;
    }
    
    const { data, error } = await supabase
      .from("faturamento_anual")
      .select("*")
      .order("ano", { ascending: false });

    if (error) {
      console.error("Erro ao carregar faturamentos anuais:", error);
      faturamentosAnuais = [];
      return;
    }
    faturamentosAnuais = data || [];
  } catch (err) {
    console.error("Erro ao carregar faturamentos anuais:", err);
    // Log mais detalhado do erro
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      console.error("Erro de conexão: Verifique se o Supabase está configurado corretamente e se há conexão com a internet");
    }
    faturamentosAnuais = [];
  }
}

function obterFaturamentoAno(ano) {
  const fa = (typeof faturamentosAnuais !== "undefined" ? faturamentosAnuais : []).find((f) => f && (f.ano === ano || f.ano === String(ano)));
  return fa != null ? Number(fa.valor || 0) : null;
}

async function cadastrarFaturamentoAnual(dados) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const ano = Number(dados.ano);
  const valor = Number(dados.valor);

  const existente = (faturamentosAnuais || []).find((f) => f && (f.ano === ano || f.ano === String(ano)));

  const registro = {
    id: existente ? existente.id : `fat-${Date.now()}`,
    ano,
    valor,
    atualizado_em: new Date().toISOString(),
  };

  if (existente) {
    const { data, error } = await supabase
      .from("faturamento_anual")
      .update({ valor: registro.valor, atualizado_em: registro.atualizado_em })
      .eq("id", existente.id)
      .select();

    if (error) return { sucesso: false, mensagem: "Erro ao atualizar: " + error.message };
    const idx = (faturamentosAnuais || []).findIndex((f) => f && f.id === existente.id);
    if (idx !== -1 && data && data[0]) faturamentosAnuais[idx] = data[0];
    return { sucesso: true, mensagem: "Faturamento do ano " + ano + " atualizado com sucesso!" };
  }

  registro.criado_em = new Date().toISOString();
  const { data, error } = await supabase
    .from("faturamento_anual")
    .insert([registro])
    .select();

  if (error) return { sucesso: false, mensagem: "Erro ao cadastrar: " + error.message };
  if (data && data[0]) {
    faturamentosAnuais = (faturamentosAnuais || []).filter((f) => !f || f.ano !== ano);
    faturamentosAnuais.push(data[0]);
    faturamentosAnuais.sort((a, b) => (b.ano || 0) - (a.ano || 0));
    return { sucesso: true, mensagem: "Faturamento do ano " + ano + " cadastrado com sucesso!" };
  }
  return { sucesso: false, mensagem: "Erro ao cadastrar." };
}

async function excluirFaturamentoAnual(id) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase.from("faturamento_anual").delete().eq("id", id);
  if (error) {
    console.error("Erro ao excluir faturamento anual:", error);
    return;
  }
  faturamentosAnuais = (faturamentosAnuais || []).filter((f) => f && f.id !== id);
}

// ========== GERENCIAMENTO DE PARCEIROS ==========
/** PostgREST devolve colunas em snake_case; a UI legada espera também camelCase. */
function mapParceiroFromSupabase(row) {
  if (!row) return row;
  return {
    ...row,
    servicosContratados: row.servicosContratados ?? row.servicos_contratados ?? "",
    responsavelNome: row.responsavelNome ?? row.responsavel_nome ?? "",
    responsavelEmail: row.responsavelEmail ?? row.responsavel_email ?? "",
  };
}

async function carregarParceiros() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase não inicializado");
      parceiros = [];
      return;
    }
    const { data, error } = await supabase
      .from("parceiros")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao carregar parceiros:", error);
      parceiros = [];
      return;
    }

    parceiros = (data || []).map(mapParceiroFromSupabase);
  } catch (error) {
    console.error("Erro ao carregar parceiros:", error);
    parceiros = [];
  }
}

async function salvarParceiros() {
  console.log("salvarParceiros: No Supabase, os dados são salvos automaticamente nas operações individuais");
}

async function cadastrarParceiro(dados) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const existeNome = parceiros.some(
    (p) => p.nome.toLowerCase() === dados.nome.toLowerCase()
  );

  if (existeNome) {
    return { sucesso: false, mensagem: "Já existe um Parceiro com este nome." };
  }

  const novo = {
    id: `parc-${Date.now()}`,
    nome: dados.nome.trim(),
    cep: dados.cep?.trim() || null,
    endereco: dados.endereco.trim(),
    servicos_contratados: dados.servicosContratados.trim(),
    responsavel_nome: dados.responsavelNome.trim(),
    responsavel_email: dados.responsavelEmail.toLowerCase().trim(),
    responsavel_senha: dados.responsavelSenha,
    criado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("parceiros")
    .insert([novo])
    .select();

  if (error) {
    console.error("Erro ao cadastrar parceiro:", error);
    return { sucesso: false, mensagem: "Erro ao cadastrar Parceiro: " + error.message };
  }

  if (data && data.length > 0) {
    parceiros.push(mapParceiroFromSupabase(data[0]));
    
    // Criar usuário parceiro
    await criarUsuarioParceiro(data[0].id, dados.responsavelNome, dados.responsavelEmail, dados.responsavelSenha);

    return { sucesso: true, mensagem: "Parceiro cadastrado com sucesso!" };
  }

  return { sucesso: false, mensagem: "Erro ao cadastrar Parceiro." };
}

async function atualizarParceiro(id, dados) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const atualizacao = {
    nome: dados.nome.trim(),
    cep: dados.cep?.trim() || null,
    endereco: dados.endereco.trim(),
    servicos_contratados: dados.servicosContratados.trim(),
    responsavel_nome: dados.responsavelNome.trim(),
    responsavel_email: dados.responsavelEmail.toLowerCase().trim(),
  };

  if (dados.responsavelSenha) {
    atualizacao.responsavel_senha = dados.responsavelSenha;
  }

  const { data, error } = await supabase
    .from("parceiros")
    .update(atualizacao)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Erro ao atualizar parceiro:", error);
    return { sucesso: false, mensagem: "Erro ao atualizar Parceiro: " + error.message };
  }

  if (data && data.length > 0) {
    const index = parceiros.findIndex((p) => p.id === id);
    if (index !== -1) {
      parceiros[index] = mapParceiroFromSupabase(data[0]);
    }
    return { sucesso: true, mensagem: "Parceiro atualizado com sucesso!" };
  }

  return { sucesso: false, mensagem: "Erro ao atualizar Parceiro." };
}

async function excluirParceiro(id) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("parceiros")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir parceiro:", error);
    return;
  }

  parceiros = parceiros.filter((p) => p.id !== id);
}

// ========== GERENCIAMENTO DE SERVIÇOS DE PARCEIROS ==========
async function carregarServicosParceiros() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase não inicializado");
      servicosParceiros = [];
      return;
    }
    const { data, error } = await supabase
      .from("servicos_parceiros")
      // Seleciona apenas os campos necessários para a listagem,
      // evitando trafegar o PDF em massa e reduzindo o tempo de resposta
      .select("id, parceiro_id, data, servico_prestado, quantidade, quantidade_paginas, valor_nota, observacao, fechamento_pendente, fechamento_aprovado, fechamento_id, criado_em")
      .order("criado_em", { ascending: false })
      // Limita a quantidade inicial de registros para diminuir risco de timeout
      .range(0, 499); // primeiros 500 registros

    if (error) {
      console.error("Erro ao carregar serviços de parceiros:", error);
      servicosParceiros = [];
      return;
    }

    servicosParceiros = data || [];
  } catch (error) {
    console.error("Erro ao carregar serviços de parceiros:", error);
    servicosParceiros = [];
  }
}

async function salvarServicosParceiros() {
  console.log("salvarServicosParceiros: No Supabase, os dados são salvos automaticamente nas operações individuais");
}

async function cadastrarServicoParceiro(dados) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const novo = {
    id: `serv-parc-${Date.now()}`,
    parceiro_id: dados.parceiroId ?? dados.parceiro_id,
    data: dados.data,
    servico_prestado: dados.servicoPrestado.trim(),
    quantidade: Number(dados.quantidade),
    quantidade_paginas: Number(dados.quantidadePaginas) || 0,
    valor_nota: Number(dados.valorNota),
    observacao: dados.observacao || "",
    pdf_nota_fiscal: dados.pdfNotaFiscal || null,
    nome_arquivo_pdf: dados.nomeArquivoPdf || null,
    fechamento_pendente: null,
    fechamento_aprovado: false,
    fechamento_id: null,
    criado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("servicos_parceiros")
    .insert([novo])
    .select();

  if (error) {
    console.error("Erro ao cadastrar serviço:", error);
    return { sucesso: false, mensagem: "Erro ao cadastrar serviço: " + error.message };
  }

  if (data && data.length > 0) {
    servicosParceiros.push(data[0]);
    return { sucesso: true, mensagem: "Serviço cadastrado com sucesso!", servico: data[0] };
  }

  return { sucesso: false, mensagem: "Erro ao cadastrar serviço." };
}

function obterServicosPorParceiro(parceiroId) {
  if (!parceiroId) return [];
  return (servicosParceiros || []).filter((s) => (s.parceiro_id ?? s.parceiroId) === parceiroId);
}

function obterServicoPorId(id) {
  return servicosParceiros.find((s) => s.id === id);
}

async function excluirServicoParceiro(id) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const servico = servicosParceiros.find((s) => s.id === id);
  if (!servico) {
    return { sucesso: false, mensagem: "Serviço não encontrado." };
  }

  const fechAprov = servico.fechamento_aprovado ?? servico.fechamentoAprovado;
  const fechPend = servico.fechamento_pendente ?? servico.fechamentoPendente;
  if (fechAprov || fechPend) {
    return { sucesso: false, mensagem: "Não é possível excluir um serviço que está em fechamento aprovado ou pendente." };
  }

  const { error } = await supabase
    .from("servicos_parceiros")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir serviço:", error);
    return { sucesso: false, mensagem: "Erro ao excluir serviço: " + error.message };
  }

  servicosParceiros = servicosParceiros.filter((s) => s.id !== id);
  return { sucesso: true, mensagem: "Serviço excluído com sucesso!" };
}

// ========== GERENCIAMENTO DE FECHAMENTOS ==========
async function carregarFechamentos() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase não inicializado");
      fechamentos = [];
      return;
    }
    const { data, error } = await supabase
      .from("fechamentos")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao carregar fechamentos:", error);
      fechamentos = [];
      return;
    }

    fechamentos = data || [];
  } catch (error) {
    console.error("Erro ao carregar fechamentos:", error);
    fechamentos = [];
  }
}

async function salvarFechamentos() {
  console.log("salvarFechamentos: No Supabase, os dados são salvos automaticamente nas operações individuais");
}

async function criarFechamento(parceiroId, servicosIds) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  // Verificar se algum serviço já está em fechamento pendente ou aprovado
  const servicosInvalidos = servicosIds.filter((id) => {
    const servico = servicosParceiros.find((s) => s.id === id);
    return servico && (servico.fechamento_pendente || servico.fechamento_aprovado);
  });

  if (servicosInvalidos.length > 0) {
    return { sucesso: false, mensagem: "Alguns serviços selecionados já estão em fechamento." };
  }

  // Calcular totais
  const servicos = servicosIds.map((id) => servicosParceiros.find((s) => s.id === id)).filter(Boolean);
  const valorTotal = servicos.reduce((sum, s) => sum + (s.valor_nota || 0), 0);
  const quantidadeTotal = servicos.reduce((sum, s) => sum + (s.quantidade || 0), 0);

  const novo = {
    id: `fech-${Date.now()}`,
    parceiro_id: parceiroId,
    status: "pendente",
    servicos_ids: servicosIds,
    quantidade_total: quantidadeTotal,
    valor_total: valorTotal,
    criado_em: new Date().toISOString(),
    aprovado_em: null,
    aprovado_por: null,
  };

  const { data, error } = await supabase
    .from("fechamentos")
    .insert([novo])
    .select();

  if (error) {
    console.error("Erro ao criar fechamento:", error);
    return { sucesso: false, mensagem: "Erro ao criar fechamento: " + error.message };
  }

  if (data && data.length > 0) {
    fechamentos.push(data[0]);

    // Marcar serviços como pendentes
    for (const id of servicosIds) {
      const servico = servicosParceiros.find((s) => s.id === id);
      if (servico) {
        const { error: updateError } = await supabase
          .from("servicos_parceiros")
          .update({
            fechamento_pendente: novo.id,
            fechamento_id: novo.id,
          })
          .eq("id", id);

        if (!updateError) {
          servico.fechamento_pendente = novo.id;
          servico.fechamento_id = novo.id;
        }
      }
    }

    return { sucesso: true, mensagem: "Fechamento criado com sucesso!", fechamento: data[0] };
  }

  return { sucesso: false, mensagem: "Erro ao criar fechamento." };
}

async function aprovarFechamento(fechamentoId) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const fechamento = fechamentos.find((f) => f.id === fechamentoId);
  if (!fechamento) {
    return { sucesso: false, mensagem: "Fechamento não encontrado." };
  }

  if (fechamento.status !== "pendente") {
    return { sucesso: false, mensagem: "Este fechamento já foi processado." };
  }

  const atualizacao = {
    status: "aprovado",
    aprovado_em: new Date().toISOString(),
    aprovado_por: usuarioLogado ? usuarioLogado.id : null,
  };

  const { data, error } = await supabase
    .from("fechamentos")
    .update(atualizacao)
    .eq("id", fechamentoId)
    .select();

  if (error) {
    console.error("Erro ao aprovar fechamento:", error);
    return { sucesso: false, mensagem: "Erro ao aprovar fechamento: " + error.message };
  }

  if (data && data.length > 0) {
    const index = fechamentos.findIndex((f) => f.id === fechamentoId);
    if (index !== -1) {
      fechamentos[index] = data[0];
    }

    // Marcar serviços como aprovados
    for (const id of fechamento.servicos_ids) {
      const servico = servicosParceiros.find((s) => s.id === id);
      if (servico) {
        const { error: updateError } = await supabase
          .from("servicos_parceiros")
          .update({
            fechamento_aprovado: true,
            fechamento_pendente: null,
          })
          .eq("id", id);

        if (!updateError) {
          servico.fechamento_aprovado = true;
          servico.fechamento_pendente = null;
        }
      }
    }

    return { sucesso: true, mensagem: "Fechamento aprovado com sucesso!" };
  }

  return { sucesso: false, mensagem: "Erro ao aprovar fechamento." };
}

async function rejeitarFechamento(fechamentoId) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const fechamento = fechamentos.find((f) => f.id === fechamentoId);
  if (!fechamento) {
    return { sucesso: false, mensagem: "Fechamento não encontrado." };
  }

  if (fechamento.status !== "pendente") {
    return { sucesso: false, mensagem: "Este fechamento já foi processado." };
  }

  const atualizacao = {
    status: "rejeitado",
    aprovado_em: new Date().toISOString(),
    aprovado_por: usuarioLogado ? usuarioLogado.id : null,
  };

  const { data, error } = await supabase
    .from("fechamentos")
    .update(atualizacao)
    .eq("id", fechamentoId)
    .select();

  if (error) {
    console.error("Erro ao rejeitar fechamento:", error);
    return { sucesso: false, mensagem: "Erro ao rejeitar fechamento: " + error.message };
  }

  if (data && data.length > 0) {
    const index = fechamentos.findIndex((f) => f.id === fechamentoId);
    if (index !== -1) {
      fechamentos[index] = data[0];
    }

    // Remover marcação de pendente dos serviços
    for (const id of fechamento.servicos_ids) {
      const servico = servicosParceiros.find((s) => s.id === id);
      if (servico) {
        const { error: updateError } = await supabase
          .from("servicos_parceiros")
          .update({
            fechamento_pendente: null,
            fechamento_id: null,
          })
          .eq("id", id);

        if (!updateError) {
          servico.fechamento_pendente = null;
          servico.fechamento_id = null;
        }
      }
    }

    return { sucesso: true, mensagem: "Fechamento rejeitado." };
  }

  return { sucesso: false, mensagem: "Erro ao rejeitar fechamento." };
}

function obterFechamentosPorParceiro(parceiroId) {
  return fechamentos.filter((f) => f.parceiro_id === parceiroId);
}

function obterFechamentosPendentes() {
  return fechamentos.filter((f) => f.status === "pendente");
}

function obterFechamentosAprovados() {
  return fechamentos.filter((f) => f.status === "aprovado");
}

// ========== GERENCIAMENTO DE MENSAGENS ==========
async function carregarMensagens() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase não inicializado");
      mensagens = [];
      return;
    }
    const { data, error } = await supabase
      .from("mensagens")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao carregar mensagens:", error);
      mensagens = [];
      return;
    }

    mensagens = data || [];
  } catch (error) {
    console.error("Erro ao carregar mensagens:", error);
    mensagens = [];
  }
}

async function salvarMensagens() {
  console.log("salvarMensagens: No Supabase, os dados são salvos automaticamente nas operações individuais");
}

async function enviarMensagem(dados) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const nova = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    remetente_id: dados.remetenteId,
    remetente_nome: dados.remetenteNome,
    remetente_email: dados.remetenteEmail,
    remetente_tipo: dados.remetenteTipo,
    destinatarios: Array.isArray(dados.destinatarios) ? dados.destinatarios : [dados.destinatarios],
    assunto: dados.assunto.trim(),
    mensagem: dados.mensagem.trim(),
    lida_por: [],
    criado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("mensagens")
    .insert([nova])
    .select();

  if (error) {
    console.error("Erro ao enviar mensagem:", error);
    return { sucesso: false, mensagem: "Erro ao enviar mensagem: " + error.message };
  }

  if (data && data.length > 0) {
    mensagens.push(data[0]);
    return { sucesso: true, mensagem: "Mensagem enviada com sucesso!" };
  }

  return { sucesso: false, mensagem: "Erro ao enviar mensagem." };
}

async function marcarMensagemComoLida(mensagemId, usuarioId) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const mensagem = mensagens.find((m) => m.id === mensagemId);
  if (!mensagem) return;

  const arr = mensagem.lida_por ?? mensagem.lidaPor;
  const lidaPor = Array.isArray(arr) ? [...arr] : [];
  if (!lidaPor.includes(usuarioId)) {
    lidaPor.push(usuarioId);
  }

  const { data, error } = await supabase
    .from("mensagens")
    .update({ lida_por: lidaPor })
    .eq("id", mensagemId)
    .select();

  if (!error && data && data.length > 0) {
    const index = mensagens.findIndex((m) => m.id === mensagemId);
    if (index !== -1) {
      mensagens[index] = data[0];
    }
  }
}

function obterMensagensRecebidas(usuarioId) {
  return mensagens.filter((m) => {
    if (m.destinatarios === "todos" || (Array.isArray(m.destinatarios) && m.destinatarios.includes("todos"))) {
      return m.remetente_id !== usuarioId;
    }
    return Array.isArray(m.destinatarios) && m.destinatarios.includes(usuarioId);
  });
}

function obterMensagensEnviadas(usuarioId) {
  return mensagens.filter((m) => m.remetente_id === usuarioId);
}

function obterMensagensNaoLidas(usuarioId) {
  return obterMensagensRecebidas(usuarioId).filter((m) => {
    const arr = m.lida_por ?? m.lidaPor;
    return !arr || !Array.isArray(arr) || !arr.includes(usuarioId);
  });
}

function obterMensagemPorId(mensagemId) {
  return mensagens.find((m) => m.id === mensagemId);
}

async function excluirMensagem(mensagemId) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const { error } = await supabase
    .from("mensagens")
    .delete()
    .eq("id", mensagemId);

  if (error) {
    console.error("Erro ao excluir mensagem:", error);
    return { sucesso: false, mensagem: "Erro ao excluir mensagem: " + error.message };
  }

  mensagens = mensagens.filter((m) => m.id !== mensagemId);
  return { sucesso: true, mensagem: "Mensagem excluída com sucesso!" };
}

async function excluirMensagens(mensagemIds) {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  if (!Array.isArray(mensagemIds) || mensagemIds.length === 0) {
    return { sucesso: false, mensagem: "Nenhuma mensagem selecionada." };
  }

  const { error } = await supabase
    .from("mensagens")
    .delete()
    .in("id", mensagemIds);

  if (error) {
    console.error("Erro ao excluir mensagens:", error);
    return { sucesso: false, mensagem: "Erro ao excluir mensagens: " + error.message };
  }

  mensagens = mensagens.filter((m) => !mensagemIds.includes(m.id));
  return { sucesso: true, mensagem: `${mensagemIds.length} mensagem(ns) excluída(s) com sucesso!` };
}

// ========== GERENCIAMENTO DE CONFIRMAÇÕES DE NÃO RECEBIMENTO ==========
async function carregarConfirmacoesNaoRecebimento() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase não inicializado");
      confirmacoesNaoRecebimento = [];
      return;
    }
    const { data, error } = await supabase
      .from("confirmacoes_nao_recebimento")
      .select("*")
      .order("confirmado_em", { ascending: false });

    if (error) {
      console.error("Erro ao carregar confirmações:", error);
      confirmacoesNaoRecebimento = [];
      return;
    }

    confirmacoesNaoRecebimento = data || [];
  } catch (error) {
    console.error("Erro ao carregar confirmações:", error);
    confirmacoesNaoRecebimento = [];
  }
}

async function salvarConfirmacoesNaoRecebimento() {
  console.log("salvarConfirmacoesNaoRecebimento: No Supabase, os dados são salvos automaticamente nas operações individuais");
}

async function confirmarNaoRecebimento(poupatempoId, dataEdicao, observacoes = "") {
  const supabase = getSupabaseClient();
  if (!supabase) return { sucesso: false, mensagem: "Supabase não inicializado" };

  const existe = confirmacoesNaoRecebimento.some(
    (c) => c.poupatempo_id === poupatempoId && c.data_edicao === dataEdicao
  );
  if (existe) {
    return { sucesso: false, mensagem: "Já existe confirmação de não recebimento para esta data." };
  }

  const nova = {
    id: `conf-${Date.now()}`,
    poupatempo_id: poupatempoId,
    data_edicao: dataEdicao,
    observacoes: observacoes.trim(),
    confirmado_por: usuarioLogado ? usuarioLogado.id : null,
    confirmado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("confirmacoes_nao_recebimento")
    .insert([nova])
    .select();

  if (error) {
    console.error("Erro ao confirmar não recebimento:", error);
    return { sucesso: false, mensagem: "Erro ao confirmar não recebimento: " + error.message };
  }

  if (data && data.length > 0) {
    confirmacoesNaoRecebimento.push(data[0]);
    return { sucesso: true, mensagem: "Confirmação de não recebimento registrada com sucesso!" };
  }

  return { sucesso: false, mensagem: "Erro ao confirmar não recebimento." };
}

// ========== FUNÇÕES AUXILIARES PARA CRIAÇÃO DE USUÁRIOS ==========
async function criarUsuarioFuncionario(poupatempoId, nome, email, senha, cargo) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const emailNormalizado = email.toLowerCase().trim();
  
  // Verificar se o usuário já existe pelo email
  const { data: usuarioExistente, error: erroBusca } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", emailNormalizado)
    .single();

  // Se o usuário já existe, atualizar ao invés de criar
  if (usuarioExistente && !erroBusca) {
    const atualizacao = {
      nome: nome.trim(),
      senha: senha,
      poupatempo_id: poupatempoId,
      cargo: cargo,
    };

    const { data, error } = await supabase
      .from("usuarios")
      .update(atualizacao)
      .eq("id", usuarioExistente.id)
      .select();

    if (error) {
      console.error(`Erro ao atualizar usuário funcionário (${cargo}):`, error);
      return null;
    }

    if (data && data.length > 0) {
      // Atualizar no array local
      const index = usuarios.findIndex((u) => u.id === usuarioExistente.id);
      if (index !== -1) {
        usuarios[index] = data[0];
      } else {
        usuarios.push(data[0]);
      }
      return data[0];
    }
    return null;
  }

  // Criar novo usuário se não existir
  const novoUsuario = {
    id: `func-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tipo: "funcionario",
    email: emailNormalizado,
    senha: senha,
    nome: nome.trim(),
    poupatempo_id: poupatempoId,
    cargo: cargo,
    criado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("usuarios")
    .insert([novoUsuario])
    .select();

  if (error) {
    // Se o erro for de duplicação, tentar atualizar
    if (error.code === '23505') {
      console.log(`Usuário com email ${emailNormalizado} já existe, tentando atualizar...`);
      const { data: usuarioAtualizado, error: erroAtualizacao } = await supabase
        .from("usuarios")
        .update({
          nome: nome.trim(),
          senha: senha,
          poupatempo_id: poupatempoId,
          cargo: cargo,
        })
        .eq("email", emailNormalizado)
        .select();

      if (!erroAtualizacao && usuarioAtualizado && usuarioAtualizado.length > 0) {
        const index = usuarios.findIndex((u) => u.email === emailNormalizado);
        if (index !== -1) {
          usuarios[index] = usuarioAtualizado[0];
        } else {
          usuarios.push(usuarioAtualizado[0]);
        }
        return usuarioAtualizado[0];
      }
    }
    console.error(`Erro ao criar usuário funcionário (${cargo}):`, error);
    return null;
  }

  if (data && data.length > 0) {
    usuarios.push(data[0]);
    return data[0];
  }

  return null;
}

async function criarUsuarioParceiro(parceiroId, nome, email, senha) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const novoUsuario = {
    id: `parc-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tipo: "parceiro",
    email: email.toLowerCase().trim(),
    senha: senha,
    nome: nome.trim(),
    parceiro_id: parceiroId,
    criado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("usuarios")
    .insert([novoUsuario])
    .select();

  if (error) {
    console.error("Erro ao criar usuário parceiro:", error);
    return null;
  }

  if (data && data.length > 0) {
    usuarios.push(data[0]);
    return data[0];
  }

  return null;
}
