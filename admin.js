// Configuração da página de administração
document.addEventListener("DOMContentLoaded", () => {
  // Verificar autenticação
  if (!verificarAutenticacao("admin")) {
    return;
  }

  // Exibir nome do usuário
  document.getElementById("nomeUsuarioAdmin").textContent = usuarioLogado.nome;

  // Configurar máscara de CEP
  // Máscara para CEP
  const campoCep = document.getElementById("cepPoupatempo");
  campoCep.addEventListener("input", (e) => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 5) {
      valor = valor.substring(0, 5) + "-" + valor.substring(5, 8);
    }
    e.target.value = valor;
  });

  // Configurar busca de CEP
  campoCep.addEventListener("blur", buscarCep);
  campoCep.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarCep();
    }
  });
  document.getElementById("btnBuscarCep").addEventListener("click", buscarCep);

  // Configurar formulário de cadastro
  const formCadastro = document.getElementById("cadastroPoupatempoForm");
  const mensagemCadastro = document.getElementById("mensagemCadastro");

  // Configurar botão cancelar edição
  document.getElementById("btnCancelarEdicao").addEventListener("click", cancelarEdicao);

  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensagemCadastro.classList.add("d-none");

    const idEdicao = document.getElementById("poupatempoIdEdicao").value;
    const dados = {
      nome: document.getElementById("nomePoupatempo").value.trim(),
      cep: document.getElementById("cepPoupatempo").value.trim(),
      endereco: document.getElementById("enderecoPoupatempo").value.trim(),
      telefone: document.getElementById("telefonePoupatempo").value.trim(),
      gerenteNome: document.getElementById("gerenteNome").value.trim(),
      gerenteEmail: document.getElementById("gerenteEmail").value.trim(),
      gerenteSenha: document.getElementById("gerenteSenha").value,
      coordenadorNome: document.getElementById("coordenadorNome").value.trim(),
      coordenadorEmail: document.getElementById("coordenadorEmail").value.trim(),
      coordenadorSenha: document.getElementById("coordenadorSenha").value,
      quantidadeEsperada: document.getElementById("quantidadeEsperada").value,
    };

    const btnSalvar = document.getElementById("btnSalvarPoupatempo");
    const textoOriginal = btnSalvar.textContent;
    try {
      btnSalvar.disabled = true;
      btnSalvar.textContent = "Salvando...";

      let resultado;
      if (idEdicao) {
        resultado = await atualizarPoupatempo(idEdicao, dados);
      } else {
        resultado = await cadastrarPoupatempo(dados);
      }

      if (resultado.sucesso) {
        mensagemCadastro.textContent = resultado.mensagem;
        mensagemCadastro.className = "alert alert-success";
        mensagemCadastro.classList.remove("d-none");
        cancelarEdicao();
        atualizarTabelaPoupatempos();
        popularSelectFiltroAdmin();
      } else {
        mensagemCadastro.textContent = resultado.mensagem || "Erro ao salvar.";
        mensagemCadastro.className = "alert alert-danger";
        mensagemCadastro.classList.remove("d-none");
      }
    } catch (err) {
      mensagemCadastro.textContent = err?.message || "Erro inesperado ao salvar Poupatempo.";
      mensagemCadastro.className = "alert alert-danger";
      mensagemCadastro.classList.remove("d-none");
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = textoOriginal;
    }
  });

  // Configurar botões
  document.getElementById("exportarPoupatempos").addEventListener("click", exportarPoupatemposCsv);
  document.getElementById("exportarCsvAdmin").addEventListener("click", exportarRegistrosCsvAdmin);
  document.getElementById("aplicarFiltrosAdmin").addEventListener("click", aplicarFiltrosAdmin);
  document.getElementById("limparFiltrosAdmin").addEventListener("click", limparFiltrosAdmin);
  document.getElementById("btnLogoutAdmin").addEventListener("click", () => {
    limparSessao();
    window.location.href = "login.html";
  });
  
  // Configurar botão de limpar dados (apenas para testes)
  const btnLimparDados = document.getElementById("btnLimparDados");
  if (btnLimparDados) {
    btnLimparDados.addEventListener("click", () => {
      if (confirm("⚠️ ATENÇÃO: Esta ação irá APAGAR TODOS os dados do sistema!\n\nIsso inclui:\n- Todos os usuários (exceto admin padrão)\n- Todos os Poupatempos\n- Todos os registros\n- Todos os investimentos\n- Todas as receitas\n- Todos os parceiros\n- Todos os serviços\n- Todos os fechamentos\n- Todas as mensagens\n\nDeseja continuar?")) {
        if (confirm("⚠️ CONFIRMAÇÃO FINAL:\n\nTem CERTEZA que deseja apagar TODOS os dados?\n\nEsta ação NÃO pode ser desfeita!")) {
          limparTodosDados();
          alert("✅ Todos os dados foram apagados com sucesso!\n\nO sistema será recarregado.");
          window.location.reload();
        }
      }
    });
  }

  // Configurar menu lateral
  document.getElementById("menu-dashboards").addEventListener("click", (e) => {
    e.preventDefault();
    mostrarSecaoDashboards();
  });

  const menuVisao = document.getElementById("menu-visao-executiva");
  if (menuVisao) {
    menuVisao.addEventListener("click", (e) => {
      e.preventDefault();
      mostrarSecaoVisaoExecutiva();
    });
  }

  document.getElementById("menu-poupatempos").addEventListener("click", (e) => {
    e.preventDefault();
    mostrarSecaoPoupatempos();
  });

  document.getElementById("menu-financeiro").addEventListener("click", (e) => {
    e.preventDefault();
    mostrarSecaoFinanceiro();
  });

  document.getElementById("menu-relatorios").addEventListener("click", (e) => {
    e.preventDefault();
    mostrarSecaoRelatorios();
  });

  document.getElementById("menu-parceiros").addEventListener("click", (e) => {
    e.preventDefault();
    mostrarSecaoParceiros();
  });

  document.getElementById("menu-fechamentos").addEventListener("click", (e) => {
    e.preventDefault();
    mostrarSecaoFechamentos();
  });
  
  document.getElementById("menu-mensagens").addEventListener("click", (e) => {
    e.preventDefault();
    mostrarSecaoMensagens();
  });
  
  // Configurar formulário de mensagens
  const formMensagem = document.getElementById("formMensagem");
  if (formMensagem) {
    formMensagem.addEventListener("submit", async (e) => {
      e.preventDefault();

      const destinatariosSelect = document.getElementById("destinatariosMensagem");
      const destinatariosSelecionados = Array.from(destinatariosSelect.selectedOptions).map(opt => opt.value);

      if (destinatariosSelecionados.length === 0) {
        alert("Selecione pelo menos um destinatário.");
        return;
      }

      const assunto = document.getElementById("assuntoMensagem").value.trim();
      const conteudo = document.getElementById("conteudoMensagem").value.trim();

      if (!assunto || !conteudo) {
        alert("Preencha todos os campos obrigatórios.");
        return;
      }

      const destinatarios = destinatariosSelecionados.includes("todos") ? "todos" : destinatariosSelecionados;

      const resultado = await enviarMensagem({
        remetenteId: usuarioLogado.id,
        remetenteNome: usuarioLogado.nome,
        remetenteEmail: usuarioLogado.email,
        remetenteTipo: usuarioLogado.tipo,
        destinatarios: destinatarios,
        assunto: assunto,
        mensagem: conteudo
      });

      if (resultado && resultado.sucesso) {
        const mensagemDiv = document.getElementById("mensagemFormMensagem");
        mensagemDiv.textContent = resultado.mensagem || "Mensagem enviada com sucesso!";
        mensagemDiv.className = "alert alert-success";
        mensagemDiv.classList.remove("d-none");

        formMensagem.reset();
        atualizarListaMensagens();
        atualizarContadorMensagensNaoLidas();

        setTimeout(() => mensagemDiv.classList.add("d-none"), 3000);
      } else if (resultado && !resultado.sucesso) {
        const mensagemDiv = document.getElementById("mensagemFormMensagem");
        mensagemDiv.textContent = resultado.mensagem || "Erro ao enviar mensagem.";
        mensagemDiv.className = "alert alert-danger";
        mensagemDiv.classList.remove("d-none");
        setTimeout(() => mensagemDiv.classList.add("d-none"), 5000);
      }
    });
  }
  
  // Configurar filtros de mensagens
  const filtrosMensagens = document.querySelectorAll('input[name="filtroMensagens"]');
  if (filtrosMensagens.length > 0) {
    filtrosMensagens.forEach(radio => {
      radio.addEventListener("change", () => {
        if (typeof atualizarListaMensagens === 'function') {
          atualizarListaMensagens();
        }
      });
    });
  }
  
  // Configurar botão de excluir mensagens selecionadas
  const btnExcluirMensagens = document.getElementById("btnExcluirMensagensSelecionadas");
  if (btnExcluirMensagens) {
    btnExcluirMensagens.addEventListener("click", excluirMensagensSelecionadas);
  }
  
  // Atualizar contador de mensagens não lidas periodicamente
  if (typeof atualizarContadorMensagensNaoLidas === 'function') {
    atualizarContadorMensagensNaoLidas();
    setInterval(() => {
      if (typeof atualizarContadorMensagensNaoLidas === 'function') {
        atualizarContadorMensagensNaoLidas();
      }
    }, 30000); // A cada 30 segundos
  }

  // Configurar formulários financeiros
  let submittingInvestimento = false;
  let submittingReceita = false;

  const formInvestimento = document.getElementById("formInvestimento");
  if (formInvestimento) {
    formInvestimento.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (submittingInvestimento) return;
      submittingInvestimento = true;
      const btnInvest = formInvestimento.querySelector('button[type="submit"]');
      if (btnInvest) btnInvest.disabled = true;

      const mensagem = document.getElementById("mensagemInvestimento");
      mensagem.classList.add("d-none");

      const dados = {
        ano: document.getElementById("anoInvestimento").value,
        operacional: document.getElementById("investimentoOperacional").value,
        impressao: document.getElementById("investimentoImpressao").value,
        distribuicao: document.getElementById("investimentoDistribuicao").value,
      };

      try {
        const resultado = await cadastrarInvestimento(dados);
        if (resultado.sucesso) {
          mensagem.textContent = resultado.mensagem;
          mensagem.className = "alert alert-success";
          mensagem.classList.remove("d-none");
          formInvestimento.reset();
          atualizarTabelaInvestimentos();
        } else {
          mensagem.textContent = resultado.mensagem;
          mensagem.className = "alert alert-danger";
          mensagem.classList.remove("d-none");
        }
      } catch (err) {
        mensagem.textContent = err?.message || "Erro ao cadastrar investimento.";
        mensagem.className = "alert alert-danger";
        mensagem.classList.remove("d-none");
      } finally {
        submittingInvestimento = false;
        if (btnInvest) btnInvest.disabled = false;
      }
    });
  }

  const formReceita = document.getElementById("formReceita");
  if (formReceita) {
    formReceita.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (submittingReceita) return;
      submittingReceita = true;
      const btnRec = formReceita.querySelector('button[type="submit"]');
      if (btnRec) btnRec.disabled = true;

      const mensagem = document.getElementById("mensagemReceita");
      mensagem.classList.add("d-none");

      const dados = {
        data: document.getElementById("dataReceita").value,
        faturamento: document.getElementById("faturamentoReceita").value,
        totalPedidos: document.getElementById("totalPedidosReceita").value,
      };

      try {
        const resultado = await cadastrarReceita(dados);
        if (resultado.sucesso) {
          mensagem.textContent = resultado.mensagem;
          mensagem.className = "alert alert-success";
          mensagem.classList.remove("d-none");
          formReceita.reset();
          atualizarTabelaReceitas();
        } else {
          mensagem.textContent = resultado.mensagem;
          mensagem.className = "alert alert-danger";
          mensagem.classList.remove("d-none");
        }
      } catch (err) {
        mensagem.textContent = err?.message || "Erro ao cadastrar receita.";
        mensagem.className = "alert alert-danger";
        mensagem.classList.remove("d-none");
      } finally {
        submittingReceita = false;
        if (btnRec) btnRec.disabled = false;
      }
    });
  }

  document.getElementById("exportarInvestimentos").addEventListener("click", exportarInvestimentosCsv);
  document.getElementById("exportarReceitas").addEventListener("click", exportarReceitasCsv);

  const inputReceitasCsv = document.getElementById("arquivoReceitasCsv");
  if (inputReceitasCsv) {
    inputReceitasCsv.addEventListener("change", async (e) => {
      const arquivo = e.target.files?.[0];
      if (!arquivo) return;
      await importarReceitasCsv(arquivo);
      // Limpar seleção para permitir reimportar o mesmo arquivo se necessário
      e.target.value = "";
    });
  }

  const btnExcluirReceitasSel = document.getElementById("btnExcluirReceitasSelecionadas");
  if (btnExcluirReceitasSel) {
    btnExcluirReceitasSel.addEventListener("click", excluirReceitasSelecionadas);
  }
  const checkTodasReceitas = document.getElementById("checkTodasReceitas");
  if (checkTodasReceitas) {
    checkTodasReceitas.addEventListener("change", () => {
      const marcados = checkTodasReceitas.checked;
      document.querySelectorAll(".checkbox-receita").forEach((cb) => {
        cb.checked = marcados;
      });
      atualizarBotaoExcluirReceitas();
    });
  }

  const btnAplicarFiltroReceitas = document.getElementById("aplicarFiltroReceitas");
  if (btnAplicarFiltroReceitas) {
    btnAplicarFiltroReceitas.addEventListener("click", (e) => {
      e.preventDefault();
      atualizarTabelaReceitas();
    });
  }
  const btnLimparFiltroReceitas = document.getElementById("limparFiltroReceitas");
  if (btnLimparFiltroReceitas) {
    btnLimparFiltroReceitas.addEventListener("click", (e) => {
      e.preventDefault();
      const mes = document.getElementById("filtroMesReceita");
      const ano = document.getElementById("filtroAnoReceita");
      if (mes) mes.value = "";
      if (ano) ano.value = "";
      atualizarTabelaReceitas();
    });
  }

  const btnSalvarFatAnual = document.getElementById("btnSalvarFaturamentoAnual");
  if (btnSalvarFatAnual) {
    btnSalvarFatAnual.addEventListener("click", async () => {
      const ano = document.getElementById("anoFaturamentoAnual")?.value;
      const valor = document.getElementById("valorFaturamentoAnual")?.value;
      const msg = document.getElementById("mensagemFaturamentoAnual");
      if (!ano || valor == null || valor === "") {
        if (msg) { msg.textContent = "Preencha ano e valor."; msg.className = "alert alert-danger"; msg.classList.remove("d-none"); }
        return;
      }
      if (msg) msg.classList.add("d-none");
      try {
        const res = await (typeof cadastrarFaturamentoAnual === "function" ? cadastrarFaturamentoAnual({ ano, valor }) : Promise.resolve({ sucesso: false, mensagem: "Função indisponível." }));
        if (res && res.sucesso) {
          if (msg) { msg.textContent = res.mensagem || "Salvo."; msg.className = "alert alert-success"; msg.classList.remove("d-none"); }
          document.getElementById("anoFaturamentoAnual").value = "";
          document.getElementById("valorFaturamentoAnual").value = "";
          atualizarTabelaFaturamentosAnuais();
        } else {
          if (msg) { msg.textContent = (res && res.mensagem) || "Erro."; msg.className = "alert alert-danger"; msg.classList.remove("d-none"); }
        }
      } catch (e) {
        if (msg) { msg.textContent = e?.message || "Erro ao salvar."; msg.className = "alert alert-danger"; msg.classList.remove("d-none"); }
      }
    });
  }

  // Configurar formulário de parceiros
  const formParceiro = document.getElementById("cadastroParceiroForm");
  if (formParceiro) {
    document.getElementById("btnCancelarEdicaoParceiro").addEventListener("click", cancelarEdicaoParceiro);
    
    // Configurar busca de CEP para parceiros
    const campoCepParceiro = document.getElementById("cepParceiro");
    if (campoCepParceiro) {
      campoCepParceiro.addEventListener("input", (e) => {
        let valor = e.target.value.replace(/\D/g, "");
        if (valor.length > 8) valor = valor.substring(0, 8);
        if (valor.length > 5) {
          valor = valor.substring(0, 5) + "-" + valor.substring(5);
        }
        e.target.value = valor;
      });

      campoCepParceiro.addEventListener("blur", buscarCepParceiro);
    }

    document.getElementById("btnBuscarCepParceiro").addEventListener("click", buscarCepParceiro);
    
    formParceiro.addEventListener("submit", async (e) => {
      e.preventDefault();
      const mensagem = document.getElementById("mensagemCadastroParceiro");
      mensagem.classList.add("d-none");

      const idEdicao = document.getElementById("parceiroIdEdicao").value;
      const dados = {
        nome: document.getElementById("nomeParceiro").value.trim(),
        cep: document.getElementById("cepParceiro").value.trim(),
        endereco: document.getElementById("enderecoParceiro").value.trim(),
        servicosContratados: document.getElementById("servicosContratados").value.trim(),
        responsavelNome: document.getElementById("responsavelParceiroNome").value.trim(),
        responsavelEmail: document.getElementById("responsavelParceiroEmail").value.trim(),
        responsavelSenha: document.getElementById("responsavelParceiroSenha").value,
      };

      try {
        let resultado;
        if (idEdicao) {
          resultado = await atualizarParceiro(idEdicao, dados);
        } else {
          resultado = await cadastrarParceiro(dados);
        }
        if (resultado.sucesso) {
          mensagem.textContent = resultado.mensagem;
          mensagem.className = "alert alert-success";
          mensagem.classList.remove("d-none");
          cancelarEdicaoParceiro();
          atualizarTabelaParceiros();
        } else {
          mensagem.textContent = resultado.mensagem;
          mensagem.className = "alert alert-danger";
          mensagem.classList.remove("d-none");
        }
      } catch (err) {
        mensagem.textContent = err?.message || "Erro ao salvar parceiro.";
        mensagem.className = "alert alert-danger";
        mensagem.classList.remove("d-none");
      }
    });
  }

  document.getElementById("exportarParceiros").addEventListener("click", exportarParceirosCsv);

  // Inicializar tabelas
  atualizarTabelaPoupatempos();
  atualizarTabelaRegistrosAdmin();
  popularSelectFiltroAdmin();
  atualizarTabelaInvestimentos();
  atualizarTabelaReceitas();
  atualizarTabelaParceiros();

  // Quando os dados (Supabase) terminarem de carregar, atualizar dashboard, registros e filtros
  window.addEventListener("dadosInicializados", () => {
    atualizarDashboard(false);
    atualizarTabelaRegistrosAdmin();
    popularSelectFiltroAdmin();
  });
  // Se os dados já estavam prontos (ex: localStorage), garantir atualização
  if (window.dadosInicializados) {
    atualizarDashboard(false);
    atualizarTabelaRegistrosAdmin();
    popularSelectFiltroAdmin();
  }
  
  // Inicializar dashboard (página principal) — os dados serão preenchidos ao disparar dadosInicializados
  mostrarSecaoDashboards();
  
  // Event listener para exportar CSV do dashboard
  document.getElementById("exportarPoupatemposDashboard").addEventListener("click", exportarPoupatemposDashboardCsv);
  
  // Event listener para card de registros com atraso
  const cardRegistrosAtraso = document.getElementById("cardRegistrosAtraso");
  if (cardRegistrosAtraso) {
    cardRegistrosAtraso.addEventListener("click", navegarParaRegistrosAtraso);
  }
  
  // Event listener para card de registros recebidos
  // Configurar botões de relatórios
  const btnExportarReceb = document.getElementById("exportarRelRecebimentos");
  if (btnExportarReceb) {
    btnExportarReceb.addEventListener("click", () => {
      exportarRelatorioRecebimentosCsv();
    });
  }

  const btnExportarFin = document.getElementById("exportarRelFinanceiro");
  if (btnExportarFin) {
    btnExportarFin.addEventListener("click", () => {
      exportarRelatorioFinanceiroCsv();
    });
  }

  const btnAplicarRel = document.getElementById("aplicarRelRecebimentos");
  const btnLimparRel = document.getElementById("limparRelRecebimentos");
  if (btnAplicarRel) {
    btnAplicarRel.addEventListener("click", atualizarRelatorioRecebimentos);
  }
  if (btnLimparRel) {
    btnLimparRel.addEventListener("click", () => {
      document.getElementById("relFiltroPoupatempo").value = "";
      document.getElementById("relDataInicio").value = "";
      document.getElementById("relDataFim").value = "";
      atualizarRelatorioRecebimentos();
    });
  }
  
  // Máscara para Telefone
  const campoTelefone = document.getElementById("telefonePoupatempo");
  if (campoTelefone) {
    campoTelefone.addEventListener("input", (e) => {
      let valor = e.target.value.replace(/\D/g, "");
      if (valor.length <= 11) {
        if (valor.length <= 10) {
          valor = valor.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
        } else {
          valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
        }
        e.target.value = valor;
      }
    });
  }
});

