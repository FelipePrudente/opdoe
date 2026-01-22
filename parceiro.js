// Configuração da página de parceiro
document.addEventListener("DOMContentLoaded", () => {
  // Verificar autenticação
  if (!verificarAutenticacao("parceiro")) {
    return;
  }

  // Boas-vindas: nome do usuário (pessoa logada) e serviços contratados do parceiro
  function atualizarBoasVindasParceiro() {
    const parcId = usuarioLogado.parceiroId ?? usuarioLogado.parceiro_id;
    const parceiro = typeof obterParceiroPorId === "function" ? obterParceiroPorId(parcId) : null;
    const nomeUsuario = usuarioLogado.nome ?? "";
    const servicosContratados = (parceiro && (parceiro.servicos_contratados ?? parceiro.servicosContratados ?? "")) || "—";

    const elNome = document.getElementById("nomeParceiroExibicao");
    const elServ = document.getElementById("servicosParceiro");
    const elInfo = document.getElementById("infoParceiro");
    if (elNome) elNome.textContent = nomeUsuario || "—";
    if (elServ) elServ.textContent = servicosContratados;
    if (elInfo) elInfo.textContent = parceiro ? `${parceiro.nome} - ${nomeUsuario}` : (nomeUsuario || "—");
  }

  atualizarBoasVindasParceiro();

  // Configurar upload de PDF
  const inputPdf = document.getElementById("pdfNotaFiscal");
  inputPdf.addEventListener("change", (e) => {
    const arquivo = e.target.files[0];
    const infoArquivo = document.getElementById("infoArquivo");
    
    if (arquivo) {
      if (arquivo.type !== "application/pdf") {
        infoArquivo.innerHTML = '<small class="text-danger">Apenas arquivos PDF são permitidos.</small>';
        e.target.value = "";
        return;
      }
      
      if (arquivo.size > 5 * 1024 * 1024) {
        infoArquivo.innerHTML = '<small class="text-danger">O arquivo excede o tamanho máximo de 5MB.</small>';
        e.target.value = "";
        return;
      }
      
      const tamanhoMB = (arquivo.size / (1024 * 1024)).toFixed(2);
      infoArquivo.innerHTML = `<small class="text-success">Arquivo selecionado: ${arquivo.name} (${tamanhoMB} MB)</small>`;
    } else {
      infoArquivo.innerHTML = "";
    }
  });

  // Configurar formulário de serviço
  const formServico = document.getElementById("servicoParceiroForm");
  formServico.addEventListener("submit", async (e) => {
    e.preventDefault();
    const mensagem = document.getElementById("mensagemServico");
    mensagem.classList.add("d-none");

    // Processar PDF se houver
    let pdfBase64 = null;
    let nomeArquivoPdf = null;
    const arquivoPdf = document.getElementById("pdfNotaFiscal").files[0];
    
    if (arquivoPdf) {
      try {
        pdfBase64 = await converterArquivoParaBase64(arquivoPdf);
        nomeArquivoPdf = arquivoPdf.name;
      } catch (error) {
        mensagem.textContent = "Erro ao processar o arquivo PDF. Tente novamente.";
        mensagem.className = "alert alert-danger";
        mensagem.classList.remove("d-none");
        return;
      }
    }

    const dados = {
      parceiroId: usuarioLogado.parceiroId ?? usuarioLogado.parceiro_id,
      data: document.getElementById("dataServico").value,
      servicoPrestado: document.getElementById("servicoPrestado").value.trim(),
      quantidade: document.getElementById("quantidadeServico").value,
      quantidadePaginas: document.getElementById("quantidadePaginas").value,
      valorNota: document.getElementById("valorNota").value,
      observacao: document.getElementById("observacaoServico").value.trim(),
      pdfNotaFiscal: pdfBase64,
      nomeArquivoPdf: nomeArquivoPdf,
    };

    try {
      const resultado = await cadastrarServicoParceiro(dados);
      if (resultado.sucesso) {
        mensagem.textContent = resultado.mensagem;
        mensagem.className = "alert alert-success";
        mensagem.classList.remove("d-none");
        formServico.reset();
        document.getElementById("infoArquivo").innerHTML = "";
        atualizarTabelaServicosParceiro();
      } else {
        mensagem.textContent = resultado.mensagem;
        mensagem.className = "alert alert-danger";
        mensagem.classList.remove("d-none");
      }
    } catch (err) {
      mensagem.textContent = err?.message || "Erro ao cadastrar serviço.";
      mensagem.className = "alert alert-danger";
      mensagem.classList.remove("d-none");
    }
  });

  // Configurar botão de exportação
  document.getElementById("exportarServicosParceiro").addEventListener("click", exportarServicosParceiroCsv);

  // Configurar filtro por status
  const filtroStatusServicos = document.getElementById("filtroStatusServicos");
  if (filtroStatusServicos) {
    filtroStatusServicos.addEventListener("change", () => {
      atualizarTabelaServicosParceiro();
    });
  }

  // Configurar seleção múltipla
  document.getElementById("selecionarTodos").addEventListener("change", (e) => {
    const checkboxes = document.querySelectorAll("#tabelaServicosParceiro tbody input[type='checkbox']");
    checkboxes.forEach((cb) => {
      const servico = obterServicoPorId(cb.value);
      const fechAprov = servico && (servico.fechamentoAprovado ?? servico.fechamento_aprovado);
      if (servico && !fechAprov) {
        cb.checked = e.target.checked;
        atualizarBotaoFechamento();
      }
    });
  });

  // Configurar botão de fechamento
  document.getElementById("btnFechamento").addEventListener("click", async () => {
    const servicosSelecionados = Array.from(document.querySelectorAll("#tabelaServicosParceiro tbody input[type='checkbox']:checked"))
      .map((cb) => cb.value);

    if (servicosSelecionados.length === 0) {
      alert("Selecione pelo menos um serviço para fechamento.");
      return;
    }

    if (!confirm(`Deseja enviar ${servicosSelecionados.length} serviço(s) para fechamento?`)) {
      return;
    }

    const parceiroId = usuarioLogado.parceiroId ?? usuarioLogado.parceiro_id;
    try {
      const resultado = await criarFechamento(parceiroId, servicosSelecionados);
      if (resultado.sucesso) {
        alert(`Fechamento enviado com sucesso! Total: ${formatarMoeda(resultado.fechamento?.valor_total ?? resultado.fechamento?.valorTotal ?? 0)}`);
        atualizarTabelaServicosParceiro();
        document.getElementById("selecionarTodos").checked = false;
      } else {
        alert(resultado.mensagem);
      }
    } catch (err) {
      alert(err?.message || "Erro ao criar fechamento.");
    }
  });

  // Configurar logout
  document.getElementById("btnLogoutParceiro").addEventListener("click", () => {
    limparSessao();
    window.location.href = "login.html";
  });

  // Quando dados do Supabase terminarem de carregar, atualizar boas-vindas e tabela
  window.addEventListener("dadosInicializados", () => {
    atualizarBoasVindasParceiro();
    atualizarTabelaServicosParceiro();
  });
  atualizarTabelaServicosParceiro();
  if (window.dadosInicializados) {
    atualizarBoasVindasParceiro();
    atualizarTabelaServicosParceiro();
  }

  // Configurar mensagens
  configurarMensagensParceiro();
});

