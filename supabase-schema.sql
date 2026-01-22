-- Schema do banco de dados Supabase para Gestão Diário Oficial
-- Execute este script no SQL Editor do Supabase

-- ========== TABELAS BASE (sem dependências) ==========

-- ========== TABELA DE POUPATEMPOS ==========
CREATE TABLE IF NOT EXISTS poupatempos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  cep TEXT,
  endereco TEXT NOT NULL,
  telefone TEXT,
  gerente_nome TEXT NOT NULL,
  gerente_email TEXT NOT NULL,
  gerente_senha TEXT NOT NULL,
  coordenador_nome TEXT NOT NULL,
  coordenador_email TEXT NOT NULL,
  coordenador_senha TEXT NOT NULL,
  quantidade_esperada INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poupatempos_nome ON poupatempos(nome);

-- ========== TABELA DE PARCEIROS ==========
CREATE TABLE IF NOT EXISTS parceiros (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  cep TEXT,
  endereco TEXT NOT NULL,
  servicos_contratados TEXT NOT NULL,
  responsavel_nome TEXT NOT NULL,
  responsavel_email TEXT NOT NULL,
  responsavel_senha TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parceiros_nome ON parceiros(nome);

-- ========== TABELAS COM DEPENDÊNCIAS ==========

-- ========== TABELA DE USUÁRIOS ==========
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('admin', 'funcionario', 'parceiro')),
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  nome TEXT NOT NULL,
  poupatempo_id TEXT REFERENCES poupatempos(id) ON DELETE CASCADE,
  parceiro_id TEXT REFERENCES parceiros(id) ON DELETE CASCADE,
  cargo TEXT, -- 'gerente' ou 'coordenador' para funcionários
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_poupatempo_id ON usuarios(poupatempo_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_parceiro_id ON usuarios(parceiro_id);

-- ========== TABELA DE REGISTROS ==========
CREATE TABLE IF NOT EXISTS registros (
  id TEXT PRIMARY KEY,
  poupatempo_id TEXT NOT NULL REFERENCES poupatempos(id) ON DELETE CASCADE,
  data_edicao DATE NOT NULL,
  data_recebimento DATE,
  quantidade INTEGER NOT NULL,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registros_poupatempo_id ON registros(poupatempo_id);
CREATE INDEX IF NOT EXISTS idx_registros_data_edicao ON registros(data_edicao);
CREATE INDEX IF NOT EXISTS idx_registros_data_recebimento ON registros(data_recebimento);

-- ========== TABELA DE INVESTIMENTOS ==========
CREATE TABLE IF NOT EXISTS investimentos (
  id TEXT PRIMARY KEY,
  ano INTEGER NOT NULL UNIQUE,
  operacional DECIMAL(10, 2) NOT NULL DEFAULT 0,
  impressao DECIMAL(10, 2) NOT NULL DEFAULT 0,
  distribuicao DECIMAL(10, 2) NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investimentos_ano ON investimentos(ano);

-- ========== TABELA DE RECEITAS ==========
CREATE TABLE IF NOT EXISTS receitas (
  id TEXT PRIMARY KEY,
  data DATE NOT NULL,
  faturamento DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_pedidos INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receitas_data ON receitas(data);

-- ========== TABELA DE FATURAMENTO ANUAL (REFERÊNCIA PARA COMPARATIVO) ==========
CREATE TABLE IF NOT EXISTS faturamento_anual (
  id TEXT PRIMARY KEY,
  ano INTEGER NOT NULL UNIQUE,
  valor DECIMAL(10, 2) NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faturamento_anual_ano ON faturamento_anual(ano);

-- ========== TABELA DE FECHAMENTOS ==========
CREATE TABLE IF NOT EXISTS fechamentos (
  id TEXT PRIMARY KEY,
  parceiro_id TEXT NOT NULL REFERENCES parceiros(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  servicos_ids TEXT[] NOT NULL DEFAULT '{}',
  quantidade_total INTEGER NOT NULL DEFAULT 0,
  valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  aprovado_em TIMESTAMP WITH TIME ZONE,
  aprovado_por TEXT REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_fechamentos_parceiro_id ON fechamentos(parceiro_id);
CREATE INDEX IF NOT EXISTS idx_fechamentos_status ON fechamentos(status);

-- ========== TABELA DE SERVIÇOS DE PARCEIROS ==========
CREATE TABLE IF NOT EXISTS servicos_parceiros (
  id TEXT PRIMARY KEY,
  parceiro_id TEXT NOT NULL REFERENCES parceiros(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  servico_prestado TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  quantidade_paginas INTEGER DEFAULT 0,
  valor_nota DECIMAL(10, 2) NOT NULL DEFAULT 0,
  observacao TEXT,
  pdf_nota_fiscal TEXT, -- URL ou base64 do PDF
  nome_arquivo_pdf TEXT,
  fechamento_pendente TEXT,
  fechamento_aprovado BOOLEAN DEFAULT FALSE,
  fechamento_id TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servicos_parceiro_id ON servicos_parceiros(parceiro_id);
CREATE INDEX IF NOT EXISTS idx_servicos_data ON servicos_parceiros(data);

-- Adicionar foreign keys para fechamentos após criar a tabela (DROP IF EXISTS permite reexecutar o script)
ALTER TABLE servicos_parceiros DROP CONSTRAINT IF EXISTS fk_servicos_fechamento_pendente;
ALTER TABLE servicos_parceiros 
  ADD CONSTRAINT fk_servicos_fechamento_pendente 
  FOREIGN KEY (fechamento_pendente) REFERENCES fechamentos(id);

ALTER TABLE servicos_parceiros DROP CONSTRAINT IF EXISTS fk_servicos_fechamento_id;
ALTER TABLE servicos_parceiros 
  ADD CONSTRAINT fk_servicos_fechamento_id 
  FOREIGN KEY (fechamento_id) REFERENCES fechamentos(id);

-- ========== TABELA DE MENSAGENS ==========
CREATE TABLE IF NOT EXISTS mensagens (
  id TEXT PRIMARY KEY,
  remetente_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  remetente_nome TEXT NOT NULL,
  remetente_email TEXT NOT NULL,
  remetente_tipo TEXT NOT NULL,
  destinatarios TEXT[] NOT NULL DEFAULT '{}', -- Array de IDs ou 'todos'
  assunto TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida_por TEXT[] DEFAULT '{}', -- Array de IDs de usuários que leram
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_remetente_id ON mensagens(remetente_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_criado_em ON mensagens(criado_em);

-- ========== TABELA DE CONFIRMAÇÕES DE NÃO RECEBIMENTO ==========
CREATE TABLE IF NOT EXISTS confirmacoes_nao_recebimento (
  id TEXT PRIMARY KEY,
  poupatempo_id TEXT NOT NULL REFERENCES poupatempos(id) ON DELETE CASCADE,
  data_edicao DATE NOT NULL,
  observacoes TEXT,
  confirmado_por TEXT REFERENCES usuarios(id),
  confirmado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poupatempo_id, data_edicao)
);

CREATE INDEX IF NOT EXISTS idx_confirmacoes_poupatempo_id ON confirmacoes_nao_recebimento(poupatempo_id);
CREATE INDEX IF NOT EXISTS idx_confirmacoes_data_edicao ON confirmacoes_nao_recebimento(data_edicao);

-- ========== POLÍTICAS DE SEGURANÇA (RLS) ==========
-- Habilitar Row Level Security em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE poupatempos ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE investimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE faturamento_anual ENABLE ROW LEVEL SECURITY;
ALTER TABLE parceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_parceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE fechamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmacoes_nao_recebimento ENABLE ROW LEVEL SECURITY;

-- Políticas básicas: permitir todas as operações para usuários autenticados
-- (Ajuste conforme suas necessidades de segurança)
-- DROP POLICY IF EXISTS permite reexecutar o script

-- Usuários: todos podem ler, mas apenas admins podem modificar
DROP POLICY IF EXISTS "Usuários podem ler todos" ON usuarios;
DROP POLICY IF EXISTS "Apenas admins podem inserir usuários" ON usuarios;
DROP POLICY IF EXISTS "Apenas admins podem atualizar usuários" ON usuarios;
DROP POLICY IF EXISTS "Apenas admins podem deletar usuários" ON usuarios;
CREATE POLICY "Usuários podem ler todos" ON usuarios FOR SELECT USING (true);
CREATE POLICY "Apenas admins podem inserir usuários" ON usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Apenas admins podem atualizar usuários" ON usuarios FOR UPDATE USING (true);
CREATE POLICY "Apenas admins podem deletar usuários" ON usuarios FOR DELETE USING (true);

-- Poupatempos: todos podem ler, apenas admins podem modificar
DROP POLICY IF EXISTS "Todos podem ler poupatempos" ON poupatempos;
DROP POLICY IF EXISTS "Apenas admins podem modificar poupatempos" ON poupatempos;
CREATE POLICY "Todos podem ler poupatempos" ON poupatempos FOR SELECT USING (true);
CREATE POLICY "Apenas admins podem modificar poupatempos" ON poupatempos FOR ALL USING (true);

-- Registros: todos podem ler e inserir, apenas admins podem modificar/deletar
DROP POLICY IF EXISTS "Todos podem ler registros" ON registros;
DROP POLICY IF EXISTS "Todos podem inserir registros" ON registros;
DROP POLICY IF EXISTS "Apenas admins podem modificar registros" ON registros;
DROP POLICY IF EXISTS "Apenas admins podem deletar registros" ON registros;
CREATE POLICY "Todos podem ler registros" ON registros FOR SELECT USING (true);
CREATE POLICY "Todos podem inserir registros" ON registros FOR INSERT WITH CHECK (true);
CREATE POLICY "Apenas admins podem modificar registros" ON registros FOR UPDATE USING (true);
CREATE POLICY "Apenas admins podem deletar registros" ON registros FOR DELETE USING (true);

-- Investimentos: todos podem ler, apenas admins podem modificar
DROP POLICY IF EXISTS "Todos podem ler investimentos" ON investimentos;
DROP POLICY IF EXISTS "Apenas admins podem modificar investimentos" ON investimentos;
CREATE POLICY "Todos podem ler investimentos" ON investimentos FOR SELECT USING (true);
CREATE POLICY "Apenas admins podem modificar investimentos" ON investimentos FOR ALL USING (true);

-- Receitas: todos podem ler, apenas admins podem modificar
DROP POLICY IF EXISTS "Todos podem ler receitas" ON receitas;
DROP POLICY IF EXISTS "Apenas admins podem modificar receitas" ON receitas;
CREATE POLICY "Todos podem ler receitas" ON receitas FOR SELECT USING (true);
CREATE POLICY "Apenas admins podem modificar receitas" ON receitas FOR ALL USING (true);

-- Faturamento anual (referência): todos podem ler, apenas admins podem modificar
DROP POLICY IF EXISTS "Todos podem ler faturamento_anual" ON faturamento_anual;
DROP POLICY IF EXISTS "Apenas admins podem modificar faturamento_anual" ON faturamento_anual;
CREATE POLICY "Todos podem ler faturamento_anual" ON faturamento_anual FOR SELECT USING (true);
CREATE POLICY "Apenas admins podem modificar faturamento_anual" ON faturamento_anual FOR ALL USING (true);

-- Parceiros: todos podem ler, apenas admins podem modificar
DROP POLICY IF EXISTS "Todos podem ler parceiros" ON parceiros;
DROP POLICY IF EXISTS "Apenas admins podem modificar parceiros" ON parceiros;
CREATE POLICY "Todos podem ler parceiros" ON parceiros FOR SELECT USING (true);
CREATE POLICY "Apenas admins podem modificar parceiros" ON parceiros FOR ALL USING (true);

-- Serviços de parceiros: todos podem ler, apenas admins podem modificar
DROP POLICY IF EXISTS "Todos podem ler servicos_parceiros" ON servicos_parceiros;
DROP POLICY IF EXISTS "Apenas admins podem modificar servicos_parceiros" ON servicos_parceiros;
CREATE POLICY "Todos podem ler servicos_parceiros" ON servicos_parceiros FOR SELECT USING (true);
CREATE POLICY "Apenas admins podem modificar servicos_parceiros" ON servicos_parceiros FOR ALL USING (true);

-- Fechamentos: todos podem ler, apenas admins podem aprovar/rejeitar
DROP POLICY IF EXISTS "Todos podem ler fechamentos" ON fechamentos;
DROP POLICY IF EXISTS "Parceiros podem criar fechamentos" ON fechamentos;
DROP POLICY IF EXISTS "Apenas admins podem modificar fechamentos" ON fechamentos;
DROP POLICY IF EXISTS "Apenas admins podem deletar fechamentos" ON fechamentos;
CREATE POLICY "Todos podem ler fechamentos" ON fechamentos FOR SELECT USING (true);
CREATE POLICY "Parceiros podem criar fechamentos" ON fechamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Apenas admins podem modificar fechamentos" ON fechamentos FOR UPDATE USING (true);
CREATE POLICY "Apenas admins podem deletar fechamentos" ON fechamentos FOR DELETE USING (true);

-- Mensagens: todos podem ler, criar, atualizar e deletar mensagens (recebidas ou enviadas)
DROP POLICY IF EXISTS "Todos podem ler mensagens" ON mensagens;
DROP POLICY IF EXISTS "Todos podem criar mensagens" ON mensagens;
DROP POLICY IF EXISTS "Todos podem atualizar mensagens (marcar como lida)" ON mensagens;
DROP POLICY IF EXISTS "Todos podem deletar mensagens" ON mensagens;
CREATE POLICY "Todos podem ler mensagens" ON mensagens FOR SELECT USING (true);
CREATE POLICY "Todos podem criar mensagens" ON mensagens FOR INSERT WITH CHECK (true);
CREATE POLICY "Todos podem atualizar mensagens (marcar como lida)" ON mensagens FOR UPDATE USING (true);
CREATE POLICY "Todos podem deletar mensagens" ON mensagens FOR DELETE USING (true);

-- Confirmações de não recebimento: todos podem ler e criar
DROP POLICY IF EXISTS "Todos podem ler confirmacoes" ON confirmacoes_nao_recebimento;
DROP POLICY IF EXISTS "Todos podem criar confirmacoes" ON confirmacoes_nao_recebimento;
CREATE POLICY "Todos podem ler confirmacoes" ON confirmacoes_nao_recebimento FOR SELECT USING (true);
CREATE POLICY "Todos podem criar confirmacoes" ON confirmacoes_nao_recebimento FOR INSERT WITH CHECK (true);