function mostrarSecaoDashboards() {
  document.getElementById("secao-dashboards").style.display = "block";
  const secVisao = document.getElementById("secao-visao-executiva");
  if (secVisao) secVisao.style.display = "none";
  document.getElementById("secao-poupatempos").style.display = "none";
  document.getElementById("secao-financeiro").style.display = "none";
  document.getElementById("secao-parceiros").style.display = "none";
  document.getElementById("secao-fechamentos").style.display = "none";
  document.getElementById("secao-relatorios").style.display = "none";
  document.querySelector(".tab-content").style.display = "none";
  const navTabs = document.querySelector(".nav.nav-tabs");
  if (navTabs) navTabs.style.display = "none";
  document.getElementById("menu-dashboards").classList.add("active");
  const menuVisao = document.getElementById("menu-visao-executiva");
  if (menuVisao) menuVisao.classList.remove("active");
  document.getElementById("menu-poupatempos").classList.remove("active");
  document.getElementById("menu-financeiro").classList.remove("active");
  document.getElementById("menu-parceiros").classList.remove("active");
  document.getElementById("menu-fechamentos").classList.remove("active");
  document.getElementById("menu-mensagens").classList.remove("active");
  document.getElementById("menu-relatorios").classList.remove("active");
  atualizarDashboard();
}

function mostrarSecaoPoupatempos() {
  document.getElementById("secao-dashboards").style.display = "none";
  const secVisao = document.getElementById("secao-visao-executiva");
  if (secVisao) secVisao.style.display = "none";
  document.getElementById("secao-financeiro").style.display = "none";
  document.getElementById("secao-parceiros").style.display = "none";
  document.getElementById("secao-fechamentos").style.display = "none";
  document.getElementById("secao-relatorios").style.display = "none";
  document.getElementById("secao-poupatempos").style.display = "block";
  document.querySelector(".tab-content").style.display = "block";
  // Mostrar as abas de Poupatempos
  const navTabs = document.querySelector(".nav.nav-tabs");
  if (navTabs) navTabs.style.display = "flex";
  document.getElementById("menu-dashboards").classList.remove("active");
  const menuVisao = document.getElementById("menu-visao-executiva");
  if (menuVisao) menuVisao.classList.remove("active");
  document.getElementById("menu-poupatempos").classList.add("active");
  document.getElementById("menu-financeiro").classList.remove("active");
  document.getElementById("menu-parceiros").classList.remove("active");
  document.getElementById("menu-fechamentos").classList.remove("active");
  document.getElementById("menu-mensagens").classList.remove("active");
  document.getElementById("menu-relatorios").classList.remove("active");
  atualizarTabelaPoupatempos();
  atualizarTabelaRegistrosAdmin();
}

function mostrarSecaoFinanceiro() {
  document.getElementById("secao-dashboards").style.display = "none";
  document.getElementById("secao-poupatempos").style.display = "none";
  document.getElementById("secao-financeiro").style.display = "block";
  document.getElementById("secao-parceiros").style.display = "none";
  document.getElementById("secao-fechamentos").style.display = "none";
  document.getElementById("secao-relatorios").style.display = "none";
  const secVisao = document.getElementById("secao-visao-executiva");
  if (secVisao) secVisao.style.display = "none";
  document.querySelector(".tab-content").style.display = "none";
  // Ocultar as abas de Poupatempos
  const navTabs = document.querySelector(".nav.nav-tabs");
  if (navTabs) navTabs.style.display = "none";
  document.getElementById("menu-dashboards").classList.remove("active");
  const menuVisao = document.getElementById("menu-visao-executiva");
  if (menuVisao) menuVisao.classList.remove("active");
  document.getElementById("menu-poupatempos").classList.remove("active");
  document.getElementById("menu-financeiro").classList.add("active");
  document.getElementById("menu-parceiros").classList.remove("active");
  document.getElementById("menu-fechamentos").classList.remove("active");
  document.getElementById("menu-mensagens").classList.remove("active");
  document.getElementById("menu-relatorios").classList.remove("active");
  // Carregar investimentos e receitas do Supabase/localStorage e atualizar tabelas
  (async () => {
    try {
      if (typeof carregarInvestimentos === "function") {
        if (carregarInvestimentos.constructor?.name === "AsyncFunction") await carregarInvestimentos();
        else carregarInvestimentos();
      }
    } catch (err) { console.error("Erro ao carregar investimentos:", err); }
    try {
      if (typeof carregarReceitas === "function") {
        if (carregarReceitas.constructor?.name === "AsyncFunction") await carregarReceitas();
        else carregarReceitas();
      }
    } catch (err) { console.error("Erro ao carregar receitas:", err); }
    try {
      if (typeof carregarFaturamentosAnuais === "function") {
        if (carregarFaturamentosAnuais.constructor?.name === "AsyncFunction") await carregarFaturamentosAnuais();
        else carregarFaturamentosAnuais();
      }
    } catch (err) { console.error("Erro ao carregar faturamentos anuais:", err); }
    atualizarTabelaInvestimentos();
    atualizarTabelaReceitas();
    atualizarTabelaFaturamentosAnuais();
  })();
}

function mostrarSecaoParceiros() {
  document.getElementById("secao-dashboards").style.display = "none";
  document.getElementById("secao-poupatempos").style.display = "none";
  document.getElementById("secao-financeiro").style.display = "none";
  document.getElementById("secao-parceiros").style.display = "block";
  document.getElementById("secao-fechamentos").style.display = "none";
  document.getElementById("secao-relatorios").style.display = "none";
  const secVisao = document.getElementById("secao-visao-executiva");
  if (secVisao) secVisao.style.display = "none";
  document.querySelector(".tab-content").style.display = "none";
  // Ocultar as abas de Poupatempos
  const navTabs = document.querySelector(".nav.nav-tabs");
  if (navTabs) navTabs.style.display = "none";
  document.getElementById("menu-dashboards").classList.remove("active");
  document.getElementById("menu-poupatempos").classList.remove("active");
  document.getElementById("menu-financeiro").classList.remove("active");
  document.getElementById("menu-parceiros").classList.add("active");
  document.getElementById("menu-fechamentos").classList.remove("active");
  document.getElementById("menu-mensagens").classList.remove("active");
  document.getElementById("menu-relatorios").classList.remove("active");
  const menuVisao = document.getElementById("menu-visao-executiva");
  if (menuVisao) menuVisao.classList.remove("active");
}

function mostrarSecaoFechamentos() {
  document.getElementById("secao-dashboards").style.display = "none";
  document.getElementById("secao-poupatempos").style.display = "none";
  document.getElementById("secao-financeiro").style.display = "none";
  document.getElementById("secao-parceiros").style.display = "none";
  document.getElementById("secao-fechamentos").style.display = "block";
  document.getElementById("secao-relatorios").style.display = "none";
  const secVisao = document.getElementById("secao-visao-executiva");
  if (secVisao) secVisao.style.display = "none";
  document.querySelector(".tab-content").style.display = "none";
  // Ocultar as abas de Poupatempos
  const navTabs = document.querySelector(".nav.nav-tabs");
  if (navTabs) navTabs.style.display = "none";
  document.getElementById("menu-dashboards").classList.remove("active");
  document.getElementById("menu-poupatempos").classList.remove("active");
  document.getElementById("menu-financeiro").classList.remove("active");
  document.getElementById("menu-parceiros").classList.remove("active");
  document.getElementById("menu-fechamentos").classList.add("active");
  document.getElementById("menu-mensagens").classList.remove("active");
  document.getElementById("menu-relatorios").classList.remove("active");
  const menuVisao = document.getElementById("menu-visao-executiva");
  if (menuVisao) menuVisao.classList.remove("active");
  atualizarTabelaFechamentos();
}

function mostrarSecaoRelatorios() {
  document.getElementById("secao-dashboards").style.display = "none";
  document.getElementById("secao-poupatempos").style.display = "none";
  document.getElementById("secao-financeiro").style.display = "none";
  document.getElementById("secao-parceiros").style.display = "none";
  document.getElementById("secao-fechamentos").style.display = "none";
  document.getElementById("secao-relatorios").style.display = "block";
  const secVisao = document.getElementById("secao-visao-executiva");
  if (secVisao) secVisao.style.display = "none";
  document.querySelector(".tab-content").style.display = "none";
  const navTabs = document.querySelector(".nav.nav-tabs");
  if (navTabs) navTabs.style.display = "none";
  document.getElementById("menu-dashboards").classList.remove("active");
  document.getElementById("menu-poupatempos").classList.remove("active");
  document.getElementById("menu-financeiro").classList.remove("active");
  document.getElementById("menu-parceiros").classList.remove("active");
  document.getElementById("menu-fechamentos").classList.remove("active");
  document.getElementById("menu-mensagens").classList.remove("active");
  document.getElementById("menu-relatorios").classList.add("active");
  const menuVisao = document.getElementById("menu-visao-executiva");
  if (menuVisao) menuVisao.classList.remove("active");
  atualizarRelatorioRecebimentos();
  atualizarResumoFinanceiroRelatorio();
  if (typeof atualizarRelatorioDescarte === "function") {
    atualizarRelatorioDescarte();
  }
}

function mostrarSecaoVisaoExecutiva() {
  const secVisao = document.getElementById("secao-visao-executiva");
  if (!secVisao) return;
  document.getElementById("secao-dashboards").style.display = "none";
  document.getElementById("secao-poupatempos").style.display = "none";
  document.getElementById("secao-financeiro").style.display = "none";
  document.getElementById("secao-parceiros").style.display = "none";
  document.getElementById("secao-fechamentos").style.display = "none";
  document.getElementById("secao-relatorios").style.display = "none";
  secVisao.style.display = "block";

  const navTabs = document.querySelector(".nav.nav-tabs");
  if (navTabs) navTabs.style.display = "none";
  document.querySelector(".tab-content").style.display = "none";

  document.getElementById("menu-dashboards").classList.remove("active");
  const menuVisao = document.getElementById("menu-visao-executiva");
  if (menuVisao) menuVisao.classList.add("active");
  document.getElementById("menu-poupatempos").classList.remove("active");
  document.getElementById("menu-financeiro").classList.remove("active");
  document.getElementById("menu-parceiros").classList.remove("active");
  document.getElementById("menu-fechamentos").classList.remove("active");
  document.getElementById("menu-mensagens").classList.remove("active");
  document.getElementById("menu-relatorios").classList.remove("active");

  atualizarVisaoExecutiva();
}

function atualizarRelatorioRecebimentos() {
  const selectPoupa = document.getElementById("relFiltroPoupatempo");
  const elInicio = document.getElementById("relDataInicio");
  const elFim = document.getElementById("relDataFim");
  const dataInicio = (elInicio && elInicio.value) ? elInicio.value : "";
  const dataFim = (elFim && elFim.value) ? elFim.value : "";
  const tbody = document.querySelector("#tabelaRelRecebimentos tbody");
  const resumo = document.getElementById("resumoRelRecebimentos");

  if (!selectPoupa || !tbody) return;

  // Garantir que filtros de poupatempos estejam atualizados
  const valorSelecionado = selectPoupa.value;
  selectPoupa.innerHTML = '<option value="">Todos</option>';
  poupatempos.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.nome;
    selectPoupa.appendChild(opt);
  });
  // Restaurar seleção anterior (se ainda existir)
  if (valorSelecionado) {
    selectPoupa.value = valorSelecionado;
  }

  const filtroPoupa = selectPoupa.value;

  let lista = [...registros];

  if (filtroPoupa) {
    lista = lista.filter((r) => (r.poupatempoId ?? r.poupatempo_id) === filtroPoupa);
  }

  if (dataInicio) {
    lista = lista.filter((r) => (r.dataEdicao ?? r.data_edicao) >= dataInicio);
  }

  if (dataFim) {
    lista = lista.filter((r) => (r.dataEdicao ?? r.data_edicao) <= dataFim);
  }

  // Agrupar por Poupatempo + data
  const mapa = new Map();
  lista.forEach((reg) => {
    const poupaId = reg.poupatempoId ?? reg.poupatempo_id;
    const dataEd = reg.dataEdicao ?? reg.data_edicao;
    const dataRec = reg.dataRecebimento ?? reg.data_recebimento;
    const chave = `${poupaId || "sem"}|${dataEd || "-"}`;
    const atual = mapa.get(chave) || {
      poupatempoId: poupaId,
      dataEdicao: dataEd,
      dataRecebimento: dataRec || null,
      qtdRegistros: 0,
      qtdExemplares: 0,
    };
    atual.qtdRegistros += 1;
    atual.qtdExemplares += Number(reg.quantidade || 0);
    // Se não tinha data de recebimento e este registro tem, usar a primeira encontrada
    if (!atual.dataRecebimento && (reg.dataRecebimento ?? reg.data_recebimento)) {
      atual.dataRecebimento = reg.dataRecebimento ?? reg.data_recebimento;
    }
    mapa.set(chave, atual);
  });

  if (!mapa.size) {
    tbody.innerHTML = "";
    resumo.textContent = "Nenhum registro encontrado com os filtros informados.";
    const controles = document.getElementById("paginacaoRelRecebimentos");
    if (controles) controles.remove();
    return;
  }

  const listaItens = Array.from(mapa.values());
  // Calcular totais de toda a lista (não apenas da página)
  let totalRegistros = 0;
  let totalExemplares = 0;
  listaItens.forEach((item) => {
    totalRegistros += item.qtdRegistros;
    totalExemplares += item.qtdExemplares;
  });

  const renderizarLinha = (item) => {
    const poupa = obterPoupatempoPorId(item.poupatempoId);
    const tr = document.createElement("tr");
    tr.appendChild(criarTd(poupa ? poupa.nome : "N/A"));
    tr.appendChild(criarTd(formatarData(item.dataEdicao)));
    tr.appendChild(criarTd(formatarData(item.dataRecebimento) || "-"));
    tr.appendChild(criarTd(item.qtdRegistros, "text-end"));
    tr.appendChild(criarTd(item.qtdExemplares, "text-end"));
    tbody.appendChild(tr);
  };
  
  aplicarPaginacaoTabela(listaItens, tbody, renderizarLinha, "paginacaoRelRecebimentos", atualizarRelatorioRecebimentos);

  resumo.textContent = `Total: ${totalRegistros} registro(s) | ${totalExemplares} exemplar(es) recebido(s).`;
}