// ========== FUNÇÕES DE MENSAGENS PARA PARCEIRO ==========
function configurarMensagensParceiro() {
  const btnMensagens = document.getElementById("btnMensagensParceiro");
  if (btnMensagens) {
    btnMensagens.addEventListener("click", () => {
      const modal = new bootstrap.Modal(document.getElementById('modalMensagensParceiro'));
      modal.show();
      
      // Atualizar conteúdo quando o modal for exibido
      document.getElementById('modalMensagensParceiro').addEventListener('shown.bs.modal', function () {
        atualizarListaUsuariosMensagemParceiro();
        atualizarListaMensagensParceiro();
      }, { once: true });
    });
  }
  
  const formMensagem = document.getElementById("formMensagemParceiro");
  if (formMensagem) {
    formMensagem.addEventListener("submit", async (e) => {
      e.preventDefault();
      const destinatariosSelect = document.getElementById("destinatariosMensagemParceiro");
      const destinatariosSelecionados = Array.from(destinatariosSelect.selectedOptions).map(opt => opt.value);
      if (destinatariosSelecionados.length === 0) {
        alert("Selecione pelo menos um destinatário.");
        return;
      }
      const assunto = document.getElementById("assuntoMensagemParceiro").value.trim();
      const conteudo = document.getElementById("conteudoMensagemParceiro").value.trim();
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
        const mensagemDiv = document.getElementById("mensagemFormMensagemParceiro");
        mensagemDiv.textContent = resultado.mensagem || "Mensagem enviada com sucesso!";
        mensagemDiv.className = "alert alert-success";
        mensagemDiv.classList.remove("d-none");
        formMensagem.reset();
        atualizarListaMensagensParceiro();
        atualizarContadorMensagensNaoLidasParceiro();
        setTimeout(() => mensagemDiv.classList.add("d-none"), 3000);
      } else if (resultado && !resultado.sucesso) {
        const mensagemDiv = document.getElementById("mensagemFormMensagemParceiro");
        mensagemDiv.textContent = resultado.mensagem || "Erro ao enviar mensagem.";
        mensagemDiv.className = "alert alert-danger";
        mensagemDiv.classList.remove("d-none");
        setTimeout(() => mensagemDiv.classList.add("d-none"), 5000);
      }
    });
  }
  document.querySelectorAll('input[name="filtroMensagensParceiro"]').forEach(radio => {
    radio.addEventListener("change", atualizarListaMensagensParceiro);
  });
  const btnExcluirMensagensPar = document.getElementById("btnExcluirMensagensSelecionadasParceiro");
  if (btnExcluirMensagensPar) {
    btnExcluirMensagensPar.addEventListener("click", excluirMensagensSelecionadasParceiro);
  }
  atualizarContadorMensagensNaoLidasParceiro();
  setInterval(atualizarContadorMensagensNaoLidasParceiro, 30000);
}

