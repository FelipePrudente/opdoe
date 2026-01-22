# Configuração do Supabase - Gestão Diário Oficial

Este guia explica como configurar o Supabase para o sistema de Gestão Diário Oficial.

## 📋 Pré-requisitos

1. Conta no Supabase (crie em https://supabase.com)
2. Projeto criado no Supabase

## 🔧 Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse https://supabase.com e faça login
2. Clique em "New Project"
3. Preencha:
   - **Name**: Nome do seu projeto (ex: "gestao-diario-oficial")
   - **Database Password**: Crie uma senha forte para o banco
   - **Region**: Escolha a região mais próxima
4. Clique em "Create new project"

### 2. Obter Credenciais

1. No painel do projeto, vá em **Settings** → **API**
2. Copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (chave pública anônima)

### 3. Configurar o Sistema

1. Abra o arquivo `supabase-config.js`
2. Substitua as variáveis:

```javascript
const SUPABASE_URL = "https://seu-projeto.supabase.co"; // Cole sua Project URL aqui
const SUPABASE_ANON_KEY = "sua-chave-anon-aqui"; // Cole sua chave anônima aqui
```

### 4. Criar Tabelas no Banco

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Abra o arquivo `supabase-schema.sql` deste projeto
4. Copie todo o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** (ou pressione Ctrl+Enter)

Isso criará todas as tabelas necessárias:
- `usuarios`
- `poupatempos`
- `registros`
- `investimentos`
- `receitas`
- `parceiros`
- `servicos_parceiros`
- `fechamentos`
- `mensagens`
- `confirmacoes_nao_recebimento`

### 5. Verificar Configuração

1. Abra o sistema no navegador
2. Abra o Console do Desenvolvedor (F12)
3. Verifique se não há erros relacionados ao Supabase
4. Se aparecer o aviso "⚠️ Supabase não configurado!", verifique se as credenciais foram preenchidas corretamente

## 🔄 Migração de Dados (Opcional)

Se você já tem dados no localStorage e quer migrar para o Supabase:

1. Abra o Console do Desenvolvedor (F12)
2. Execute o seguinte código para exportar os dados:

```javascript
// Exportar dados do localStorage
const dados = {
  usuarios: JSON.parse(localStorage.getItem('gestao_diario_oficial_usuarios_v1') || '[]'),
  poupatempos: JSON.parse(localStorage.getItem('gestao_diario_oficial_poupatempos_v1') || '[]'),
  registros: JSON.parse(localStorage.getItem('gestao_diario_oficial_registros_v1') || '[]'),
  investimentos: JSON.parse(localStorage.getItem('gestao_diario_oficial_investimentos_v1') || '[]'),
  receitas: JSON.parse(localStorage.getItem('gestao_diario_oficial_receitas_v1') || '[]'),
  parceiros: JSON.parse(localStorage.getItem('gestao_diario_oficial_parceiros_v1') || '[]'),
  servicosParceiros: JSON.parse(localStorage.getItem('gestao_diario_oficial_servicos_parceiros_v1') || '[]'),
  fechamentos: JSON.parse(localStorage.getItem('gestao_diario_oficial_fechamentos_v1') || '[]'),
  mensagens: JSON.parse(localStorage.getItem('gestao_diario_oficial_mensagens_v1') || '[]')
};
console.log(JSON.stringify(dados, null, 2));
```

3. Copie o JSON gerado
4. Use o SQL Editor do Supabase para inserir os dados manualmente ou crie um script de migração

## 🔒 Segurança

As políticas de Row Level Security (RLS) estão configuradas no schema SQL. Por padrão:
- **Leitura**: Todos os usuários podem ler dados
- **Escrita**: Apenas admins podem modificar dados críticos
- **Registros**: Todos podem criar registros, apenas admins podem modificar/deletar

**IMPORTANTE**: Ajuste as políticas conforme suas necessidades de segurança em produção!

## 📝 Notas Importantes

1. **Senhas**: As senhas estão sendo armazenadas em texto plano. Em produção, use hash (bcrypt, argon2, etc.)
2. **Autenticação**: O sistema atual usa autenticação simples. Considere implementar autenticação do Supabase Auth para maior segurança
3. **Backup**: Configure backups automáticos no Supabase
4. **Monitoramento**: Use o dashboard do Supabase para monitorar uso e performance

## 🆘 Troubleshooting

### Erro: "Supabase não configurado"
- Verifique se `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão preenchidos em `supabase-config.js`

### Erro: "relation does not exist"
- Execute o script SQL (`supabase-schema.sql`) no SQL Editor do Supabase

### Erro: "permission denied"
- Verifique as políticas RLS no Supabase
- Ajuste as políticas conforme necessário

### Dados não aparecem
- Verifique se as tabelas foram criadas corretamente
- Verifique se há dados nas tabelas (use o Table Editor do Supabase)
- Verifique o Console do navegador para erros

## 📚 Documentação

- Supabase Docs: https://supabase.com/docs
- Supabase JS Client: https://supabase.com/docs/reference/javascript/introduction
