// Configuração da página de funcionário
document.addEventListener("DOMContentLoaded", () => {
  // Verificar autenticação
  if (!verificarAutenticacao("funcionario")) {
    return;
  }

  // Preencher nome do usuário, Poupatempo e quantidade esperada.
  // Como os poupatempos vêm do Supabase de forma assíncrona, preenchemos ao carregar
  // e de novo quando o evento 'dadosInicializados' disparar (após carregarPoupatempos).
  function atualizarInfoPoupatempoEUsuario() {
    const nomeEl = document.getElementById("nomePoupatempoFuncionario");
    const qtdEl = document.getElementById("quantidadeEsperadaFuncionario");
    const infoEl = document.getElementById("infoFuncionario");
    if (!infoEl) return;
    const nomeUsuario = usuarioLogado?.nome ?? "-";
    const poupatempoId = usuarioLogado?.poupatempoId ?? usuarioLogado?.poupatempo_id;
    const poupatempo = obterPoupatempoPorId(poupatempoId);
    if (nomeEl) nomeEl.textContent = poupatempo ? poupatempo.nome : "-";
    if (qtdEl) qtdEl.textContent = poupatempo ? (String(poupatempo.quantidade_esperada ?? poupatempo.quantidadeEsperada ?? "-")) : "-";
    infoEl.textContent = poupatempo ? `${poupatempo.nome} - ${nomeUsuario}` : nomeUsuario;
  }
  atualizarInfoPoupatempoEUsuario();
  window.addEventListener("dadosInicializados", () => {
    atualizarInfoPoupatempoEUsuario();
    if (typeof atualizarTabelaRegistrosFuncionario === "function") atualizarTabelaRegistrosFuncionario();
  });
  if (window.dadosInicializados) {
    atualizarInfoPoupatempoEUsuario();
    if (typeof atualizarTabelaRegistrosFuncionario === "function") atualizarTabelaRegistrosFuncionario();
  }

  // Configurar formulário de recebimento
  const formRecebimento = document.getElementById("recebimentoForm");

  formRecebimento.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dataEdicao = document.getElementById("dataEdicao").value;
    const dataRecebimento = document.getElementById("dataRecebimento").value;
    const quantidade = document.getElementById("quantidade").value;
    const observacoes = document.getElementById("observacoes").value.trim();

    if (!dataEdicao || !quantidade) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const ptId = usuarioLogado.poupatempoId ?? usuarioLogado.poupatempo_id;
    const dados = {
      poupatempoId: ptId,
      dataEdicao,
      dataRecebimento: dataRecebimento || null,
      quantidade: Number(quantidade),
      observacoes: observacoes || null,
    };

    try {
      const resultado = await criarRegistro(dados);
      if (resultado.sucesso) {
        registros.sort((a, b) => (b.data_edicao || b.dataEdicao || "").localeCompare(a.data_edicao || a.dataEdicao || ""));
        atualizarTabelaRegistrosFuncionario();
        formRecebimento.reset();
        alert("Registro salvo com sucesso!");
      } else {
        alert(resultado.mensagem || "Erro ao salvar registro.");
      }
    } catch (err) {
      alert(err?.message || "Erro ao salvar registro.");
    }
  });

  // Configurar formulário de descarte (apenas controle em memória na sessão)
  const formDescarte = document.getElementById("descarteForm");
  if (formDescarte) {
    const tabelaDescartesBody = document.querySelector("#tabelaDescartes tbody");
    const resumoDescarte = document.getElementById("resumoDescarte");
    const emptyDescarte = document.getElementById("emptyDescarte");
    const mensagemDescarte = document.getElementById("mensagemDescarte");

    let descartesSessao = [];

    const formatarDataSimples = (valor) => {
      if (!valor) return "-";
      const [ano, mes, dia] = valor.split("-");
      return `${dia}/${mes}/${ano}`;
    };

    const atualizarTabelaDescartes = () => {
      tabelaDescartesBody.innerHTML = "";
      if (!descartesSessao.length) {
        resumoDescarte.textContent = "Total registrado: 0 jornais";
        emptyDescarte.style.display = "block";
        return;
      }
      emptyDescarte.style.display = "none";

      let total = 0;
      descartesSessao.forEach((item) => {
        total += item.quantidade;
        const tr = document.createElement("tr");

        const motivoLabel = item.motivo
          ? {
              sobra: "Sobra de tiragem",
              vencido: "Jornal vencido",
              danificado: "Material danificado",
              outros: "Outros",
            }[item.motivo] || item.motivo
          : "-";

        tr.innerHTML = `
          <td>${formatarDataSimples(item.dataDescarte)}</td>
          <td class="text-end">${item.quantidade}</td>
          <td>${motivoLabel}</td>
          <td>${item.observacoes || "-"}</td>
        `;

        tabelaDescartesBody.appendChild(tr);
      });

      resumoDescarte.textContent = `Total registrado: ${total} jornais`;
    };

    formDescarte.addEventListener("submit", (e) => {
      e.preventDefault();
      mensagemDescarte.textContent = "";
      mensagemDescarte.className = "small";

      const dataDescarte = document.getElementById("dataDescarte").value;
      const quantidadeDescarte = Number(
        document.getElementById("quantidadeDescarte").value
      );
      const motivoDescarte = document.getElementById("motivoDescarte").value;
      const observacoesDescarte = document
        .getElementById("observacoesDescarte")
        .value.trim();

      if (!dataDescarte || !quantidadeDescarte) {
        mensagemDescarte.textContent =
          "Informe a data de envio e a quantidade para descarte.";
        mensagemDescarte.classList.add("text-danger");
        return;
      }

      if (!Number.isInteger(quantidadeDescarte) || quantidadeDescarte <= 0) {
        mensagemDescarte.textContent =
          "A quantidade enviada para descarte deve ser um número inteiro maior que zero.";
        mensagemDescarte.classList.add("text-danger");
        return;
      }

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataSelecionada = new Date(dataDescarte);
      dataSelecionada.setHours(0, 0, 0, 0);
      if (dataSelecionada > hoje) {
        mensagemDescarte.textContent =
          "A data de envio para descarte não pode ser futura.";
        mensagemDescarte.classList.add("text-danger");
        return;
      }

      descartesSessao.push({
        dataDescarte,
        quantidade: quantidadeDescarte,
        motivo: motivoDescarte,
        observacoes: observacoesDescarte,
        criadoEm: new Date().toISOString(),
      });

      atualizarTabelaDescartes();

      mensagemDescarte.textContent = "Descarte registrado com sucesso.";
      mensagemDescarte.classList.add("text-success");

      formDescarte.reset();
    });
  }

  // Configurar logout
  document.getElementById("btnLogoutFuncionario").addEventListener("click", () => {
    limparSessao();
    window.location.href = "login.html";
  });

  // Inicializar tabela
  atualizarTabelaRegistrosFuncionario();
  
  // Configurar mensagens
  configurarMensagensFuncionario();
});