function atualizarListaUsuariosMensagemParceiro() {
  const select = document.getElementById("destinatariosMensagemParceiro");
  if (!select) return;
  select.innerHTML = '<option value="todos">📢 Enviar para Todos</option>';
  const usuariosDisponiveis = obterTodosUsuariosParaMensagem();
  usuariosDisponiveis.forEach(usuario => {
    if (usuarioLogado && usuario.id !== usuarioLogado.id) {
      const option = document.createElement("option");
      option.value = usuario.id;
      option.textContent = usuario.textoExibicao || `${usuario.nome} (${usuario.tipoLabel})`;
      select.appendChild(option);
    }
  });
}

function atualizarListaMensagensParceiro() {
  const listaMensagens = document.getElementById("listaMensagensParceiro");
  if (!listaMensagens) return;
  listaMensagens.innerHTML = "";
  const filtro = document.querySelector('input[name="filtroMensagensParceiro"]:checked')?.value || "recebidas";
  let mensagensParaExibir = filtro === "recebidas" ? obterMensagensRecebidas(usuarioLogado.id) : obterMensagensEnviadas(usuarioLogado.id);
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
    const textoDePara = filtro === "recebidas" ? `${msg.remetenteNome ?? msg.remetente_nome} (${msg.remetenteTipo ?? msg.remetente_tipo})` : obterTextosDestinatarios(msg.destinatarios);
    item.innerHTML = `<div class="d-flex align-items-start mb-2"><div class="form-check me-3 mt-1"><input class="form-check-input checkbox-mensagem-parceiro" type="checkbox" value="${msg.id}" id="checkMsgPar${msg.id}" onchange="atualizarBotaoExcluirMensagensParceiro()"></div><div class="flex-grow-1"><div class="d-flex justify-content-between align-items-start"><div class="flex-grow-1"><h6 class="mb-1 ${naoLida ? "fw-bold" : ""}">${msg.assunto}${naoLida ? '<span class="badge bg-danger ms-2">Nova</span>' : ''}</h6><p class="mb-1 small text-muted"><strong>${filtro === "recebidas" ? "De" : "Para"}:</strong> ${textoDePara}</p><p class="mb-1">${msg.mensagem}</p><small class="text-muted">${formatarDataHoraParceiro(msg.criadoEm ?? msg.criado_em)}</small></div><div class="ms-3">${filtro === "recebidas" ? `<button class="btn btn-sm btn-outline-primary me-1" onclick="responderMensagemParceiro('${msg.id}')">Responder</button>` : ''}${naoLida ? `<button class="btn btn-sm btn-outline-success" onclick="marcarComoLidaParceiro('${msg.id}')">Marcar como lida</button>` : ''}</div></div></div></div>`;
    listaMensagens.appendChild(item);
  });
  atualizarBotaoExcluirMensagensParceiro();
}