function atualizarResumoFinanceiroRelatorio() {
  const lista = document.getElementById("listaResumoFinanceiro");
  if (!lista) return;

  lista.innerHTML = "";

  const fechamentosAprovados = (typeof fechamentos !== "undefined" ? fechamentos : []).filter(
    (f) => f && f.status === "aprovado"
  );
  const custoOperacional = fechamentosAprovados.reduce(
    (sum, f) => sum + Number((f.valorTotal ?? f.valor_total) || 0),
    0
  );
  const totalInvestimento = investimentos.reduce((sum, inv) => {
    const totalAno =
      (Number(inv.operacional) || 0) +
      (Number(inv.impressao) || 0) +
      (Number(inv.distribuicao) || 0);
    return sum + totalAno;
  }, 0);
  const totalReceita = receitas.reduce(
    (sum, r) => sum + Number(r.faturamento || 0),
    0
  );
  const investimentoRestante = totalInvestimento - custoOperacional;
  const coberturaInvestimento = totalReceita - totalInvestimento;

  const itens = [
    { label: "Custo Operacional (fechamentos aprovados)", valor: custoOperacional },
    { label: "Investimento Total", valor: totalInvestimento },
    { label: "Receita Total", valor: totalReceita },
    { label: "Investimento Restante (Investimento - Custo Operacional)", valor: investimentoRestante },
    { label: "Cobertura do Investimento (Receita - Investimento)", valor: coberturaInvestimento },
  ];

  itens.forEach((item) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    const spanLabel = document.createElement("span");
    spanLabel.textContent = item.label;
    const spanValor = document.createElement("span");
    spanValor.className = "fw-semibold";
    spanValor.textContent = formatarMoeda(item.valor);
    li.appendChild(spanLabel);
    li.appendChild(spanValor);
    lista.appendChild(li);
  });
}

function atualizarRelatorioDescarte() {
  const tbody = document.querySelector("#tabelaRelDescartes tbody");
  const resumo = document.getElementById("resumoRelDescartes");
  if (!tbody || !resumo) return;

  const listaGlobal = (typeof descartes !== "undefined" && Array.isArray(descartes)) ? descartes : [];

  tbody.innerHTML = "";

  if (!listaGlobal.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.className = "text-center text-muted";
    td.textContent = "Nenhum descarte cadastrado.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    resumo.textContent = "Nenhum descarte registrado.";
    return;
  }

  // Ordenar por data de descarte (mais recente primeiro)
  const listaOrdenada = [...listaGlobal].sort((a, b) => {
    const da = a.data_descarte ?? a.dataDescarte ?? "";
    const db = b.data_descarte ?? b.dataDescarte ?? "";
    return db.localeCompare(da);
  });

  let totalQtd = 0;

  listaOrdenada.forEach((item) => {
    const tr = document.createElement("tr");
    const poupaId = item.poupatempo_id ?? item.poupatempoId;
    const poupa = typeof obterPoupatempoPorId === "function" ? obterPoupatempoPorId(poupaId) : null;

    const data = item.data_descarte ?? item.dataDescarte ?? "";
    const quantidade = Number(item.quantidade || 0);
    const motivo = item.motivo || "-";
    const observacoes = item.observacoes || "-";

    totalQtd += quantidade;

    tr.appendChild(criarTd(poupa ? poupa.nome : "N/A"));
    const dataFormatada = (typeof formatarData === "function" && data) ? formatarData(data) : (data || "-");
    tr.appendChild(criarTd(dataFormatada));
    tr.appendChild(criarTd(quantidade.toLocaleString("pt-BR"), "text-end"));
    tr.appendChild(criarTd(motivo));
    tr.appendChild(criarTd(observacoes));

    tbody.appendChild(tr);
  });

  resumo.textContent = `Total descartado: ${totalQtd.toLocaleString("pt-BR")} jornal(is).`;
}

// ========== VISÃO EXECUTIVA (GRÁFICOS) ==========
let graficosVisaoExecutiva = {
  faturamentoPedidosMensal: null,
};

function destruirGraficoSeExistir(chave) {
  const g = graficosVisaoExecutiva[chave];
  if (g && typeof g.destroy === "function") {
    g.destroy();
  }
  graficosVisaoExecutiva[chave] = null;
}