// ========== FUNÇÕES DE MENSAGENS PARA FUNCIONÁRIO ==========
function configurarMensagensFuncionario() {
  const btnMensagens = document.getElementById("btnMensagensFuncionario");
  if (btnMensagens) {
    btnMensagens.addEventListener("click", () => {
      const modal = new bootstrap.Modal(document.getElementById('modalMensagensFuncionario'));
      modal.show();
      
      // Atualizar conteúdo quando o modal for exibido
      document.getElementById('modalMensagensFuncionario').addEventListener('shown.bs.modal', function () {
        atualizarListaUsuariosMensagemFuncionario();
        atualizarListaMensagensFuncionario();
      }, { once: true });
    });
  }
  
  const formMensagem = document.getElementById("formMensagemFuncionario");
  if (formMensagem) {
    formMensagem.addEventListener("submit", async (e) => {
      e.preventDefault();
      const destinatariosSelect = document.getElementById("destinatariosMensagemFuncionario");
      const destinatariosSelecionados = Array.from(destinatariosSelect.selectedOptions).map(opt => opt.value);
      if (destinatariosSelecionados.length === 0) {
        alert("Selecione pelo menos um destinatário.");
        return;
      }
      const assunto = document.getElementById("assuntoMensagemFuncionario").value.trim();
      const conteudo = document.getElementById("conteudoMensagemFuncionario").value.trim();
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
        const mensagemDiv = document.getElementById("mensagemFormMensagemFuncionario");
        mensagemDiv.textContent = resultado.mensagem || "Mensagem enviada com sucesso!";
        mensagemDiv.className = "alert alert-success";
        mensagemDiv.classList.remove("d-none");
        formMensagem.reset();
        atualizarListaMensagensFuncionario();
        atualizarContadorMensagensNaoLidasFuncionario();
        setTimeout(() => mensagemDiv.classList.add("d-none"), 3000);
      } else if (resultado && !resultado.sucesso) {
        const mensagemDiv = document.getElementById("mensagemFormMensagemFuncionario");
        mensagemDiv.textContent = resultado.mensagem || "Erro ao enviar mensagem.";
        mensagemDiv.className = "alert alert-danger";
        mensagemDiv.classList.remove("d-none");
        setTimeout(() => mensagemDiv.classList.add("d-none"), 5000);
      }
    });
  }
  document.querySelectorAll('input[name="filtroMensagensFuncionario"]').forEach(radio => {
    radio.addEventListener("change", atualizarListaMensagensFuncionario);
  });
  const btnExcluirMensagensFunc = document.getElementById("btnExcluirMensagensSelecionadasFuncionario");
  if (btnExcluirMensagensFunc) {
    btnExcluirMensagensFunc.addEventListener("click", excluirMensagensSelecionadasFuncionario);
  }
  atualizarContadorMensagensNaoLidasFuncionario();
  setInterval(atualizarContadorMensagensNaoLidasFuncionario, 30000);
}