function responderMensagemParceiro(mensagemId) {
  const msgOriginal = obterMensagemPorId(mensagemId);
  if (!msgOriginal) return;
  const remId = msgOriginal.remetenteId ?? msgOriginal.remetente_id;
  const remNome = msgOriginal.remetenteNome ?? msgOriginal.remetente_nome;
  document.getElementById("assuntoMensagemParceiro").value = `Re: ${msgOriginal.assunto}`;
  document.getElementById("conteudoMensagemParceiro").value = `\n\n--- Mensagem original ---\nDe: ${remNome}\nAssunto: ${msgOriginal.assunto}\n\n${msgOriginal.mensagem}`;
  const select = document.getElementById("destinatariosMensagemParceiro");
  if (select) Array.from(select.options).forEach(opt => { opt.selected = opt.value === remId; });
  document.getElementById("assuntoMensagemParceiro").focus();
}

function atualizarBotaoExcluirMensagensParceiro() {
  const checkboxes = document.querySelectorAll('.checkbox-mensagem-parceiro:checked');
  const btnExcluir = document.getElementById('btnExcluirMensagensSelecionadasParceiro');
  if (btnExcluir) {
    btnExcluir.style.display = checkboxes.length > 0 ? 'inline-block' : 'none';
  }
}

async function excluirMensagensSelecionadasParceiro() {
  const checkboxes = document.querySelectorAll('.checkbox-mensagem-parceiro:checked');
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
      atualizarListaMensagensParceiro();
      atualizarContadorMensagensNaoLidasParceiro();
    } else {
      alert(resultado?.mensagem || "Erro ao excluir mensagens.");
    }
  } catch (err) {
    alert("Erro ao excluir mensagens: " + (err?.message || err));
  }
}

async function marcarComoLidaParceiro(mensagemId) {
  await marcarMensagemComoLida(mensagemId, usuarioLogado.id);
  atualizarListaMensagensParceiro();
  atualizarContadorMensagensNaoLidasParceiro();
}