function atualizarVisaoExecutiva() {
  if (typeof Chart === "undefined") {
    console.error("Chart.js não carregado.");
    return;
  }

  // Helper para obter ano e mês de uma data (aceita Date, 'YYYY-MM-DD' ou 'DD/MM/YYYY')
  const obterAnoMes = (valorData) => {
    if (!valorData) return null;
    // Se for Date
    if (valorData instanceof Date) {
      if (isNaN(valorData.getTime())) return null;
      return { ano: valorData.getFullYear(), mes: valorData.getMonth() + 1 };
    }
    const s = String(valorData).trim();
    if (!s) return null;
    // Tentar DD/MM/YYYY ou YYYY-MM-DD quebrando manualmente (não confiar em Date.parse por causa de locale)
    const partes = s.split(/[\/\-]/);
    if (partes.length === 3) {
      let ano, mes, dia;
      if (partes[0].length === 4) {
        // YYYY-MM-DD
        ano = Number(partes[0]);
        mes = Number(partes[1]);
        dia = Number(partes[2]);
      } else {
        // DD/MM/YYYY
        dia = Number(partes[0]);
        mes = Number(partes[1]);
        ano = Number(partes[2]);
      }
      if (!ano || !mes || !dia) return null;
      return { ano, mes };
    }
    return null;
  };

  // Gráfico 1: Faturamento x Pedidos x Média mensal
  const ctxFP = document.getElementById("graficoFaturamentoPedidos");
  if (ctxFP) {
    const mapaMeses = new Map();
    (receitas || []).forEach((r) => {
      const info = obterAnoMes(r?.data);
      if (!info) return;
      const anoMes = `${String(info.ano).padStart(4, "0")}-${String(info.mes).padStart(2, "0")}`;
      const atual = mapaMeses.get(anoMes) || { faturamento: 0, pedidos: 0 };
      const fat = Number(r.faturamento || 0);
      const pedidos = Number(r.total_pedidos ?? r.totalPedidos ?? 0);
      atual.faturamento += isNaN(fat) ? 0 : fat;
      atual.pedidos += isNaN(pedidos) ? 0 : pedidos;
      mapaMeses.set(anoMes, atual);
    });

    const chavesOrdenadas = Array.from(mapaMeses.keys()).sort();
    const labelsMeses = chavesOrdenadas.map((ym) => {
      const [ano, mes] = ym.split("-");
      return `${mes}/${ano}`;
    });
    const dadosFaturamento = chavesOrdenadas.map((ym) => mapaMeses.get(ym).faturamento);
    const dadosPedidos = chavesOrdenadas.map((ym) => mapaMeses.get(ym).pedidos);

    const mediaFaturamento =
      dadosFaturamento.length > 0
        ? dadosFaturamento.reduce((sum, v) => sum + v, 0) / dadosFaturamento.length
        : 0;
    const dadosMedia = dadosFaturamento.map(() => Number(mediaFaturamento.toFixed(2)));

    destruirGraficoSeExistir("faturamentoPedidosMensal");
    graficosVisaoExecutiva.faturamentoPedidosMensal = new Chart(ctxFP.getContext("2d"), {
      data: {
        labels: labelsMeses,
        datasets: [
          {
            type: "bar",
            label: "Faturamento (R$)",
            data: dadosFaturamento,
            backgroundColor: "#0d6efd",
            yAxisID: "y",
          },
          {
            type: "line",
            label: "Qtd. Pedidos",
            data: dadosPedidos,
            borderColor: "#ffc107",
            backgroundColor: "#ffc107",
            tension: 0.2,
            yAxisID: "y1",
          },
          {
            type: "line",
            label: "Média de Faturamento",
            data: dadosMedia,
            borderColor: "#198754",
            borderDash: [6, 4],
            pointRadius: 0,
            tension: 0,
            yAxisID: "y",
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom" },
        },
        scales: {
          y: {
            position: "left",
            beginAtZero: true,
          },
          y1: {
            position: "right",
            beginAtZero: true,
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  // Quadro comparativo 2025 x 2026 mês a mês
  const tbodyComp = document.querySelector("#tabelaComparativo2526 tbody");
  const resumoComp = document.getElementById("resumoComparativo2526");
  if (tbodyComp) {
    tbodyComp.innerHTML = "";
    const ano1 = 2025;
    const ano2 = 2026;

    const mapaAno1 = new Map(); // mês (1-12) -> valor
    const mapaAno2 = new Map();

    (receitas || []).forEach((r) => {
      if (!r) return;
      const info = obterAnoMes(r.data);
      if (!info) return;
      const ano = info.ano;
      const mes = info.mes;
      const valor = Number(r.faturamento || 0);
      if (ano === ano1) {
        mapaAno1.set(mes, (mapaAno1.get(mes) || 0) + (isNaN(valor) ? 0 : valor));
      } else if (ano === ano2) {
        mapaAno2.set(mes, (mapaAno2.get(mes) || 0) + (isNaN(valor) ? 0 : valor));
      }
    });

    const nomesMeses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    let mesesComDados = 0;
    let somaAno1 = 0;
    let somaAno2 = 0;

    for (let mes = 1; mes <= 12; mes++) {
      const v1 = mapaAno1.get(mes) || 0;
      const v2 = mapaAno2.get(mes) || 0;
      if (v1 === 0 && v2 === 0) continue;
      mesesComDados++;

      somaAno1 += v1;
      somaAno2 += v2;

      const diff = v2 - v1;
      const diffPct = v1 > 0 ? (diff / v1) * 100 : null;

      const tr = document.createElement("tr");

      const tdMes = document.createElement("td");
      tdMes.textContent = nomesMeses[mes - 1];
      tr.appendChild(tdMes);

      const tdAno1 = document.createElement("td");
      tdAno1.className = "text-end";
      tdAno1.textContent = formatarMoeda(v1);

      const tdAno2 = document.createElement("td");
      tdAno2.className = "text-end";
      tdAno2.textContent = formatarMoeda(v2);

      // Destaque de quem faturou mais
      if (v2 > v1) {
        tdAno2.classList.add("fw-bold", "text-success");
      } else if (v1 > v2) {
        tdAno1.classList.add("fw-bold", "text-success");
      }

      tr.appendChild(tdAno1);
      tr.appendChild(tdAno2);

      const tdDiff = document.createElement("td");
      tdDiff.className = "text-end";
      tdDiff.textContent = formatarMoeda(diff);
      if (diff > 0) {
        tdDiff.classList.add("text-success");
      } else if (diff < 0) {
        tdDiff.classList.add("text-danger");
      }
      tr.appendChild(tdDiff);

      const tdPct = document.createElement("td");
      tdPct.className = "text-end";
      if (diffPct === null) {
        tdPct.textContent = "-";
      } else {
        const sinal = diffPct > 0 ? "+" : "";
        tdPct.textContent = `${sinal}${diffPct.toFixed(1)}%`;
        if (diffPct > 0) tdPct.classList.add("text-success");
        else if (diffPct < 0) tdPct.classList.add("text-danger");
      }
      tr.appendChild(tdPct);

      tbodyComp.appendChild(tr);
    }

    // Linha totalizadora
    if (mesesComDados > 0) {
      const diffTotal = somaAno2 - somaAno1;
      const diffPctTotal = somaAno1 > 0 ? (diffTotal / somaAno1) * 100 : null;

      const trTotal = document.createElement("tr");
      trTotal.classList.add("fw-semibold");

      const tdLabel = document.createElement("td");
      tdLabel.textContent = "Total";
      trTotal.appendChild(tdLabel);

      const tdTot1 = document.createElement("td");
      tdTot1.className = "text-end";
      tdTot1.textContent = formatarMoeda(somaAno1);

      const tdTot2 = document.createElement("td");
      tdTot2.className = "text-end";
      tdTot2.textContent = formatarMoeda(somaAno2);

      if (somaAno2 > somaAno1) {
        tdTot2.classList.add("text-success");
      } else if (somaAno1 > somaAno2) {
        tdTot1.classList.add("text-success");
      }

      trTotal.appendChild(tdTot1);
      trTotal.appendChild(tdTot2);

      const tdDiffTot = document.createElement("td");
      tdDiffTot.className = "text-end";
      tdDiffTot.textContent = formatarMoeda(diffTotal);
      if (diffTotal > 0) tdDiffTot.classList.add("text-success");
      else if (diffTotal < 0) tdDiffTot.classList.add("text-danger");
      trTotal.appendChild(tdDiffTot);

      const tdPctTot = document.createElement("td");
      tdPctTot.className = "text-end";
      if (diffPctTotal === null) {
        tdPctTot.textContent = "-";
      } else {
        const sinal = diffPctTotal > 0 ? "+" : "";
        tdPctTot.textContent = `${sinal}${diffPctTotal.toFixed(1)}%`;
        if (diffPctTotal > 0) tdPctTot.classList.add("text-success");
        else if (diffPctTotal < 0) tdPctTot.classList.add("text-danger");
      }
      trTotal.appendChild(tdPctTot);

      tbodyComp.appendChild(trTotal);
    }

    // Card de média mensal 2025 x 2026
    const elMedia25 = document.getElementById("mediaMensal2025");
    const elMedia26 = document.getElementById("mediaMensal2026");
    const elMediaDiffValor = document.getElementById("mediaMensalDiffValor");
    const elMediaDiffPct = document.getElementById("mediaMensalDiffPct");

    // Média deve considerar apenas meses "fechados" no ano corrente:
    // se estamos em março/2026, usamos janeiro e fevereiro de 2025 e 2026.
    let mesesFechados = new Date().getMonth(); // mês atual (1-12) menos 1
    if (mesesFechados < 1) mesesFechados = 1;
    if (mesesFechados > 12) mesesFechados = 12;

    let somaAno1Fechados = 0;
    let somaAno2Fechados = 0;
    for (let mes = 1; mes <= mesesFechados; mes++) {
      somaAno1Fechados += mapaAno1.get(mes) || 0;
      somaAno2Fechados += mapaAno2.get(mes) || 0;
    }

    const denom = mesesFechados; // mesmo número de meses para ambos os anos
    const media25 = denom > 0 ? somaAno1Fechados / denom : 0;
    const media26 = denom > 0 ? somaAno2Fechados / denom : 0;
    const diffMedia = media26 - media25;
    const diffMediaPct = media25 > 0 ? (diffMedia / media25) * 100 : null;

    if (elMedia25) {
      elMedia25.textContent = formatarMoeda(media25);
      elMedia25.className = "fw-semibold";
    }
    if (elMedia26) {
      elMedia26.textContent = formatarMoeda(media26);
      elMedia26.className = "fw-semibold";
    }
    if (elMediaDiffValor) {
      elMediaDiffValor.textContent = formatarMoeda(diffMedia);
      elMediaDiffValor.className = "fw-semibold " + (diffMedia > 0 ? "text-success" : diffMedia < 0 ? "text-danger" : "text-muted");
    }
    if (elMediaDiffPct) {
      if (diffMediaPct == null) {
        elMediaDiffPct.textContent = "-";
        elMediaDiffPct.className = "fw-semibold text-muted";
      } else {
        const sinal = diffMediaPct > 0 ? "+" : "";
        elMediaDiffPct.textContent = `${sinal}${diffMediaPct.toFixed(1)}%`;
        elMediaDiffPct.className = "fw-semibold " + (diffMediaPct > 0 ? "text-success" : diffMediaPct < 0 ? "text-danger" : "text-muted");
      }
    }

    if (resumoComp) {
      if (mesesComDados === 0) {
        resumoComp.textContent = "Nenhum dado de faturamento encontrado para 2025 e 2026.";
      } else {
        resumoComp.textContent = `Comparando faturamento mensal entre ${ano1} e ${ano2}. Meses com dados: ${mesesComDados}.`;
      }
    }
  }
}

// Exportação de relatórios em CSV (event listeners movidos para o bloco principal de DOMContentLoaded)

function exportarRelatorioRecebimentosCsv() {
  if (!registros.length) {
    alert("Não há registros para exportar.");
    return;
  }

  const selectPoupa = document.getElementById("relFiltroPoupatempo");
  if (!selectPoupa) return;
  const elInicio = document.getElementById("relDataInicio");
  const elFim = document.getElementById("relDataFim");
  const dataInicio = (elInicio && elInicio.value) ? elInicio.value : "";
  const dataFim = (elFim && elFim.value) ? elFim.value : "";
  const filtroPoupa = selectPoupa.value;

  let lista = [...registros];

  if (filtroPoupa) {
    lista = lista.filter((r) => (r.poupatempoId ?? r.poupatempo_id) === filtroPoupa);
  }

  if (dataInicio) {
    lista = lista.filter((r) => (r.dataEdicao ?? r.data_edicao) >= dataInicio);
  }

  if (dataFim) {
    lista = lista.filter((r) => (r.dataEdicao ?? r.data_edicao) <= dataFim);
  }

  if (!lista.length) {
    alert("Não há registros com os filtros informados.");
    return;
  }

  const cabecalho = [
    "Poupatempo",
    "Data_Edicao",
    "Data_Recebimento",
    "Quantidade",
    "Observacoes",
  ];
  const linhas = lista.map((r) => {
    const poupa = typeof obterPoupatempoPorId === "function" ? obterPoupatempoPorId(r.poupatempoId ?? r.poupatempo_id) : null;
    return [
      poupa ? poupa.nome : "N/A",
      r.dataEdicao ?? r.data_edicao ?? "",
      r.dataRecebimento ?? r.data_recebimento ?? "",
      r.quantidade ?? "",
      String(r.observacoes ?? "").replace(/"/g, '""'),
    ];
  });

  const conteudo = [cabecalho, ...linhas]
    .map((cols) =>
      cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")
    )
    .join("\r\n");

  downloadCsv(
    conteudo,
    `relatorio_recebimentos_${new Date().toISOString().slice(0, 10)}.csv`
  );
}

function exportarRelatorioFinanceiroCsv() {
  const fechamentosAprovados = fechamentos.filter((f) => f.status === "aprovado");
  const custoOperacional = fechamentosAprovados.reduce(
    (sum, f) => sum + Number(f.valorTotal || 0),
    0
  );
  const totalInvestimento = investimentos.reduce((sum, inv) => {
    const totalAno =
      (Number(inv.operacional) || 0) +
      (Number(inv.impressao) || 0) +
      (Number(inv.distribuicao) || 0);
    return sum + totalAno;
  }, 0);
  const totalReceita = receitas.reduce(
    (sum, r) => sum + Number(r.faturamento || 0),
    0
  );
  const investimentoRestante = totalInvestimento - custoOperacional;
  const coberturaInvestimento = totalReceita - totalInvestimento;

  const cabecalho = [
    "Custo_Operacional",
    "Investimento_Total",
    "Receita_Total",
    "Investimento_Restante",
    "Cobertura_Investimento",
  ];
  const linha = [
    custoOperacional,
    totalInvestimento,
    totalReceita,
    investimentoRestante,
    coberturaInvestimento,
  ];

  const conteudo = [cabecalho, linha]
    .map((cols) =>
      cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")
    )
    .join("\r\n");

  downloadCsv(
    conteudo,
    `relatorio_financeiro_${new Date().toISOString().slice(0, 10)}.csv`
  );
}

function mostrarSecaoMensagens() {
  // Abrir modal de mensagens
  const modal = new bootstrap.Modal(document.getElementById('modalMensagens'));
  modal.show();
  
  // Atualizar conteúdo quando o modal for exibido
  document.getElementById('modalMensagens').addEventListener('shown.bs.modal', function () {
    if (typeof atualizarListaUsuariosMensagem === 'function') {
      atualizarListaUsuariosMensagem();
    }
    if (typeof atualizarListaMensagens === 'function') {
      atualizarListaMensagens();
    }
  }, { once: true });
  
  // Remover classe active do menu (já que não é mais uma seção)
  document.getElementById("menu-mensagens").classList.remove("active");
  const menuVisao = document.getElementById("menu-visao-executiva");
  if (menuVisao) menuVisao.classList.remove("active");
}

function atualizarTabelaPoupatempos() {
  const tbody = document.querySelector("#tabelaPoupatempos tbody");
  if (!tbody) return;

  if (!poupatempos.length) {
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "text-center text-muted";
    td.textContent = "Nenhum Poupatempo cadastrado.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    const controles = document.getElementById("paginacaoPoupatempos");
    if (controles) controles.remove();
  } else {
    const renderizarLinha = (p) => {
      const tr = document.createElement("tr");

      tr.appendChild(criarTd(p.nome));
      // Formatar CEP se existir
      const cepFormatado = p.cep ? (p.cep.length === 8 ? `${p.cep.substring(0, 5)}-${p.cep.substring(5)}` : p.cep) : "-";
      tr.appendChild(criarTd(cepFormatado));
      tr.appendChild(criarTd(p.endereco));
      // Mostrar Gerente (compatibilidade com dados antigos e Supabase)
      const gerenteNome = p.gerente_nome || p.gerenteNome || p.responsavelNome || "";
      const gerenteEmail = p.gerente_email || p.gerenteEmail || p.responsavelEmail || "";
      const gerenteInfo = gerenteNome ? `${gerenteNome}${gerenteEmail ? ` (${gerenteEmail})` : ""}` : "-";
      tr.appendChild(criarTd(gerenteInfo));
      const quantidade = p.quantidade_esperada ?? p.quantidadeEsperada ?? "-";
      const tdQtd = criarTd(quantidade);
      tdQtd.className = "text-end";
      tr.appendChild(tdQtd);

      const tdAcoes = document.createElement("td");
      tdAcoes.className = "text-end";
      
      const btnEditar = document.createElement("button");
      btnEditar.className = "btn btn-sm btn-outline-primary me-2";
      btnEditar.textContent = "Editar";
      btnEditar.addEventListener("click", () => editarPoupatempo(p.id));
      
      const btnExcluir = document.createElement("button");
      btnExcluir.className = "btn btn-sm btn-outline-danger";
      btnExcluir.textContent = "Excluir";
      btnExcluir.addEventListener("click", () => excluirPoupatempo(p.id));
      
      tdAcoes.appendChild(btnEditar);
      tdAcoes.appendChild(btnExcluir);
      tr.appendChild(tdAcoes);

      tbody.appendChild(tr);
    };
    
    aplicarPaginacaoTabela(poupatempos, tbody, renderizarLinha, "paginacaoPoupatempos", atualizarTabelaPoupatempos);
  }

  document.getElementById("resumoPoupatempos").textContent = `Total: ${poupatempos.length} Poupatempo(s) cadastrado(s).`;
}

// Estado de paginação para cada tabela
const estadoPaginacao = {};
// Mapeamento de idControles para função de atualização
const funcoesAtualizacaoTabela = {};

// Função genérica de paginação para tabelas
function aplicarPaginacaoTabela(lista, tbody, renderizarLinha, idControles, funcaoAtualizacao, itensPorPagina = 30) {
  if (!tbody) return lista;
  
  const totalItens = lista.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  
  // Se não precisa paginar, renderizar tudo
  if (totalItens <= itensPorPagina) {
    tbody.innerHTML = "";
    lista.forEach(renderizarLinha);
    // Remover controles de paginação se existirem
    const controles = document.getElementById(idControles);
    if (controles) controles.remove();
    return lista;
  }
  
  // Inicializar estado se não existir
  if (!estadoPaginacao[idControles]) {
    estadoPaginacao[idControles] = { paginaAtual: 1 };
  }
  
  // Armazenar função de atualização
  if (funcaoAtualizacao) {
    funcoesAtualizacaoTabela[idControles] = funcaoAtualizacao;
  }
  
  const paginaAtual = estadoPaginacao[idControles].paginaAtual;
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const itensPagina = lista.slice(inicio, fim);
  
  tbody.innerHTML = "";
  itensPagina.forEach(renderizarLinha);
  
  // Criar ou atualizar controles de paginação
  let controlesDiv = document.getElementById(idControles);
  if (!controlesDiv) {
    controlesDiv = document.createElement("div");
    controlesDiv.id = idControles;
    controlesDiv.className = "d-flex justify-content-between align-items-center mt-3";
    const tabela = tbody.closest("table");
    if (tabela && tabela.parentElement) {
      tabela.parentElement.appendChild(controlesDiv);
    }
  }
  
  controlesDiv.innerHTML = `
    <div class="text-muted small">
      Exibindo ${inicio + 1} a ${Math.min(fim, totalItens)} de ${totalItens} registro(s)
    </div>
    <div class="btn-group" role="group">
      <button type="button" class="btn btn-sm btn-outline-secondary" ${paginaAtual === 1 ? "disabled" : ""} onclick="irParaPagina('${idControles}', ${paginaAtual - 1}, ${totalPaginas})">
        <i class="bi bi-chevron-left"></i> Anterior
      </button>
      <button type="button" class="btn btn-sm btn-outline-secondary" disabled>
        Página ${paginaAtual} de ${totalPaginas}
      </button>
      <button type="button" class="btn btn-sm btn-outline-secondary" ${paginaAtual === totalPaginas ? "disabled" : ""} onclick="irParaPagina('${idControles}', ${paginaAtual + 1}, ${totalPaginas})">
        Próxima <i class="bi bi-chevron-right"></i>
      </button>
    </div>
  `;
  
  return itensPagina;
}

// Função global para navegar entre páginas
window.irParaPagina = function(idControles, novaPagina, totalPaginas) {
  if (novaPagina < 1 || novaPagina > totalPaginas) return;
  estadoPaginacao[idControles].paginaAtual = novaPagina;
  // Chamar função de atualização correspondente
  if (funcoesAtualizacaoTabela[idControles]) {
    funcoesAtualizacaoTabela[idControles]();
  }
};

function criarTd(texto, className = "") {
  const td = document.createElement("td");
  td.textContent = texto;
  if (className) {
    td.className = className;
  }
  return td;
}

function editarPoupatempo(id) {
  const poupatempo = poupatempos.find((p) => p.id === id);
  if (!poupatempo) return;

  // Preencher formulário com os dados
  document.getElementById("poupatempoIdEdicao").value = poupatempo.id;
  document.getElementById("nomePoupatempo").value = poupatempo.nome;
  
  // Formatar CEP
  const cepFormatado = poupatempo.cep ? (poupatempo.cep.length === 8 ? `${poupatempo.cep.substring(0, 5)}-${poupatempo.cep.substring(5)}` : poupatempo.cep) : "";
  document.getElementById("cepPoupatempo").value = cepFormatado;
  
  document.getElementById("enderecoPoupatempo").value = poupatempo.endereco;
  document.getElementById("telefonePoupatempo").value = poupatempo.telefone || "";
  
  // Preencher dados do Gerente (compatibilidade camelCase, snake_case Supabase e dados antigos)
  document.getElementById("gerenteNome").value = (poupatempo.gerenteNome ?? poupatempo.gerente_nome) || poupatempo.responsavelNome || "";
  document.getElementById("gerenteEmail").value = (poupatempo.gerenteEmail ?? poupatempo.gerente_email) || poupatempo.responsavelEmail || "";
  // Não preencher senha na edição por segurança - deixar vazio para o admin definir nova senha se necessário
  document.getElementById("gerenteSenha").value = "";
  document.getElementById("gerenteSenha").required = false; // Tornar opcional na edição
  document.getElementById("gerenteSenha").placeholder = "Deixe em branco para manter a senha atual";
  
  // Preencher dados do Coordenador (compatibilidade camelCase e snake_case Supabase)
  document.getElementById("coordenadorNome").value = (poupatempo.coordenadorNome ?? poupatempo.coordenador_nome) || "";
  document.getElementById("coordenadorEmail").value = (poupatempo.coordenadorEmail ?? poupatempo.coordenador_email) || "";
  // Não preencher senha na edição por segurança - deixar vazio para o admin definir nova senha se necessário
  document.getElementById("coordenadorSenha").value = "";
  document.getElementById("coordenadorSenha").required = false; // Tornar opcional na edição
  document.getElementById("coordenadorSenha").placeholder = "Deixe em branco para manter a senha atual";
  
  document.getElementById("quantidadeEsperada").value = poupatempo.quantidadeEsperada ?? poupatempo.quantidade_esperada ?? "";

  // Alterar título e botões
  document.getElementById("tituloFormulario").textContent = "Editar Poupatempo";
  document.getElementById("btnSalvarPoupatempo").textContent = "Atualizar Poupatempo";
  document.getElementById("btnCancelarEdicao").classList.remove("d-none");

  // Limpar mensagem do CEP
  document.getElementById("mensagemCep").innerHTML = "";

  // Rolar para o topo do formulário
  document.getElementById("painel-cadastro").scrollIntoView({ behavior: "smooth" });
  
  // Mudar para a aba de cadastro
  const tabCadastro = document.getElementById("tab-cadastro");
  if (tabCadastro) {
    const tab = new bootstrap.Tab(tabCadastro);
    tab.show();
  }
}

function cancelarEdicao() {
  const mensagemCadastro = document.getElementById("mensagemCadastro");
  document.getElementById("poupatempoIdEdicao").value = "";
  document.getElementById("cadastroPoupatempoForm").reset();
  document.getElementById("tituloFormulario").textContent = "Cadastrar Novo Poupatempo";
  document.getElementById("btnSalvarPoupatempo").textContent = "Salvar Poupatempo";
  document.getElementById("btnCancelarEdicao").classList.add("d-none");
  document.getElementById("mensagemCep").innerHTML = "";
  // Restaurar campos de senha como obrigatórios e placeholder
  document.getElementById("gerenteSenha").required = true;
  document.getElementById("gerenteSenha").placeholder = "Defina a senha de acesso";
  document.getElementById("coordenadorSenha").required = true;
  document.getElementById("coordenadorSenha").placeholder = "Defina a senha de acesso";
  mensagemCadastro.classList.add("d-none");
}

function excluirPoupatempo(id) {
  if (!confirm("Confirma a exclusão deste Poupatempo? Esta ação não pode ser desfeita.")) return;
  poupatempos = poupatempos.filter((p) => p.id !== id);
  usuarios = usuarios.filter((u) => u.poupatempoId !== id);
  salvarPoupatempos();
  salvarUsuarios();
  atualizarTabelaPoupatempos();
  popularSelectFiltroAdmin();
  
  // Se estava editando o item excluído, cancelar edição
  if (document.getElementById("poupatempoIdEdicao").value === id) {
    cancelarEdicao();
  }
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
  if (!tbody) return;

  const lista = filtrados || registros;

  if (!lista.length) {
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "text-center text-muted";
    td.textContent = "Nenhum registro encontrado.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    const controles = document.getElementById("paginacaoRegistrosAdmin");
    if (controles) controles.remove();
  } else {
    const renderizarLinha = (reg) => {
      const poupaId = reg.poupatempoId ?? reg.poupatempo_id;
      const dataEd = reg.dataEdicao ?? reg.data_edicao;
      const dataRec = reg.dataRecebimento ?? reg.data_recebimento;
      const poupatempo = obterPoupatempoPorId(poupaId);
      const tr = document.createElement("tr");

      // Verificar se deve destacar a linha
      const deveDestacar = verificarSeDeveDestacarRegistro(reg);
      if (deveDestacar) {
        tr.classList.add("table-danger", "fw-semibold");
        tr.style.backgroundColor = "#f8d7da";
      }

      tr.appendChild(criarTd(poupatempo ? poupatempo.nome : "N/A"));
      tr.appendChild(criarTd(formatarData(dataEd)));
      tr.appendChild(criarTd(formatarData(dataRec)));
      
      // Calcular diferença de dias
      const diasDiferenca = calcularDiferencaDias(dataEd, dataRec);
      const tdDias = criarTd(diasDiferenca !== null ? diasDiferenca.toString() : "-");
      tdDias.className = "text-end";
      if (diasDiferenca !== null) {
        if (diasDiferenca > 3) {
          tdDias.classList.add("text-danger", "fw-bold");
        } else if (diasDiferenca > 1) {
          tdDias.classList.add("text-warning");
        }
      }
      tr.appendChild(tdDias);
      
      const tdQtd = criarTd(reg.quantidade);
      tdQtd.className = "text-end";
      tr.appendChild(tdQtd);
      tr.appendChild(criarTd(reg.observacoes || "-"));

      const tdAcoes = document.createElement("td");
      tdAcoes.className = "text-end";
      const btnExcluir = document.createElement("button");
      btnExcluir.className = "btn btn-sm btn-outline-danger";
      btnExcluir.textContent = "Excluir";
      btnExcluir.addEventListener("click", () => excluirRegistroAdmin(reg.id));
      tdAcoes.appendChild(btnExcluir);
      tr.appendChild(tdAcoes);

      tbody.appendChild(tr);
    };
    
    aplicarPaginacaoTabela(lista, tbody, renderizarLinha, "paginacaoRegistrosAdmin", () => atualizarTabelaRegistrosAdmin(filtrados));
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
    lista = lista.filter((r) => (r.poupatempoId ?? r.poupatempo_id) === filtroPoupa);
  }

  if (filtroDataEd) {
    lista = lista.filter((r) => (r.dataEdicao ?? r.data_edicao) === filtroDataEd);
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

  const cabecalho = ["Nome", "CEP", "Endereco", "Gerente_Nome", "Gerente_Email", "Coordenador_Nome", "Coordenador_Email", "Quantidade_Esperada"];
  const linhas = poupatempos.map((p) => {
    const cepFormatado = p.cep ? (p.cep.length === 8 ? `${p.cep.substring(0, 5)}-${p.cep.substring(5)}` : p.cep) : "";
    return [
      p.nome,
      cepFormatado,
      p.endereco,
      (p.gerente_nome || p.gerenteNome || p.responsavelNome || ""),
      (p.gerente_email || p.gerenteEmail || p.responsavelEmail || ""),
      (p.coordenador_nome || p.coordenadorNome || ""),
      (p.coordenador_email || p.coordenadorEmail || ""),
      (p.quantidade_esperada ?? p.quantidadeEsperada ?? ""),
    ];
  });

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

  const cabecalho = ["Poupatempo", "Data_Edicao", "Data_Recebimento", "Qtd_Dias", "Quantidade", "Observacoes"];
  const linhas = registros.map((r) => {
    const poupatempo = obterPoupatempoPorId(r.poupatempoId ?? r.poupatempo_id);
    const diasDiferenca = calcularDiferencaDias(r.dataEdicao ?? r.data_edicao, r.dataRecebimento ?? r.data_recebimento);
    return [
      poupatempo ? poupatempo.nome : "N/A",
      r.dataEdicao ?? r.data_edicao,
      r.dataRecebimento ?? r.data_recebimento,
      diasDiferenca !== null ? diasDiferenca.toString() : "",
      r.quantidade,
      (r.observacoes || "").replace(/"/g, '""'),
    ];
  });

  const conteudo = [cabecalho, ...linhas]
    .map((cols) => cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  downloadCsv(conteudo, `registros_diario_oficial_${new Date().toISOString().slice(0, 10)}.csv`);
}

async function excluirRegistroAdmin(id) {
  if (!confirm("Confirma a exclusão deste registro?")) return;
  await excluirRegistro(id);
  aplicarFiltrosAdmin();
}

// ========== FUNÇÕES FINANCEIRAS ==========
function atualizarTabelaInvestimentos() {
  const tbody = document.querySelector("#tabelaInvestimentos tbody");
  if (!tbody) return;
  
  if (!investimentos.length) {
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "text-center text-muted";
    td.textContent = "Nenhum investimento cadastrado.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    const controles = document.getElementById("paginacaoInvestimentos");
    if (controles) controles.remove();
  } else {
    const listaOrdenada = [...investimentos].sort((a, b) => b.ano - a.ano);
    const renderizarLinha = (inv) => {
      const tr = document.createElement("tr");
      const total = inv.operacional + inv.impressao + inv.distribuicao;

      tr.appendChild(criarTd(inv.ano));
      tr.appendChild(criarTd(formatarMoeda(inv.operacional), "text-end"));
      tr.appendChild(criarTd(formatarMoeda(inv.impressao), "text-end"));
      tr.appendChild(criarTd(formatarMoeda(inv.distribuicao), "text-end"));
      tr.appendChild(criarTd(formatarMoeda(total), "text-end fw-bold"));

      const tdAcoes = document.createElement("td");
      tdAcoes.className = "text-end";
      const btnExcluir = document.createElement("button");
      btnExcluir.className = "btn btn-sm btn-outline-danger";
      btnExcluir.textContent = "Excluir";
      btnExcluir.addEventListener("click", () => {
        if (confirm("Confirma a exclusão deste investimento?")) {
          excluirInvestimento(inv.id);
          atualizarTabelaInvestimentos();
        }
      });
      tdAcoes.appendChild(btnExcluir);
      tr.appendChild(tdAcoes);

      tbody.appendChild(tr);
    };
    
    aplicarPaginacaoTabela(listaOrdenada, tbody, renderizarLinha, "paginacaoInvestimentos", atualizarTabelaInvestimentos);
  }
}

function atualizarTabelaReceitas() {
  const tbody = document.querySelector("#tabelaReceitas tbody");
  if (!tbody) return;

  // Aplicar filtros de mês/ano, se informados
  let lista = [...(receitas || [])];
  const mesInput = document.getElementById("filtroMesReceita");
  const anoInput = document.getElementById("filtroAnoReceita");
  const filtroMes = mesInput && mesInput.value ? Number(mesInput.value) : null;
  const filtroAno = anoInput && anoInput.value ? Number(anoInput.value) : null;

  if (filtroMes || filtroAno) {
    lista = lista.filter((rec) => {
      if (!rec || !rec.data) return false;
      let ano = null;
      let mes = null;
      const s = String(rec.data).trim();
      const partes = s.split(/[\/\-]/);
      if (partes.length === 3) {
        if (partes[0].length === 4) {
          // YYYY-MM-DD
          ano = Number(partes[0]);
          mes = Number(partes[1]);
        } else {
          // DD/MM/YYYY
          ano = Number(partes[2]);
          mes = Number(partes[1]);
        }
      }
      if (!ano || !mes) return false;
      if (filtroAno && ano !== filtroAno) return false;
      if (filtroMes && mes !== filtroMes) return false;
      return true;
    });
  }

  if (!lista.length) {
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.className = "text-center text-muted";
    td.textContent = filtroMes || filtroAno ? "Nenhuma receita encontrada para o filtro informado." : "Nenhuma receita cadastrada.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    const controles = document.getElementById("paginacaoReceitas");
    if (controles) controles.remove();
  } else {
    const renderizarLinha = (rec) => {
      const tr = document.createElement("tr");
      const totalPedidos = rec.totalPedidos ?? rec.total_pedidos;

      const tdCheck = document.createElement("td");
      tdCheck.className = "text-center";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "form-check-input checkbox-receita";
      cb.value = rec.id;
      cb.addEventListener("change", atualizarBotaoExcluirReceitas);
      tdCheck.appendChild(cb);
      tr.appendChild(tdCheck);

      tr.appendChild(criarTd(formatarData(rec.data)));
      tr.appendChild(criarTd(formatarMoeda(rec.faturamento ?? 0), "text-end"));
      tr.appendChild(criarTd(totalPedidos ?? "-", "text-end"));

      const tdAcoes = document.createElement("td");
      tdAcoes.className = "text-end";
      const btnExcluir = document.createElement("button");
      btnExcluir.className = "btn btn-sm btn-outline-danger";
      btnExcluir.textContent = "Excluir";
      btnExcluir.addEventListener("click", () => {
        if (confirm("Confirma a exclusão desta receita?")) {
          excluirReceita(rec.id);
          atualizarTabelaReceitas();
        }
      });
      tdAcoes.appendChild(btnExcluir);
      tr.appendChild(tdAcoes);

      tbody.appendChild(tr);
    };
    
    aplicarPaginacaoTabela(lista, tbody, renderizarLinha, "paginacaoReceitas", atualizarTabelaReceitas);
  }
}

function atualizarBotaoExcluirReceitas() {
  const selecionados = document.querySelectorAll(".checkbox-receita:checked");
  const btn = document.getElementById("btnExcluirReceitasSelecionadas");
  if (btn) {
    btn.style.display = selecionados.length > 0 ? "inline-block" : "none";
  }
}

async function excluirReceitasSelecionadas() {
  const checkboxes = Array.from(document.querySelectorAll(".checkbox-receita:checked"));
  if (!checkboxes.length) return;
  if (!confirm(`Confirma a exclusão de ${checkboxes.length} receita(s) selecionada(s)?`)) return;

  const ids = checkboxes.map((cb) => cb.value);

  try {
    if (typeof excluirReceita === "function") {
      const isAsync = excluirReceita.constructor?.name === "AsyncFunction";
      if (isAsync) {
        for (const id of ids) {
          try {
            await excluirReceita(id);
          } catch (e) {
            console.error("Erro ao excluir receita (lote):", e);
          }
        }
      } else {
        ids.forEach((id) => {
          try {
            excluirReceita(id);
          } catch (e) {
            console.error("Erro ao excluir receita (lote):", e);
          }
        });
      }
    }
  } finally {
    try {
      if (typeof carregarReceitas === "function") {
        if (carregarReceitas.constructor?.name === "AsyncFunction") {
          await carregarReceitas();
        } else {
          carregarReceitas();
        }
      }
    } catch (e) {
      console.error("Erro ao recarregar receitas após exclusão em lote:", e);
    }
    atualizarTabelaReceitas();
    const checkTodas = document.getElementById("checkTodasReceitas");
    if (checkTodas) checkTodas.checked = false;
    atualizarBotaoExcluirReceitas();
  }
}

function atualizarTabelaFaturamentosAnuais() {
  const tbody = document.querySelector("#tabelaFaturamentosAnuais tbody");
  const resumo = document.getElementById("resumoFaturamentosAnuais");
  if (!tbody) return;

  const lista = (typeof faturamentosAnuais !== "undefined" ? faturamentosAnuais : []);

  if (!lista.length) {
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.className = "text-center text-muted";
    td.textContent = "Nenhum faturamento de referência cadastrado.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    const controles = document.getElementById("paginacaoFaturamentosAnuais");
    if (controles) controles.remove();
  } else {
    const listaOrdenada = [...lista].sort((a, b) => (b.ano || 0) - (a.ano || 0));
    const renderizarLinha = (f) => {
      const tr = document.createElement("tr");
      tr.appendChild(criarTd(f.ano));
      tr.appendChild(criarTd(formatarMoeda(Number(f.valor || 0)), "text-end"));
      const tdAc = document.createElement("td");
      tdAc.className = "text-end";
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-outline-danger";
      btn.textContent = "Excluir";
      btn.addEventListener("click", async () => {
        if (!confirm("Excluir o faturamento do ano " + f.ano + "?")) return;
        if (typeof excluirFaturamentoAnual === "function") {
          const fn = excluirFaturamentoAnual;
          if (fn.constructor?.name === "AsyncFunction") await fn(f.id);
          else fn(f.id);
        }
        atualizarTabelaFaturamentosAnuais();
      });
      tdAc.appendChild(btn);
      tr.appendChild(tdAc);
      tbody.appendChild(tr);
    };
    
    aplicarPaginacaoTabela(listaOrdenada, tbody, renderizarLinha, "paginacaoFaturamentosAnuais", atualizarTabelaFaturamentosAnuais);
  }
  if (resumo) resumo.textContent = "Total: " + lista.length + " ano(s) cadastrado(s).";
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function exportarInvestimentosCsv() {
  if (!investimentos.length) {
    alert("Não há investimentos para exportar.");
    return;
  }

  const cabecalho = ["Ano", "Operacional", "Impressao", "Distribuicao", "Total"];
  const linhas = investimentos.map((inv) => {
    const total = inv.operacional + inv.impressao + inv.distribuicao;
    return [inv.ano, inv.operacional, inv.impressao, inv.distribuicao, total];
  });

  const conteudo = [cabecalho, ...linhas]
    .map((cols) => cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  downloadCsv(conteudo, `investimentos_${new Date().toISOString().slice(0, 10)}.csv`);
}

function exportarReceitasCsv() {
  if (!receitas.length) {
    alert("Não há receitas para exportar.");
    return;
  }

  const cabecalho = ["Data", "Faturamento", "Total_Pedidos"];
  const linhas = receitas.map((rec) => [rec.data, rec.faturamento, rec.totalPedidos]);

  const conteudo = [cabecalho, ...linhas]
    .map((cols) => cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  downloadCsv(conteudo, `receitas_${new Date().toISOString().slice(0, 10)}.csv`);
}

async function importarReceitasCsv(arquivo) {
  const msg = document.getElementById("mensagemImportarReceitas");
  if (msg) {
    msg.className = "alert d-none";
    msg.textContent = "";
  }

  try {
    const texto = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || "");
      reader.onerror = () => reject(reader.error || new Error("Falha ao ler arquivo."));
      reader.readAsText(arquivo, "utf-8");
    });

    const linhas = String(texto).split(/\r?\n/).map(l => l.trim()).filter(l => l);
    if (linhas.length <= 1) {
      if (msg) {
        msg.textContent = "Arquivo CSV vazio ou sem dados.";
        msg.className = "alert alert-danger";
        msg.classList.remove("d-none");
      }
      return;
    }

    const header = linhas[0];
    const usaPontoEVirgula = (header.match(/;/g) || []).length >= (header.match(/,/g) || []).length;
    const sep = usaPontoEVirgula ? ";" : ",";

    const parseValorMonetarioCsv = (valorBruto) => {
      if (valorBruto == null) return NaN;
      let v = String(valorBruto).trim();
      if (!v) return NaN;
      // remover símbolo de moeda e espaços
      v = v.replace(/[R$\s]/g, "");
      const temVirgula = v.includes(",");
      const temPonto = v.includes(".");
      if (temVirgula && temPonto) {
        // Formato típico BR: 1.234,56
        v = v.replace(/\./g, "").replace(",", ".");
      } else if (temVirgula && !temPonto) {
        // Formato BR simples: 1234,56
        v = v.replace(",", ".");
      } else {
        // Apenas ponto (1234.56) ou apenas dígitos - usar direto
      }
      const n = parseFloat(v);
      return isNaN(n) ? NaN : n;
    };

    // Pré-análise: contar quantas linhas são válidas / inválidas
    let validas = 0;
    let invalidas = 0;

    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i];
      if (!linha) continue;
      const partes = linha.split(sep).map(p => p.trim());
      if (partes.length < 3) {
        invalidas++;
        continue;
      }
      const [data, fatStr, pedidosStr] = partes;
      if (!data) {
        invalidas++;
        continue;
      }
      const faturamento = parseValorMonetarioCsv(fatStr);
      const totalPedidos = parseInt(pedidosStr, 10);

      if (isNaN(faturamento) || isNaN(totalPedidos)) {
        invalidas++;
        continue;
      }

      validas++;
    }

    if (validas === 0) {
      if (msg) {
        msg.textContent = "Nenhum registro válido encontrado no arquivo CSV. Verifique o formato das colunas.";
        msg.className = "alert alert-danger";
        msg.classList.remove("d-none");
      }
      return;
    }

    const textoConfirmacao = `Pré-análise do arquivo:\n\n` +
      `Registros válidos para importação: ${validas}\n` +
      `Linhas com problema (serão ignoradas): ${invalidas}\n\n` +
      `Deseja confirmar a importação dos ${validas} registro(s) válidos?`;

    const confirmado = window.confirm(textoConfirmacao);
    if (!confirmado) {
      if (msg) {
        msg.textContent = "Importação cancelada. Nenhum registro foi importado.";
        msg.className = "alert alert-secondary";
        msg.classList.remove("d-none");
      }
      return;
    }

    // Importação efetiva
    let sucesso = 0;
    let falhas = 0;

    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i];
      if (!linha) continue;
      const partes = linha.split(sep).map(p => p.trim());
      if (partes.length < 3) {
        falhas++;
        continue;
      }
      const [data, fatStr, pedidosStr] = partes;
      if (!data) {
        falhas++;
        continue;
      }
      const faturamento = parseValorMonetarioCsv(fatStr);
      const totalPedidos = parseInt(pedidosStr, 10);

      if (isNaN(faturamento) || isNaN(totalPedidos)) {
        falhas++;
        continue;
      }

      try {
        const res = await cadastrarReceita({
          data,
          faturamento: faturamento,
          totalPedidos: totalPedidos,
        });
        if (res && res.sucesso) {
          sucesso++;
        } else {
          falhas++;
        }
      } catch {
        falhas++;
      }
    }

    // Recarregar receitas e atualizar tabela
    try {
      if (typeof carregarReceitas === "function") {
        if (carregarReceitas.constructor?.name === "AsyncFunction") {
          await carregarReceitas();
        } else {
          carregarReceitas();
        }
      }
    } catch (e) {
      console.error("Erro ao recarregar receitas após importação:", e);
    }
    atualizarTabelaReceitas();

    if (msg) {
      msg.textContent = `Importação concluída. ${sucesso} linha(s) importada(s) com sucesso, ${falhas} falha(s).`;
      msg.className = sucesso > 0 && falhas === 0 ? "alert alert-success" : "alert alert-warning";
      msg.classList.remove("d-none");
    }
  } catch (e) {
    console.error("Erro ao importar receitas CSV:", e);
    if (msg) {
      msg.textContent = e?.message || "Erro ao importar arquivo CSV de receitas.";
      msg.className = "alert alert-danger";
      msg.classList.remove("d-none");
    }
  }
}

// ========== FUNÇÕES DE PARCEIROS ==========
function atualizarTabelaParceiros() {
  const tbody = document.querySelector("#tabelaParceiros tbody");
  if (!tbody) return;
  
  if (!parceiros.length) {
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "text-center text-muted";
    td.textContent = "Nenhum parceiro cadastrado.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    const controles = document.getElementById("paginacaoParceiros");
    if (controles) controles.remove();
  } else {
    const renderizarLinha = (p) => {
      const tr = document.createElement("tr");

      tr.appendChild(criarTd(p.nome));
      // Formatar CEP se existir
      const cepFormatado = p.cep ? (p.cep.length === 8 ? `${p.cep.substring(0, 5)}-${p.cep.substring(5)}` : p.cep) : "-";
      tr.appendChild(criarTd(cepFormatado));
      tr.appendChild(criarTd(p.endereco));
      const serv = String(p.servicosContratados ?? "");
      tr.appendChild(criarTd(serv.length > 50 ? serv.substring(0, 50) + "..." : (serv || "-")));
      const responsavelInfo = `${p.responsavelNome ?? ""} (${p.responsavelEmail || ""})`;
      tr.appendChild(criarTd(responsavelInfo));

      const tdAcoes = document.createElement("td");
      tdAcoes.className = "text-end";
      
      const btnEditar = document.createElement("button");
      btnEditar.className = "btn btn-sm btn-outline-primary me-2";
      btnEditar.textContent = "Editar";
      btnEditar.addEventListener("click", () => editarParceiro(p.id));
      
      const btnExcluir = document.createElement("button");
      btnExcluir.className = "btn btn-sm btn-outline-danger";
      btnExcluir.textContent = "Excluir";
      btnExcluir.addEventListener("click", () => excluirParceiro(p.id));
      
      tdAcoes.appendChild(btnEditar);
      tdAcoes.appendChild(btnExcluir);
      tr.appendChild(tdAcoes);

      tbody.appendChild(tr);
    };
    
    aplicarPaginacaoTabela(parceiros, tbody, renderizarLinha, "paginacaoParceiros", atualizarTabelaParceiros);
  }

  document.getElementById("resumoParceiros").textContent = `Total: ${parceiros.length} parceiro(s) cadastrado(s).`;
}

function editarParceiro(id) {
  const parceiro = parceiros.find((p) => p.id === id);
  if (!parceiro) return;

  document.getElementById("parceiroIdEdicao").value = parceiro.id;
  document.getElementById("nomeParceiro").value = parceiro.nome;
  
  // Formatar CEP
  const cepFormatado = parceiro.cep ? (parceiro.cep.length === 8 ? `${parceiro.cep.substring(0, 5)}-${parceiro.cep.substring(5)}` : parceiro.cep) : "";
  document.getElementById("cepParceiro").value = cepFormatado;
  
  document.getElementById("enderecoParceiro").value = parceiro.endereco;
  document.getElementById("servicosContratados").value = parceiro.servicosContratados;
  document.getElementById("responsavelParceiroNome").value = parceiro.responsavelNome;
  document.getElementById("responsavelParceiroEmail").value = parceiro.responsavelEmail;
  document.getElementById("responsavelParceiroSenha").value = "";
  document.getElementById("responsavelParceiroSenha").required = false;
  document.getElementById("responsavelParceiroSenha").placeholder = "Deixe em branco para manter a senha atual";

  // Limpar mensagem do CEP
  document.getElementById("mensagemCepParceiro").innerHTML = "";

  document.getElementById("tituloFormularioParceiro").textContent = "Editar Parceiro";
  document.getElementById("btnSalvarParceiro").textContent = "Atualizar Parceiro";
  document.getElementById("btnCancelarEdicaoParceiro").classList.remove("d-none");

  const tabCadastro = document.getElementById("tab-cadastro-parceiro");
  if (tabCadastro) {
    const tab = new bootstrap.Tab(tabCadastro);
    tab.show();
  }
}

function cancelarEdicaoParceiro() {
  const mensagem = document.getElementById("mensagemCadastroParceiro");
  document.getElementById("parceiroIdEdicao").value = "";
  document.getElementById("cadastroParceiroForm").reset();
  document.getElementById("tituloFormularioParceiro").textContent = "Cadastrar Novo Parceiro";
  document.getElementById("btnSalvarParceiro").textContent = "Salvar Parceiro";
  document.getElementById("btnCancelarEdicaoParceiro").classList.add("d-none");
  document.getElementById("responsavelParceiroSenha").required = true;
  document.getElementById("responsavelParceiroSenha").placeholder = "Defina a senha de acesso";
  document.getElementById("mensagemCepParceiro").innerHTML = "";
  mensagem.classList.add("d-none");
}

function excluirParceiro(id) {
  if (!confirm("Confirma a exclusão deste Parceiro? Esta ação não pode ser desfeita.")) return;
  parceiros = parceiros.filter((p) => p.id !== id);
  usuarios = usuarios.filter((u) => u.parceiroId !== id);
  salvarParceiros();
  salvarUsuarios();
  atualizarTabelaParceiros();
  
  if (document.getElementById("parceiroIdEdicao").value === id) {
    cancelarEdicaoParceiro();
  }
}

function exportarParceirosCsv() {
  if (!parceiros.length) {
    alert("Não há parceiros para exportar.");
    return;
  }

  const cabecalho = ["Nome", "CEP", "Endereco", "Servicos_Contratados", "Responsavel_Nome", "Responsavel_Email"];
  const linhas = parceiros.map((p) => {
    const cepFormatado = p.cep ? (p.cep.length === 8 ? `${p.cep.substring(0, 5)}-${p.cep.substring(5)}` : p.cep) : "";
    return [
      p.nome,
      cepFormatado,
      p.endereco,
      p.servicosContratados,
      p.responsavelNome,
      p.responsavelEmail,
    ];
  });

  const conteudo = [cabecalho, ...linhas]
    .map((cols) => cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  downloadCsv(conteudo, `parceiros_${new Date().toISOString().slice(0, 10)}.csv`);
}

// ========== FUNÇÕES DE FECHAMENTOS ==========
async function atualizarTabelaFechamentos() {
  const tbody = document.querySelector("#tabelaFechamentos tbody");
  if (!tbody) return;

  const carregarAsync = typeof carregarFechamentos === "function" && carregarFechamentos.constructor.name === "AsyncFunction";
  if (carregarAsync) {
    await carregarFechamentos();
    await carregarParceiros();
  } else if (typeof carregarFechamentos === "function") {
    carregarFechamentos();
    carregarParceiros();
  }

  const fechamentosPendentes = typeof obterFechamentosPendentes === "function" ? obterFechamentosPendentes() : [];

  if (!fechamentosPendentes.length) {
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "text-center text-muted";
    td.textContent = "Nenhum fechamento pendente de aprovação.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    const controles = document.getElementById("paginacaoFechamentos");
    if (controles) controles.remove();
  } else {
    const ordenar = (a, b) => (b.criadoEm ?? b.criado_em ?? "").localeCompare(a.criadoEm ?? a.criado_em ?? "");
    const listaOrdenada = [...fechamentosPendentes].sort(ordenar);
    const renderizarLinha = (fechamento) => {
      const parcId = fechamento.parceiroId ?? fechamento.parceiro_id;
      const servIds = fechamento.servicosIds ?? fechamento.servicos_ids ?? [];
      const qtdTotal = fechamento.quantidadeTotal ?? fechamento.quantidade_total;
      const valTotal = fechamento.valorTotal ?? fechamento.valor_total;
      const criadoEm = fechamento.criadoEm ?? fechamento.criado_em;

      const tr = document.createElement("tr");
      const parceiro = (parceiros || []).find((p) => p.id === parcId);
      
      // Adicionar estilo de cursor pointer e evento de clique
      tr.style.cursor = "pointer";
      tr.addEventListener("click", (e) => {
        // Não abrir modal se clicar nos botões
        if (e.target.tagName === "BUTTON") return;
        mostrarDetalhesFechamento(fechamento);
      });

      tr.appendChild(criarTd(parceiro ? parceiro.nome : "Parceiro não encontrado"));
      tr.appendChild(criarTd(formatarDataHora(criadoEm)));
      tr.appendChild(criarTd(servIds.length, "text-end"));
      tr.appendChild(criarTd(qtdTotal != null ? qtdTotal : "-", "text-end"));
      const tdValor = criarTd(formatarMoeda(valTotal ?? 0));
      tdValor.className = "text-end fw-bold";
      tr.appendChild(tdValor);

      const tdAcoes = document.createElement("td");
      tdAcoes.className = "text-center";

      const btnAprovar = document.createElement("button");
      btnAprovar.className = "btn btn-sm btn-success me-2";
      btnAprovar.textContent = "Aprovar";
      btnAprovar.addEventListener("click", async () => {
        if (!confirm(`Deseja aprovar este fechamento?\nParceiro: ${parceiro ? parceiro.nome : "N/A"}\nValor Total: ${formatarMoeda(valTotal)}`)) return;
        const resultado = await aprovarFechamento(fechamento.id);
        alert(resultado?.mensagem || (resultado?.sucesso ? "Aprovado." : "Erro."));
        await atualizarTabelaFechamentos();
      });

      const btnRejeitar = document.createElement("button");
      btnRejeitar.className = "btn btn-sm btn-danger";
      btnRejeitar.textContent = "Rejeitar";
      btnRejeitar.addEventListener("click", async () => {
        if (!confirm(`Deseja rejeitar este fechamento?\nParceiro: ${parceiro ? parceiro.nome : "N/A"}\nValor Total: ${formatarMoeda(valTotal)}`)) return;
        const resultado = await rejeitarFechamento(fechamento.id);
        alert(resultado?.mensagem || (resultado?.sucesso ? "Rejeitado." : "Erro."));
        await atualizarTabelaFechamentos();
      });

      tdAcoes.appendChild(btnAprovar);
      tdAcoes.appendChild(btnRejeitar);
      tr.appendChild(tdAcoes);

      tbody.appendChild(tr);
    };
    
    aplicarPaginacaoTabela(listaOrdenada, tbody, renderizarLinha, "paginacaoFechamentos", atualizarTabelaFechamentos);
  }

  const elResumo = document.getElementById("resumoFechamentos");
  if (elResumo) elResumo.textContent = `Total: ${fechamentosPendentes.length} fechamento(s) pendente(s) de aprovação.`;

  // Tabela de Fechamentos Aprovados
  const obterAprovados = typeof obterFechamentosAprovados === "function" ? obterFechamentosAprovados : () => (typeof fechamentos !== "undefined" ? fechamentos : []).filter((f) => f && f.status === "aprovado");
  const fechamentosAprovados = obterAprovados();
  const tbodyAprovados = document.querySelector("#tabelaFechamentosAprovados tbody");
  if (tbodyAprovados) {
    if (!fechamentosAprovados.length) {
      tbodyAprovados.innerHTML = "";
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.className = "text-center text-muted";
      td.textContent = "Nenhum fechamento aprovado.";
      tr.appendChild(td);
      tbodyAprovados.appendChild(tr);
      const controles = document.getElementById("paginacaoFechamentosAprovados");
      if (controles) controles.remove();
    } else {
      const ordenarAprovados = (a, b) => (b.aprovado_em ?? b.aprovadoEm ?? b.criado_em ?? b.criadoEm ?? "").localeCompare(a.aprovado_em ?? a.aprovadoEm ?? a.criado_em ?? a.criadoEm ?? "");
      const listaAprovadosOrdenada = [...fechamentosAprovados].sort(ordenarAprovados);
      const renderizarLinhaAprovados = (fechamento) => {
        const parcId = fechamento.parceiroId ?? fechamento.parceiro_id;
        const servIds = fechamento.servicosIds ?? fechamento.servicos_ids ?? [];
        const qtdTotal = fechamento.quantidadeTotal ?? fechamento.quantidade_total;
        const valTotal = fechamento.valorTotal ?? fechamento.valor_total;
        const criadoEm = fechamento.criadoEm ?? fechamento.criado_em;
        const aprovadoEm = fechamento.aprovado_em ?? fechamento.aprovadoEm;
        const aprovadoPor = fechamento.aprovado_por ?? fechamento.aprovadoPor;
        const aprovador = (typeof usuarios !== "undefined" ? usuarios : []).find((u) => u.id === aprovadoPor);
        const tr = document.createElement("tr");
        const parceiro = (parceiros || []).find((p) => p.id === parcId);
        
        // Adicionar estilo de cursor pointer e evento de clique
        tr.style.cursor = "pointer";
        tr.addEventListener("click", () => {
          mostrarDetalhesFechamento(fechamento);
        });
        
        tr.appendChild(criarTd(parceiro ? parceiro.nome : "Parceiro não encontrado"));
        tr.appendChild(criarTd(formatarDataHora(criadoEm)));
        tr.appendChild(criarTd(formatarDataHora(aprovadoEm) || "—"));
        tr.appendChild(criarTd(servIds.length, "text-end"));
        tr.appendChild(criarTd(qtdTotal != null ? qtdTotal : "-", "text-end"));
        const tdValor = criarTd(formatarMoeda(valTotal ?? 0));
        tdValor.className = "text-end fw-bold";
        tr.appendChild(tdValor);
        tr.appendChild(criarTd((aprovador && aprovador.nome) ? aprovador.nome : (aprovadoPor || "—")));
        tbodyAprovados.appendChild(tr);
      };
      
      aplicarPaginacaoTabela(listaAprovadosOrdenada, tbodyAprovados, renderizarLinhaAprovados, "paginacaoFechamentosAprovados", atualizarTabelaFechamentos);
    }
  }
  const elResumoAprovados = document.getElementById("resumoFechamentosAprovados");
  if (elResumoAprovados) elResumoAprovados.textContent = `Total: ${fechamentosAprovados.length} fechamento(s) aprovado(s).`;
}

// ========== FUNÇÃO PARA MOSTRAR DETALHES DO FECHAMENTO ==========
async function mostrarDetalhesFechamento(fechamento) {
  // Carregar serviços se necessário
  const carregarAsync = typeof carregarServicosParceiros === "function" && carregarServicosParceiros.constructor.name === "AsyncFunction";
  if (carregarAsync) {
    await carregarServicosParceiros();
  } else if (typeof carregarServicosParceiros === "function") {
    carregarServicosParceiros();
  }
  
  // Carregar parceiros se necessário
  const carregarParceirosAsync = typeof carregarParceiros === "function" && carregarParceiros.constructor.name === "AsyncFunction";
  if (carregarParceirosAsync) {
    await carregarParceiros();
  } else if (typeof carregarParceiros === "function") {
    carregarParceiros();
  }

  const parcId = fechamento.parceiroId ?? fechamento.parceiro_id;
  const servIds = fechamento.servicosIds ?? fechamento.servicos_ids ?? [];
  const qtdTotal = fechamento.quantidadeTotal ?? fechamento.quantidade_total;
  const valTotal = fechamento.valorTotal ?? fechamento.valor_total;
  const criadoEm = fechamento.criadoEm ?? fechamento.criado_em;
  const aprovadoEm = fechamento.aprovado_em ?? fechamento.aprovadoEm;
  const status = fechamento.status || "pendente";
  const aprovadoPor = fechamento.aprovado_por ?? fechamento.aprovadoPor;
  const aprovador = (typeof usuarios !== "undefined" ? usuarios : []).find((u) => u.id === aprovadoPor);

  const parceiro = (parceiros || []).find((p) => p.id === parcId);

  // Preencher informações do fechamento
  document.getElementById("detalheFechamentoParceiro").textContent = parceiro ? parceiro.nome : "Parceiro não encontrado";
  document.getElementById("detalheFechamentoDataCriacao").textContent = formatarDataHora(criadoEm);
  
  let statusTexto = "";
  if (status === "pendente") {
    statusTexto = '<span class="badge bg-warning">Aguardando Aprovação</span>';
  } else if (status === "aprovado") {
    statusTexto = '<span class="badge bg-success">Aprovado</span>';
  } else if (status === "rejeitado") {
    statusTexto = '<span class="badge bg-danger">Rejeitado</span>';
  } else {
    statusTexto = status;
  }
  document.getElementById("detalheFechamentoStatus").innerHTML = statusTexto;
  
  document.getElementById("detalheFechamentoQuantidade").textContent = qtdTotal != null ? qtdTotal.toLocaleString("pt-BR") : "-";
  document.getElementById("detalheFechamentoValor").textContent = formatarMoeda(valTotal ?? 0);
  document.getElementById("detalheFechamentoQtdServicos").textContent = servIds.length;

  // Buscar e exibir os serviços
  const tbody = document.getElementById("tbodyDetalhesFechamento");
  tbody.innerHTML = "";

  if (!servIds.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "text-center text-muted";
    td.textContent = "Nenhum serviço encontrado neste fechamento.";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    // Buscar os serviços pelos IDs
    const servicos = servIds.map((id) => {
      const servico = (typeof servicosParceiros !== "undefined" ? servicosParceiros : []).find((s) => s.id === id);
      return servico;
    }).filter(Boolean);

    // Ordenar por data
    servicos.sort((a, b) => {
      const dataA = a.data ?? a.data_servico ?? "";
      const dataB = b.data ?? b.data_servico ?? "";
      return dataB.localeCompare(dataA);
    });

    servicos.forEach((servico) => {
      const tr = document.createElement("tr");
      
      const data = servico.data ?? servico.data_servico ?? "-";
      // Formatar data no formato brasileiro (DD/MM/YYYY)
      let dataFormatada = "-";
      if (data && data !== "-") {
        if (typeof formatarData === "function") {
          dataFormatada = formatarData(data);
        } else {
          // Fallback: formatar manualmente
          const partes = data.split("-");
          if (partes.length === 3) {
            dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
          } else {
            dataFormatada = data;
          }
        }
      }
      
      const servicoPrestado = servico.servico_prestado ?? servico.servicoPrestado ?? "-";
      const quantidade = servico.quantidade ?? 0;
      const quantidadePaginas = servico.quantidade_paginas ?? servico.quantidadePaginas ?? 0;
      const valorNota = servico.valor_nota ?? servico.valorNota ?? 0;
      const observacao = servico.observacao ?? servico.observacoes ?? "";

      tr.appendChild(criarTd(dataFormatada));
      tr.appendChild(criarTd(servicoPrestado));
      tr.appendChild(criarTd(quantidade.toLocaleString("pt-BR"), "text-end"));
      tr.appendChild(criarTd(quantidadePaginas > 0 ? quantidadePaginas.toLocaleString("pt-BR") : "-", "text-end"));
      tr.appendChild(criarTd(formatarMoeda(valorNota), "text-end"));
      tr.appendChild(criarTd(observacao || "-"));

      tbody.appendChild(tr);
    });
  }

  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById("modalDetalhesFechamento"));
  modal.show();
}

// ========== FUNÇÃO PARA LIMPAR TODOS OS DADOS ==========
function limparTodosDados() {
  // Lista de todas as chaves de armazenamento
  const chaves = [
    "gestao_diario_oficial_usuarios_v1",
    "gestao_diario_oficial_poupatempos_v1",
    "gestao_diario_oficial_registros_v1",
    "gestao_diario_oficial_sessao_v1",
    "gestao_diario_oficial_investimentos_v1",
    "gestao_diario_oficial_receitas_v1",
    "gestao_diario_oficial_parceiros_v1",
    "gestao_diario_oficial_servicos_parceiros_v1",
    "gestao_diario_oficial_fechamentos_v1",
    "gestao_diario_oficial_mensagens_v1",
    "gestao_diario_oficial_faturamento_anual_v1"
  ];
  
  // Remover todas as chaves
  chaves.forEach(chave => {
    localStorage.removeItem(chave);
  });
  
  // Recriar apenas o admin padrão
  const adminPadrao = [
    {
      id: "admin-1",
      tipo: "admin",
      email: "admin@diariooficial.sp.gov.br",
      senha: "admin123",
      nome: "Administrador",
      criadoEm: new Date().toISOString(),
    }
  ];
  localStorage.setItem("gestao_diario_oficial_usuarios_v1", JSON.stringify(adminPadrao));
}

function formatarDataHora(isoString) {
  if (!isoString) return "-";
  const data = new Date(isoString);
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}

// ========== FUNÇÕES DE DASHBOARD ==========
async function atualizarDashboard(recarregar = true) {
  if (recarregar) {
    const carregarAsync = typeof carregarPoupatempos === "function" && carregarPoupatempos.constructor.name === "AsyncFunction";
    if (carregarAsync) {
      await carregarPoupatempos();
      await carregarRegistros();
      await carregarParceiros();
      await carregarFechamentos();
      await carregarInvestimentos();
      await carregarReceitas();
      if (typeof carregarFaturamentosAnuais === "function") {
        try {
          if (carregarFaturamentosAnuais.constructor?.name === "AsyncFunction") {
            await carregarFaturamentosAnuais();
          } else {
            carregarFaturamentosAnuais();
          }
        } catch (err) {
          console.error("Erro ao carregar faturamentos anuais:", err);
        }
      }
    } else if (typeof carregarPoupatempos === "function") {
      carregarPoupatempos();
      carregarRegistros();
      carregarParceiros();
      carregarFechamentos();
      carregarInvestimentos();
      carregarReceitas();
      if (typeof carregarFaturamentosAnuais === "function") {
        try {
          carregarFaturamentosAnuais();
        } catch (err) {
          console.error("Erro ao carregar faturamentos anuais:", err);
        }
      }
    }
  }

  const elPoupa = document.getElementById("totalPoupatempos");
  const elParceiros = document.getElementById("totalParceiros");
  const elFech = document.getElementById("totalFechamentosPendentes");
  const elAtraso = document.getElementById("totalRegistrosAtraso");
  const elFatur = document.getElementById("totalFaturamento");
  const elReceita = document.getElementById("totalReceita");

  if (elPoupa) elPoupa.textContent = (poupatempos || []).length;
  if (elParceiros) elParceiros.textContent = (parceiros || []).length;

  const fechamentosPendentes = typeof obterFechamentosPendentes === "function" ? obterFechamentosPendentes() : [];
  if (elFech) elFech.textContent = fechamentosPendentes.length;

  const registrosAtraso = (registros || []).filter((reg) => verificarSeDeveDestacarRegistro(reg));
  if (elAtraso) elAtraso.textContent = registrosAtraso.length;

  const fechamentosAprovados = (fechamentos || []).filter((f) => f && f.status === "aprovado");
  const totalFaturamento = fechamentosAprovados.reduce(
    (sum, f) => sum + Number((f && (f.valorTotal ?? f.valor_total)) || 0),
    0
  );
  if (elFatur) elFatur.textContent = formatarMoeda(totalFaturamento);

  // Considerar apenas receitas do ano de 2026 para o card de Receita no Dashboard
  const anoReceitaDashboard = 2026;
  const totalReceita = (receitas || [])
    .filter((r) => r && r.data && String(r.data).slice(0, 4) === String(anoReceitaDashboard))
    .reduce((sum, r) => sum + Number((r && r.faturamento) || 0), 0);
  if (elReceita) elReceita.textContent = formatarMoeda(totalReceita);

  atualizarResultadoFinanceiro(totalFaturamento, totalReceita);
  atualizarComparativoFaturamento();
  atualizarTabelaPoupatemposDashboard();
}

// ========== FUNÇÃO PARA ATUALIZAR RESULTADO FINANCEIRO ==========
function atualizarResultadoFinanceiro(custoOperacional, receita) {
  const invs = investimentos || [];
  const totalInvestimento = invs.reduce((sum, inv) => {
    const totalAno = (Number(inv?.operacional) || 0) + (Number(inv?.impressao) || 0) + (Number(inv?.distribuicao) || 0);
    return sum + totalAno;
  }, 0);

  const elCusto = document.getElementById("dashboardCustoOperacional");
  const elInv = document.getElementById("dashboardInvestimento");
  const elRec = document.getElementById("dashboardReceita");
  if (elCusto) elCusto.textContent = formatarMoeda(custoOperacional);
  if (elInv) elInv.textContent = formatarMoeda(totalInvestimento);
  if (elRec) elRec.textContent = formatarMoeda(receita);

  const investimentoRestante = totalInvestimento - custoOperacional;
  const elementoInvestimentoRestante = document.getElementById("dashboardInvestimentoRestante");
  const statusInvestimentoRestante = document.getElementById("statusInvestimentoRestante");
  if (elementoInvestimentoRestante) elementoInvestimentoRestante.textContent = formatarMoeda(investimentoRestante);
  if (elementoInvestimentoRestante) {
    if (investimentoRestante > 0) {
      elementoInvestimentoRestante.className = "h4 mb-0 text-success";
      if (statusInvestimentoRestante) statusInvestimentoRestante.innerHTML = '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Investimento disponível</span>';
      const card1 = document.getElementById("cardInvestimentoRestante");
      if (card1) card1.style.backgroundColor = "#d4edda";
    } else if (investimentoRestante === 0) {
      elementoInvestimentoRestante.className = "h4 mb-0 text-warning";
      if (statusInvestimentoRestante) statusInvestimentoRestante.innerHTML = '<span class="badge bg-warning"><i class="bi bi-exclamation-triangle"></i> Investimento esgotado</span>';
      const card1 = document.getElementById("cardInvestimentoRestante");
      if (card1) card1.style.backgroundColor = "#fff3cd";
    } else {
      elementoInvestimentoRestante.className = "h4 mb-0 text-danger";
      if (statusInvestimentoRestante) statusInvestimentoRestante.innerHTML = '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Excedeu o investimento</span>';
      const card1 = document.getElementById("cardInvestimentoRestante");
      if (card1) card1.style.backgroundColor = "#f8d7da";
    }
  }

  const coberturaInvestimento = receita - totalInvestimento;
  const elementoCobertura = document.getElementById("dashboardCoberturaInvestimento");
  const statusCobertura = document.getElementById("statusCoberturaInvestimento");
  if (elementoCobertura) elementoCobertura.textContent = formatarMoeda(coberturaInvestimento);
  if (elementoCobertura) {
    if (coberturaInvestimento > 0) {
      elementoCobertura.className = "h4 mb-0 text-success";
      if (statusCobertura) statusCobertura.innerHTML = '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Receita cobre o investimento</span>';
      const card2 = document.getElementById("cardReceitaInvestimento");
      if (card2) card2.style.backgroundColor = "#d4edda";
    } else if (coberturaInvestimento === 0) {
      elementoCobertura.className = "h4 mb-0 text-warning";
      if (statusCobertura) statusCobertura.innerHTML = '<span class="badge bg-warning"><i class="bi bi-exclamation-triangle"></i> Receita igual ao investimento</span>';
      const card2 = document.getElementById("cardReceitaInvestimento");
      if (card2) card2.style.backgroundColor = "#fff3cd";
    } else {
      elementoCobertura.className = "h4 mb-0 text-danger";
      if (statusCobertura) statusCobertura.innerHTML = '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Receita não cobre o investimento</span>';
      const card2 = document.getElementById("cardReceitaInvestimento");
      if (card2) card2.style.backgroundColor = "#f8d7da";
    }
  }
}

// ========== COMPARATIVO DE FATURAMENTO (ANO ANTERIOR VS ANO ATUAL) ==========
function atualizarComparativoFaturamento() {
  const anoAtual = new Date().getFullYear();
  const anoAnterior = anoAtual - 1;

  // Helper local para extrair o ano de uma data (aceita 'YYYY-MM-DD' ou 'DD/MM/YYYY')
  const obterAno = (valorData) => {
    if (!valorData) return null;
    const s = String(valorData).trim();
    if (!s) return null;
    const partes = s.split(/[\/\-]/);
    if (partes.length === 3) {
      if (partes[0].length === 4) {
        // YYYY-MM-DD
        return Number(partes[0]) || null;
      } else {
        // DD/MM/YYYY
        return Number(partes[2]) || null;
      }
    }
    return null;
  };

  const fatAnoAnt = (receitas || []).reduce((sum, r) => {
    const ano = obterAno(r?.data);
    return ano === anoAnterior ? sum + Number(r?.faturamento || 0) : sum;
  }, 0);

  const fatAnoAtual = (receitas || []).reduce((sum, r) => {
    const ano = obterAno(r?.data);
    return ano === anoAtual ? sum + Number(r?.faturamento || 0) : sum;
  }, 0);

  const elAnt = document.getElementById("dashboardFaturamentoAnoAnterior");
  const elLabelAnt = document.getElementById("dashboardLabelAnoAnterior");
  const elAtual = document.getElementById("dashboardFaturamentoAnoAtual");
  const elLabelAtual = document.getElementById("dashboardLabelAnoAtual");
  const elVar = document.getElementById("dashboardVariacaoFaturamento");
  const elVarPct = document.getElementById("dashboardVariacaoPercentual");
  const cardVar = document.getElementById("cardVariacaoFaturamento");

  if (elAnt) elAnt.textContent = formatarMoeda(fatAnoAnt || 0);
  if (elLabelAnt) elLabelAnt.textContent = String(anoAnterior);
  if (elAtual) elAtual.textContent = formatarMoeda(fatAnoAtual);
  if (elLabelAtual) elLabelAtual.textContent = String(anoAtual);

  if (fatAnoAnt != null) {
    const variacao = fatAnoAtual - fatAnoAnt;
    if (elVar) elVar.textContent = formatarMoeda(variacao);
    if (elVar) elVar.className = "h4 mb-0 " + (variacao > 0 ? "text-success" : variacao < 0 ? "text-danger" : "text-secondary");
    const pct = fatAnoAnt > 0 ? ((variacao / fatAnoAnt) * 100).toFixed(1) : "0,0";
    if (elVarPct) {
      elVarPct.innerHTML = variacao > 0
        ? '<span class="badge bg-success">+' + pct + '%</span>'
        : variacao < 0
        ? '<span class="badge bg-danger">' + pct + '%</span>'
        : '<span class="badge bg-secondary">' + pct + '%</span>';
    }
    if (cardVar) cardVar.style.backgroundColor = variacao > 0 ? "#d4edda" : variacao < 0 ? "#f8d7da" : "#f8f9fa";
  } else {
    if (elVar) { elVar.textContent = "—"; elVar.className = "h4 mb-0 text-muted"; }
    if (elVarPct) elVarPct.innerHTML = "";
    if (cardVar) cardVar.style.backgroundColor = "#f8f9fa";
  }
}

// ========== FUNÇÃO PARA NAVEGAR PARA REGISTROS COM ATRASO ==========
function navegarParaRegistrosAtraso() {
  // Navegar para seção Poupatempos
  mostrarSecaoPoupatempos();
  
  // Aguardar um pouco para garantir que a seção foi renderizada
  setTimeout(() => {
    // Ativar a aba "Ver Registros de Recebimento"
    const tabRegistros = document.getElementById("tab-registros");
    if (tabRegistros) {
      // Usar Bootstrap para ativar a aba
      const tab = new bootstrap.Tab(tabRegistros);
      tab.show();
      
      // Filtrar registros com atraso
      const registrosAtraso = registros.filter((reg) => verificarSeDeveDestacarRegistro(reg));
      atualizarTabelaRegistrosAdmin(registrosAtraso);
    }
  }, 100);
}

// ========== FUNÇÕES DE MENSAGENS ==========
function atualizarListaUsuariosMensagem() {
  const select = document.getElementById("destinatariosMensagem");
  if (!select) return;
  
  // Verificar se a função existe
  if (typeof obterTodosUsuariosParaMensagem !== 'function') {
    console.error("Função obterTodosUsuariosParaMensagem não está disponível");
    return;
  }
  
  // Limpar opções existentes (exceto "todos")
  select.innerHTML = '<option value="todos">📢 Enviar para Todos</option>';
  
  try {
    const usuariosDisponiveis = obterTodosUsuariosParaMensagem();
    usuariosDisponiveis.forEach(usuario => {
      // Não mostrar o próprio usuário na lista
      if (usuarioLogado && usuario.id !== usuarioLogado.id) {
        const option = document.createElement("option");
        option.value = usuario.id;
        option.textContent = usuario.textoExibicao || `${usuario.nome} (${usuario.tipoLabel})`;
        select.appendChild(option);
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar lista de usuários:", error);
  }
}

function atualizarListaMensagens() {
  const listaMensagens = document.getElementById("listaMensagens");
  if (!listaMensagens) return;
  
  if (!usuarioLogado || !usuarioLogado.id) {
    console.error("Usuário não está logado");
    return;
  }
  
  listaMensagens.innerHTML = "";
  
  const filtro = document.querySelector('input[name="filtroMensagens"]:checked')?.value || "recebidas";
  let mensagensParaExibir = [];
  
  try {
    if (filtro === "recebidas") {
      if (typeof obterMensagensRecebidas !== 'function') {
        console.error("Função obterMensagensRecebidas não está disponível");
        return;
      }
      mensagensParaExibir = obterMensagensRecebidas(usuarioLogado.id);
    } else {
      if (typeof obterMensagensEnviadas !== 'function') {
        console.error("Função obterMensagensEnviadas não está disponível");
        return;
      }
      mensagensParaExibir = obterMensagensEnviadas(usuarioLogado.id);
    }
  } catch (error) {
    console.error("Erro ao obter mensagens:", error);
    return;
  }
  
  if (mensagensParaExibir.length === 0) {
    const item = document.createElement("div");
    item.className = "text-center text-muted p-4";
    item.textContent = filtro === "recebidas" ? "Nenhuma mensagem recebida." : "Nenhuma mensagem enviada.";
    listaMensagens.appendChild(item);
    return;
  }
  
  mensagensParaExibir.forEach(msg => {
    const arr = msg.lidaPor ?? msg.lida_por;
    const naoLida = filtro === "recebidas" && (!arr || !Array.isArray(arr) || !arr.includes(usuarioLogado.id));
    const item = document.createElement("div");
    item.className = `list-group-item ${naoLida ? "list-group-item-warning" : ""}`;

    item.innerHTML = `
      <div class="d-flex align-items-start mb-2">
        <div class="form-check me-3 mt-1">
          <input class="form-check-input checkbox-mensagem" type="checkbox" value="${msg.id}" id="checkMsg${msg.id}" onchange="atualizarBotaoExcluirMensagens()">
        </div>
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <h6 class="mb-1 ${naoLida ? "fw-bold" : ""}">
                ${msg.assunto}
                ${naoLida ? '<span class="badge bg-danger ms-2">Nova</span>' : ''}
              </h6>
              <p class="mb-1 small text-muted">
                <strong>${filtro === "recebidas" ? "De" : "Para"}:</strong> ${filtro === "recebidas" ? `${msg.remetenteNome ?? msg.remetente_nome} (${msg.remetenteTipo ?? msg.remetente_tipo})` : obterTextosDestinatarios(msg.destinatarios)}
              </p>
              <p class="mb-1">${msg.mensagem}</p>
              <small class="text-muted">${formatarDataHora(msg.criadoEm ?? msg.criado_em)}</small>
            </div>
            <div class="ms-3">
              ${filtro === "recebidas" ? `<button class="btn btn-sm btn-outline-primary me-1" onclick="responderMensagem('${msg.id}')">Responder</button>` : ''}
              ${naoLida ? `<button class="btn btn-sm btn-outline-success" onclick="marcarComoLida('${msg.id}')">Marcar como lida</button>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    listaMensagens.appendChild(item);
  });
  
  atualizarBotaoExcluirMensagens();
}


function responderMensagem(mensagemId) {
  const msgOriginal = obterMensagemPorId(mensagemId);
  if (!msgOriginal) return;
  const remId = msgOriginal.remetenteId ?? msgOriginal.remetente_id;
  const remNome = msgOriginal.remetenteNome ?? msgOriginal.remetente_nome;

  document.getElementById("assuntoMensagem").value = `Re: ${msgOriginal.assunto}`;
  document.getElementById("conteudoMensagem").value = `\n\n--- Mensagem original ---\nDe: ${remNome}\nAssunto: ${msgOriginal.assunto}\n\n${msgOriginal.mensagem}`;

  const select = document.getElementById("destinatariosMensagem");
  if (select) {
    Array.from(select.options).forEach(opt => {
      opt.selected = opt.value === remId;
    });
  }
  document.getElementById("assuntoMensagem").focus();
}

function atualizarBotaoExcluirMensagens() {
  const checkboxes = document.querySelectorAll('.checkbox-mensagem:checked');
  const btnExcluir = document.getElementById('btnExcluirMensagensSelecionadas');
  if (btnExcluir) {
    btnExcluir.style.display = checkboxes.length > 0 ? 'inline-block' : 'none';
  }
}

async function excluirMensagensSelecionadas() {
  const checkboxes = document.querySelectorAll('.checkbox-mensagem:checked');
  if (checkboxes.length === 0) {
    alert('Selecione pelo menos uma mensagem para excluir.');
    return;
  }
  
  const ids = Array.from(checkboxes).map(cb => cb.value);
  if (!confirm(`Deseja excluir ${ids.length} mensagem(ns) selecionada(s)?`)) return;
  
  try {
    const resultado = await (typeof excluirMensagens === "function" ? excluirMensagens(ids) : Promise.resolve({ sucesso: false, mensagem: "Função indisponível." }));
    if (resultado && resultado.sucesso) {
      alert(resultado.mensagem || "Mensagens excluídas com sucesso!");
      atualizarListaMensagens();
      atualizarContadorMensagensNaoLidas();
    } else {
      alert(resultado?.mensagem || "Erro ao excluir mensagens.");
    }
  } catch (err) {
    alert("Erro ao excluir mensagens: " + (err?.message || err));
  }
}

async function marcarComoLida(mensagemId) {
  await marcarMensagemComoLida(mensagemId, usuarioLogado.id);
  atualizarListaMensagens();
  atualizarContadorMensagensNaoLidas();
}

function atualizarContadorMensagensNaoLidas() {
  if (!usuarioLogado) return;
  
  const mensagensNaoLidas = obterMensagensNaoLidas(usuarioLogado.id);
  const badge = document.getElementById("badgeMensagensNaoLidasAdmin");
  
  if (badge) {
    if (mensagensNaoLidas.length > 0) {
      badge.textContent = mensagensNaoLidas.length;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }
}

// ========== FUNÇÕES DE TABELA DE POUPATEMPOS NO DASHBOARD ==========
function atualizarTabelaPoupatemposDashboard() {
  const tbody = document.querySelector("#tabelaPoupatemposDashboard tbody");
  if (!tbody) return;

  if (!poupatempos.length) {
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "text-center text-muted";
    td.textContent = "Nenhum poupatempo cadastrado.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    document.getElementById("resumoPoupatemposDashboard").textContent = "Nenhum poupatempo cadastrado.";
    const controles = document.getElementById("paginacaoPoupatemposDashboard");
    if (controles) controles.remove();
    return;
  }

  const renderizarLinha = (poup) => {
    const registrosPoup = registros.filter((r) => (r.poupatempoId ?? r.poupatempo_id) === poup.id);
    
    // Calcular total recebido
    const totalRecebido = registrosPoup.reduce((sum, r) => sum + Number(r.quantidade || 0), 0);
    
    // Calcular média de dias
    const diasCompletos = registrosPoup
      .filter((r) => (r.dataEdicao ?? r.data_edicao) && (r.dataRecebimento ?? r.data_recebimento))
      .map((r) => calcularDiferencaDias(r.dataEdicao ?? r.data_edicao, r.dataRecebimento ?? r.data_recebimento))
      .filter((d) => d !== null);
    
    const mediaDias = diasCompletos.length > 0
      ? (diasCompletos.reduce((sum, d) => sum + d, 0) / diasCompletos.length).toFixed(1)
      : "-";

    const tr = document.createElement("tr");
    tr.appendChild(criarTd(poup.nome));
    tr.appendChild(criarTd(poup.endereco || "-"));
    
    const quantidadeEsperada = poup.quantidade_esperada ?? poup.quantidadeEsperada ?? "-";
    const tdQtdEsperada = criarTd(quantidadeEsperada);
    tdQtdEsperada.className = "text-end";
    tr.appendChild(tdQtdEsperada);
    
    const tdTotalRecebido = criarTd(totalRecebido.toLocaleString("pt-BR"));
    tdTotalRecebido.className = "text-end";
    tr.appendChild(tdTotalRecebido);
    
    const tdMediaDias = criarTd(mediaDias);
    tdMediaDias.className = "text-end";
    if (mediaDias !== "-" && Number(mediaDias) > 3) {
      tdMediaDias.classList.add("text-danger", "fw-bold");
    } else if (mediaDias !== "-" && Number(mediaDias) > 1) {
      tdMediaDias.classList.add("text-warning");
    }
    tr.appendChild(tdMediaDias);
    
    const tdRegistros = criarTd(registrosPoup.length);
    tdRegistros.className = "text-end";
    tr.appendChild(tdRegistros);
    
    tbody.appendChild(tr);
  };
  
  aplicarPaginacaoTabela(poupatempos, tbody, renderizarLinha, "paginacaoPoupatemposDashboard", atualizarTabelaPoupatemposDashboard);

  document.getElementById("resumoPoupatemposDashboard").textContent =
    `Total: ${poupatempos.length} poupatempo(s) cadastrado(s).`;
}

function exportarPoupatemposDashboardCsv() {
  if (!poupatempos.length) {
    alert("Não há poupatempos para exportar.");
    return;
  }

  const cabecalho = ["Poupatempo", "Endereco", "Quantidade_Esperada", "Total_Recebido", "Media_Dias", "Total_Registros"];
  const linhas = poupatempos.map((poup) => {
    const registrosPoup = registros.filter((r) => (r.poupatempoId ?? r.poupatempo_id) === poup.id);
    const totalRecebido = registrosPoup.reduce((sum, r) => sum + Number(r.quantidade || 0), 0);
    
    const diasCompletos = registrosPoup
      .filter((r) => (r.dataEdicao ?? r.data_edicao) && (r.dataRecebimento ?? r.data_recebimento))
      .map((r) => calcularDiferencaDias(r.dataEdicao ?? r.data_edicao, r.dataRecebimento ?? r.data_recebimento))
      .filter((d) => d !== null);
    
    const mediaDias = diasCompletos.length > 0
      ? (diasCompletos.reduce((sum, d) => sum + d, 0) / diasCompletos.length).toFixed(1)
      : "-";

    return [
      poup.nome,
      poup.endereco || "",
      (poup.quantidade_esperada ?? poup.quantidadeEsperada ?? ""),
      totalRecebido,
      mediaDias,
      registrosPoup.length,
    ];
  });

  const conteudo = [cabecalho, ...linhas]
    .map((cols) => cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  downloadCsv(conteudo, `poupatempos_dashboard_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Verifica se uma data é dia útil (segunda a sexta).
 * @param {Date} data - Objeto Date
 * @returns {boolean}
 */
function ehDiaUtil(data) {
  const dia = data.getDay(); // 0 = domingo, 6 = sábado
  return dia >= 1 && dia <= 5;
}

/**
 * Conta apenas dias úteis (segunda a sexta) entre duas datas.
 * Mesmo dia = 0. Caso contrário, conta dias d onde dataInicio < d <= dataFim (exclui o dia inicial).
 * dataInicio e dataFim no formato YYYY-MM-DD ou Date.
 * @param {string|Date} dataInicio
 * @param {string|Date} dataFim
 * @returns {number|null} Quantidade de dias úteis ou null em caso de erro
 */
function contarDiasUteisEntre(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return null;
  try {
    const inicio = typeof dataInicio === "string" ? new Date(dataInicio + "T00:00:00") : new Date(dataInicio);
    const fim = typeof dataFim === "string" ? new Date(dataFim + "T00:00:00") : new Date(dataFim);
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(0, 0, 0, 0);
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return null;
    if (inicio.getTime() > fim.getTime()) return null;
    // Mesmo dia: quantidade de dias = 0
    if (inicio.getTime() === fim.getTime()) return 0;
    // Contar apenas dias úteis após o dia inicial até o dia final (inclusive)
    let count = 0;
    const atual = new Date(inicio);
    atual.setDate(atual.getDate() + 1); // começar no dia seguinte
    while (atual.getTime() <= fim.getTime()) {
      if (ehDiaUtil(atual)) count++;
      atual.setDate(atual.getDate() + 1);
    }
    return count;
  } catch {
    return null;
  }
}

/**
 * Diferença em dias úteis entre data de edição e data de recebimento.
 * Mesmo dia = 0. Usado no dashboard e na aba Ver registros de recebimento.
 */
function calcularDiferencaDias(dataEdicao, dataRecebimento) {
  return contarDiasUteisEntre(dataEdicao, dataRecebimento);
}

function calcularDiasDesdeData(data) {
  if (!data) return null;
  try {
    const dataReferencia = typeof data === "string" ? new Date(data + "T00:00:00") : new Date(data);
    const dataAtual = new Date();
    dataReferencia.setHours(0, 0, 0, 0);
    dataAtual.setHours(0, 0, 0, 0);
    if (isNaN(dataReferencia.getTime())) return null;
    if (dataReferencia.getTime() > dataAtual.getTime()) return null;
    return contarDiasUteisEntre(dataReferencia, dataAtual);
  } catch {
    return null;
  }
}

function verificarSeDeveDestacarRegistro(registro) {
  const dataEd = registro.dataEdicao ?? registro.data_edicao;
  const dataRec = registro.dataRecebimento ?? registro.data_recebimento;
  // Condição 1: Diferença entre data de edição e data de recebimento > 3 dias
  if (dataEd && dataRec) {
    const diasDiferenca = calcularDiferencaDias(dataEd, dataRec);
    if (diasDiferenca !== null && diasDiferenca > 3) {
      return true;
    }
  }
  // Condição 2: Data de edição > 3 dias em relação à data atual E data de recebimento não preenchida
  if (dataEd && !dataRec) {
    const diasDesdeEdicao = calcularDiasDesdeData(dataEd);
    if (diasDesdeEdicao !== null && diasDesdeEdicao > 3) {
      return true;
    }
  }
  return false;
}

// ========== BUSCA DE CEP ==========
function buscarCep() {
  const cep = document.getElementById("cepPoupatempo").value.replace(/\D/g, "");
  const mensagemCep = document.getElementById("mensagemCep");
  const campoEndereco = document.getElementById("enderecoPoupatempo");

  if (cep.length !== 8) {
    mensagemCep.innerHTML = '<small class="text-danger">CEP deve conter 8 dígitos</small>';
    return;
  }

  mensagemCep.innerHTML = '<small class="text-info">Buscando endereço...</small>';

  // Usar API ViaCEP (gratuita e sem necessidade de autenticação)
  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then((response) => response.json())
    .then((data) => {
      if (data.erro) {
        mensagemCep.innerHTML = '<small class="text-danger">CEP não encontrado</small>';
        campoEndereco.value = "";
        return;
      }

      // Montar endereço completo
      const enderecoCompleto = [
        data.logradouro || "",
        data.bairro || "",
        data.localidade || "",
        data.uf || "",
      ]
        .filter((parte) => parte)
        .join(", ");

      campoEndereco.value = enderecoCompleto || "";
      
      if (enderecoCompleto) {
        mensagemCep.innerHTML = '<small class="text-success">Endereço encontrado e preenchido automaticamente!</small>';
      } else {
        mensagemCep.innerHTML = '<small class="text-warning">CEP encontrado, mas alguns dados não estão disponíveis</small>';
      }
    })
    .catch((error) => {
      console.error("Erro ao buscar CEP:", error);
      mensagemCep.innerHTML = '<small class="text-danger">Erro ao buscar CEP. Verifique sua conexão com a internet.</small>';
    });
}

function buscarCepParceiro() {
  const cep = document.getElementById("cepParceiro").value.replace(/\D/g, "");
  const mensagemCep = document.getElementById("mensagemCepParceiro");
  const campoEndereco = document.getElementById("enderecoParceiro");

  if (cep.length !== 8) {
    mensagemCep.innerHTML = '<small class="text-danger">CEP deve conter 8 dígitos</small>';
    return;
  }

  mensagemCep.innerHTML = '<small class="text-info">Buscando endereço...</small>';

  // Usar API ViaCEP (gratuita e sem necessidade de autenticação)
  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then((response) => response.json())
    .then((data) => {
      if (data.erro) {
        mensagemCep.innerHTML = '<small class="text-danger">CEP não encontrado</small>';
        campoEndereco.value = "";
        return;
      }

      // Montar endereço completo
      const enderecoCompleto = [
        data.logradouro || "",
        data.bairro || "",
        data.localidade || "",
        data.uf || "",
      ]
        .filter((parte) => parte)
        .join(", ");

      campoEndereco.value = enderecoCompleto || "";
      
      if (enderecoCompleto) {
        mensagemCep.innerHTML = '<small class="text-success">Endereço encontrado e preenchido automaticamente!</small>';
      } else {
        mensagemCep.innerHTML = '<small class="text-warning">CEP encontrado, mas alguns dados não estão disponíveis</small>';
      }
    })
    .catch((error) => {
      console.error("Erro ao buscar CEP:", error);
      mensagemCep.innerHTML = '<small class="text-danger">Erro ao buscar CEP. Verifique sua conexão com a internet.</small>';
    });
}