function atualizarListaUsuariosMensagemFuncionario() {
  const select = document.getElementById("destinatariosMensagemFuncionario");
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

function atualizarListaMensagensFuncionario() {
  const listaMensagens = document.getElementById("listaMensagensFuncionario");
  if (!listaMensagens) return;
  listaMensagens.innerHTML = "";
  const filtro = document.querySelector('input[name="filtroMensagensFuncionario"]:checked')?.value || "recebidas";
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
    item.innerHTML = `<div class="d-flex align-items-start mb-2"><div class="form-check me-3 mt-1"><input class="form-check-input checkbox-mensagem-funcionario" type="checkbox" value="${msg.id}" id="checkMsgFunc${msg.id}" onchange="atualizarBotaoExcluirMensagensFuncionario()"></div><div class="flex-grow-1"><div class="d-flex justify-content-between align-items-start"><div class="flex-grow-1"><h6 class="mb-1 ${naoLida ? "fw-bold" : ""}">${msg.assunto}${naoLida ? '<span class="badge bg-danger ms-2">Nova</span>' : ''}</h6><p class="mb-1 small text-muted"><strong>${filtro === "recebidas" ? "De" : "Para"}:</strong> ${textoDePara}</p><p class="mb-1">${msg.mensagem}</p><small class="text-muted">${formatarDataHoraFuncionario(msg.criadoEm ?? msg.criado_em)}</small></div><div class="ms-3">${filtro === "recebidas" ? `<button class="btn btn-sm btn-outline-primary me-1" onclick="responderMensagemFuncionario('${msg.id}')">Responder</button>` : ''}${naoLida ? `<button class="btn btn-sm btn-outline-success" onclick="marcarComoLidaFuncionario('${msg.id}')">Marcar como lida</button>` : ''}</div></div></div></div>`;
    listaMensagens.appendChild(item);
  });
  atualizarBotaoExcluirMensagensFuncionario();
}

function responderMensagemFuncionario(mensagemId) {
  const msgOriginal = obterMensagemPorId(mensagemId);
  if (!msgOriginal) return;
  const remId = msgOriginal.remetenteId ?? msgOriginal.remetente_id;
  const remNome = msgOriginal.remetenteNome ?? msgOriginal.remetente_nome;
  document.getElementById("assuntoMensagemFuncionario").value = `Re: ${msgOriginal.assunto}`;
  document.getElementById("conteudoMensagemFuncionario").value = `\n\n--- Mensagem original ---\nDe: ${remNome}\nAssunto: ${msgOriginal.assunto}\n\n${msgOriginal.mensagem}`;
  const select = document.getElementById("destinatariosMensagemFuncionario");
  if (select) Array.from(select.options).forEach(opt => { opt.selected = opt.value === remId; });
  document.getElementById("assuntoMensagemFuncionario").focus();
}

function atualizarBotaoExcluirMensagensFuncionario() {
  const checkboxes = document.querySelectorAll('.checkbox-mensagem-funcionario:checked');
  const btnExcluir = document.getElementById('btnExcluirMensagensSelecionadasFuncionario');
  if (btnExcluir) {
    btnExcluir.style.display = checkboxes.length > 0 ? 'inline-block' : 'none';
  }
}

async function excluirMensagensSelecionadasFuncionario() {
  const checkboxes = document.querySelectorAll('.checkbox-mensagem-funcionario:checked');
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
      atualizarListaMensagensFuncionario();
      atualizarContadorMensagensNaoLidasFuncionario();
    } else {
      alert(resultado?.mensagem || "Erro ao excluir mensagens.");
    }
  } catch (err) {
    alert("Erro ao excluir mensagens: " + (err?.message || err));
  }
}

async function marcarComoLidaFuncionario(mensagemId) {
  await marcarMensagemComoLida(mensagemId, usuarioLogado.id);
  atualizarListaMensagensFuncionario();
  atualizarContadorMensagensNaoLidasFuncionario();
}