function atualizarContadorMensagensNaoLidasParceiro() {
  if (!usuarioLogado) return;
  const mensagensNaoLidas = obterMensagensNaoLidas(usuarioLogado.id);
  const badge = document.getElementById("badgeMensagensNaoLidasParceiro");
  if (badge) {
    if (mensagensNaoLidas.length > 0) {
      badge.textContent = mensagensNaoLidas.length;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }
}

function formatarDataHoraParceiro(isoString) {
  if (!isoString) return "-";
  const data = new Date(isoString);
  return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()} ${String(data.getHours()).padStart(2, "0")}:${String(data.getMinutes()).padStart(2, "0")}`;
}

// Estado de paginação para parceiro
const estadoPaginacaoParceiro = {};
const funcoesAtualizacaoTabelaParceiro = {};

function aplicarPaginacaoTabelaParceiro(lista, tbody, renderizarLinha, idControles, funcaoAtualizacao, itensPorPagina = 30) {
  if (!tbody) return lista;
  
  const totalItens = lista.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  
  if (totalItens <= itensPorPagina) {
    tbody.innerHTML = "";
    lista.forEach(renderizarLinha);
    const controles = document.getElementById(idControles);
    if (controles) controles.remove();
    return lista;
  }
  
  if (!estadoPaginacaoParceiro[idControles]) {
    estadoPaginacaoParceiro[idControles] = { paginaAtual: 1 };
  }
  
  if (funcaoAtualizacao) {
    funcoesAtualizacaoTabelaParceiro[idControles] = funcaoAtualizacao;
  }
  
  const paginaAtual = estadoPaginacaoParceiro[idControles].paginaAtual;
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const itensPagina = lista.slice(inicio, fim);
  
  tbody.innerHTML = "";
  itensPagina.forEach(renderizarLinha);
  
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
      <button type="button" class="btn btn-sm btn-outline-secondary" ${paginaAtual === 1 ? "disabled" : ""} onclick="irParaPaginaParceiro('${idControles}', ${paginaAtual - 1}, ${totalPaginas})">
        <i class="bi bi-chevron-left"></i> Anterior
      </button>
      <button type="button" class="btn btn-sm btn-outline-secondary" disabled>
        Página ${paginaAtual} de ${totalPaginas}
      </button>
      <button type="button" class="btn btn-sm btn-outline-secondary" ${paginaAtual === totalPaginas ? "disabled" : ""} onclick="irParaPaginaParceiro('${idControles}', ${paginaAtual + 1}, ${totalPaginas})">
        Próxima <i class="bi bi-chevron-right"></i>
      </button>
    </div>
  `;
  
  return itensPagina;
}

window.irParaPaginaParceiro = function(idControles, novaPagina, totalPaginas) {
  if (novaPagina < 1 || novaPagina > totalPaginas) return;
  estadoPaginacaoParceiro[idControles].paginaAtual = novaPagina;
  if (funcoesAtualizacaoTabelaParceiro[idControles]) {
    funcoesAtualizacaoTabelaParceiro[idControles]();
  }
};

function atualizarTabelaServicosParceiro() {
  const tbody = document.querySelector("#tabelaServicosParceiro tbody");
  if (!tbody) return;

  const parcId = usuarioLogado.parceiroId ?? usuarioLogado.parceiro_id;
  let servicos = obterServicosPorParceiro(parcId);
  
  // Aplicar filtro por status
  const filtroStatus = document.getElementById("filtroStatusServicos")?.value || "todos";
  if (filtroStatus !== "todos") {
    servicos = servicos.filter((servico) => {
      const fechAprov = servico.fechamentoAprovado ?? servico.fechamento_aprovado;
      const fechPend = servico.fechamentoPendente ?? servico.fechamento_pendente;
      if (filtroStatus === "aprovado") return fechAprov;
      if (filtroStatus === "pendente") return fechPend;
      if (filtroStatus === "disponivel") return !fechAprov && !fechPend;
      return true;
    });
  }
  
  if (!servicos.length) {
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 10;
    td.className = "text-center text-muted";
    const filtroTexto = filtroStatus === "todos" ? "" : ` com status "${filtroStatus === "disponivel" ? "Disponível" : filtroStatus === "pendente" ? "Pendente" : "Aprovado"}"`;
    td.textContent = `Nenhum serviço cadastrado${filtroTexto}.`;
    tr.appendChild(td);
    tbody.appendChild(tr);
    const controles = document.getElementById("paginacaoServicosParceiro");
    if (controles) controles.remove();
  } else {
    const listaOrdenada = [...servicos].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
    const renderizarLinha = (servico) => {
      const fechAprov = servico.fechamentoAprovado ?? servico.fechamento_aprovado;
      const fechPend = servico.fechamentoPendente ?? servico.fechamento_pendente;
      const servPrest = servico.servicoPrestado ?? servico.servico_prestado;
      const qtdPag = servico.quantidadePaginas ?? servico.quantidade_paginas;
      const valNota = servico.valorNota ?? servico.valor_nota;
      const pdfNota = servico.pdfNotaFiscal ?? servico.pdf_nota_fiscal;
      const nomePdf = servico.nomeArquivoPdf ?? servico.nome_arquivo_pdf;

      const tr = document.createElement("tr");

      const tdCheckbox = document.createElement("td");
      tdCheckbox.className = "text-center";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = servico.id;
      checkbox.disabled = fechAprov || fechPend;
      checkbox.addEventListener("change", atualizarBotaoFechamento);
      tdCheckbox.appendChild(checkbox);
      tr.appendChild(tdCheckbox);

      tr.appendChild(criarTd(formatarData(servico.data)));
      tr.appendChild(criarTd(servPrest || "-"));
      const tdQtd = criarTd(servico.quantidade ?? "-");
      tdQtd.className = "text-end";
      tr.appendChild(tdQtd);
      const tdQtdPaginas = criarTd(qtdPag != null && qtdPag !== "" ? qtdPag : "-");
      tdQtdPaginas.className = "text-end";
      tr.appendChild(tdQtdPaginas);
      const tdValor = criarTd(formatarMoeda(valNota ?? 0));
      tdValor.className = "text-end";
      tr.appendChild(tdValor);

      const obs = servico.observacao ?? "";
      const tdObs = criarTd(obs || "-");
      tdObs.style.maxWidth = "200px";
      tdObs.style.overflow = "hidden";
      tdObs.style.textOverflow = "ellipsis";
      tdObs.style.whiteSpace = "nowrap";
      tdObs.title = obs;
      tr.appendChild(tdObs);

      const tdPdf = document.createElement("td");
      tdPdf.className = "text-center";
      if (pdfNota && nomePdf) {
        const btnPdf = document.createElement("button");
        btnPdf.className = "btn btn-sm btn-outline-primary";
        btnPdf.innerHTML = '<i class="bi bi-file-pdf"></i> Ver PDF';
        btnPdf.addEventListener("click", () => visualizarPdf(pdfNota, nomePdf));
        tdPdf.appendChild(btnPdf);
      } else {
        tdPdf.textContent = "-";
        tdPdf.className = "text-muted text-center";
      }
      tr.appendChild(tdPdf);

      const tdStatus = document.createElement("td");
      if (fechAprov) tdStatus.innerHTML = '<span class="badge bg-success">Aprovado</span>';
      else if (fechPend) tdStatus.innerHTML = '<span class="badge bg-warning">Pendente</span>';
      else tdStatus.innerHTML = '<span class="badge bg-secondary">Disponível</span>';
      tr.appendChild(tdStatus);

      const tdAcoes = document.createElement("td");
      tdAcoes.className = "text-end";
      const btnExcluir = document.createElement("button");
      btnExcluir.className = "btn btn-sm btn-outline-danger";
      btnExcluir.textContent = "Excluir";
      btnExcluir.disabled = fechAprov || fechPend;
      btnExcluir.addEventListener("click", async () => {
        if (!confirm("Confirma a exclusão deste serviço?")) return;
        try {
          const resultado = await (typeof excluirServicoParceiro === "function" ? excluirServicoParceiro(servico.id) : Promise.resolve({ sucesso: false, mensagem: "Função indisponível." }));
          if (resultado && resultado.sucesso) {
            atualizarTabelaServicosParceiro();
          } else {
            alert(resultado?.mensagem || "Erro ao excluir serviço.");
          }
        } catch (err) {
          alert("Erro ao excluir serviço: " + (err?.message || err));
        }
      });
      tdAcoes.appendChild(btnExcluir);
      tr.appendChild(tdAcoes);

      tbody.appendChild(tr);
    };
    
    aplicarPaginacaoTabelaParceiro(listaOrdenada, tbody, renderizarLinha, "paginacaoServicosParceiro", atualizarTabelaServicosParceiro);
  }

  atualizarBotaoFechamento();

  const totalServicos = servicos.length;
  const totalValor = servicos.reduce((sum, s) => sum + Number(s.valorNota ?? s.valor_nota ?? 0), 0);
  const elResumo = document.getElementById("resumoServicosParceiro");
  if (elResumo) {
    const filtroStatus = document.getElementById("filtroStatusServicos")?.value || "todos";
    const todosServicos = obterServicosPorParceiro(usuarioLogado.parceiroId ?? usuarioLogado.parceiro_id);
    const totalTodos = todosServicos.length;
    const totalValorTodos = todosServicos.reduce((sum, s) => sum + Number(s.valorNota ?? s.valor_nota ?? 0), 0);
    if (filtroStatus === "todos") {
      elResumo.textContent = `Total: ${totalServicos} serviço(s) cadastrado(s). Valor total: ${formatarMoeda(totalValor)}`;
    } else {
      const statusTexto = filtroStatus === "disponivel" ? "Disponível" : filtroStatus === "pendente" ? "Pendente" : "Aprovado";
      elResumo.textContent = `Exibindo ${totalServicos} de ${totalTodos} serviço(s) (filtro: ${statusTexto}). Valor total filtrado: ${formatarMoeda(totalValor)}`;
    }
  }
}