function atualizarContadorMensagensNaoLidasFuncionario() {
  if (!usuarioLogado) return;
  const mensagensNaoLidas = obterMensagensNaoLidas(usuarioLogado.id);
  const badge = document.getElementById("badgeMensagensNaoLidasFuncionario");
  if (badge) {
    if (mensagensNaoLidas.length > 0) {
      badge.textContent = mensagensNaoLidas.length;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }
}

function formatarDataHoraFuncionario(isoString) {
  if (!isoString) return "-";
  const data = new Date(isoString);
  return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()} ${String(data.getHours()).padStart(2, "0")}:${String(data.getMinutes()).padStart(2, "0")}`;
}

// Estado de paginação para funcionario
const estadoPaginacaoFuncionario = {};
const funcoesAtualizacaoTabelaFuncionario = {};

function aplicarPaginacaoTabelaFuncionario(lista, tbody, renderizarLinha, idControles, funcaoAtualizacao, itensPorPagina = 30) {
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
  
  if (!estadoPaginacaoFuncionario[idControles]) {
    estadoPaginacaoFuncionario[idControles] = { paginaAtual: 1 };
  }
  
  if (funcaoAtualizacao) {
    funcoesAtualizacaoTabelaFuncionario[idControles] = funcaoAtualizacao;
  }
  
  const paginaAtual = estadoPaginacaoFuncionario[idControles].paginaAtual;
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
      <button type="button" class="btn btn-sm btn-outline-secondary" ${paginaAtual === 1 ? "disabled" : ""} onclick="irParaPaginaFuncionario('${idControles}', ${paginaAtual - 1}, ${totalPaginas})">
        <i class="bi bi-chevron-left"></i> Anterior
      </button>
      <button type="button" class="btn btn-sm btn-outline-secondary" disabled>
        Página ${paginaAtual} de ${totalPaginas}
      </button>
      <button type="button" class="btn btn-sm btn-outline-secondary" ${paginaAtual === totalPaginas ? "disabled" : ""} onclick="irParaPaginaFuncionario('${idControles}', ${paginaAtual + 1}, ${totalPaginas})">
        Próxima <i class="bi bi-chevron-right"></i>
      </button>
    </div>
  `;
  
  return itensPagina;
}

window.irParaPaginaFuncionario = function(idControles, novaPagina, totalPaginas) {
  if (novaPagina < 1 || novaPagina > totalPaginas) return;
  estadoPaginacaoFuncionario[idControles].paginaAtual = novaPagina;
  if (funcoesAtualizacaoTabelaFuncionario[idControles]) {
    funcoesAtualizacaoTabelaFuncionario[idControles]();
  }
};

function atualizarTabelaRegistrosFuncionario() {
  const tbody = document.querySelector("#tabelaRegistros tbody");
  if (!tbody) return;

  const ptId = usuarioLogado.poupatempoId ?? usuarioLogado.poupatempo_id;
  const meusRegistros = registros.filter((r) => (r.poupatempoId ?? r.poupatempo_id) === ptId);

  if (!meusRegistros.length) {
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.className = "text-center text-muted";
    td.textContent = "Nenhum registro encontrado.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    const controles = document.getElementById("paginacaoRegistrosFuncionario");
    if (controles) controles.remove();
  } else {
    const renderizarLinha = (reg) => {
      const tr = document.createElement("tr");
      const dataEd = reg.dataEdicao ?? reg.data_edicao;
      const dataRec = reg.dataRecebimento ?? reg.data_recebimento;

      tr.appendChild(criarTd(formatarData(dataEd)));
      tr.appendChild(criarTd(formatarData(dataRec)));
      const tdQtd = criarTd(reg.quantidade);
      tdQtd.className = "text-end";
      tr.appendChild(tdQtd);
      tr.appendChild(criarTd(reg.observacoes || "-"));

      const tdAcoes = document.createElement("td");
      tdAcoes.className = "text-end";
      const btnExcluir = document.createElement("button");
      btnExcluir.className = "btn btn-sm btn-outline-danger";
      btnExcluir.textContent = "Excluir";
      btnExcluir.addEventListener("click", async () => {
        if (!confirm("Confirma a exclusão deste registro?")) return;
        await excluirRegistro(reg.id);
        atualizarTabelaRegistrosFuncionario();
      });
      tdAcoes.appendChild(btnExcluir);
      tr.appendChild(tdAcoes);

      tbody.appendChild(tr);
    };
    
    aplicarPaginacaoTabelaFuncionario(meusRegistros, tbody, renderizarLinha, "paginacaoRegistrosFuncionario", atualizarTabelaRegistrosFuncionario);
  }

  atualizarResumoFuncionario(meusRegistros);
}

function criarTd(texto) {
  const td = document.createElement("td");
  td.textContent = texto;
  return td;
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