function atualizarBotaoFechamento() {
  const checkboxes = document.querySelectorAll("#tabelaServicosParceiro tbody input[type='checkbox']:checked");
  const btnFechamento = document.getElementById("btnFechamento");
  if (btnFechamento) {
    btnFechamento.disabled = checkboxes.length === 0;
  }
}

function criarTd(texto) {
  const td = document.createElement("td");
  td.textContent = texto;
  return td;
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function converterArquivoParaBase64(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(arquivo);
  });
}

function visualizarPdf(pdfBase64, nomeArquivo) {
  // Criar uma nova janela para visualizar o PDF
  const novaJanela = window.open();
  if (novaJanela) {
    novaJanela.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${nomeArquivo}</title>
          <style>
            body { margin: 0; padding: 0; }
            iframe { width: 100%; height: 100vh; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${pdfBase64}" type="application/pdf"></iframe>
        </body>
      </html>
    `);
  } else {
    // Se popup foi bloqueado, fazer download
    const link = document.createElement("a");
    link.href = pdfBase64;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function obterServicoPorId(id) {
  return servicosParceiros.find((s) => s.id === id);
}

function exportarServicosParceiroCsv() {
  const parcId = usuarioLogado.parceiroId ?? usuarioLogado.parceiro_id;
  const servicos = obterServicosPorParceiro(parcId);
  if (!servicos.length) {
    alert("Não há serviços para exportar.");
    return;
  }

  const cabecalho = ["Data", "Servico_Prestado", "Quantidade", "Quantidade_Paginas", "Valor_Nota", "Observacao", "Possui_PDF", "Status"];
  const linhas = servicos.map((s) => {
    const fechAprov = s.fechamentoAprovado ?? s.fechamento_aprovado;
    const fechPend = s.fechamentoPendente ?? s.fechamento_pendente;
    let status = "Disponível";
    if (fechAprov) status = "Aprovado";
    else if (fechPend) status = "Pendente";
    return [
      s.data,
      s.servicoPrestado ?? s.servico_prestado ?? "",
      s.quantidade ?? "",
      s.quantidadePaginas ?? s.quantidade_paginas ?? "",
      s.valorNota ?? s.valor_nota ?? "",
      s.observacao ?? "",
      (s.pdfNotaFiscal ?? s.pdf_nota_fiscal) ? "Sim" : "Não",
      status,
    ];
  });

  const conteudo = [cabecalho, ...linhas]
    .map((cols) => cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  downloadCsv(conteudo, `servicos_parceiro_${new Date().toISOString().slice(0, 10)}.csv`);
}
