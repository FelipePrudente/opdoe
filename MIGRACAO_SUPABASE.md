# Guia de Migração para Supabase

Este documento explica como migrar o sistema de `localStorage` para Supabase.

## ⚠️ IMPORTANTE

O sistema ainda está usando `localStorage` por padrão. Para usar Supabase, você precisa:

1. **Configurar o Supabase** (veja `SUPABASE_SETUP.md`)
2. **Atualizar o `auth.js`** para usar funções assíncronas

## 🔄 Mudanças Necessárias

### 1. Atualizar Inicialização dos Dados

No final do arquivo `auth.js`, substitua:

```javascript
// Inicializar dados ao carregar
try {
  carregarUsuarios();
  carregarPoupatempos();
  carregarRegistros();
  carregarInvestimentos();
  carregarReceitas();
  carregarParceiros();
  carregarServicosParceiros();
  carregarFechamentos();
  carregarMensagens();
} catch (error) {
  console.error("Erro ao inicializar dados:", error);
}
```

Por:

```javascript
// Inicializar dados ao carregar (assíncrono para Supabase)
(async function inicializarDados() {
  try {
    await carregarUsuarios();
    await carregarPoupatempos();
    await carregarRegistros();
    await carregarInvestimentos();
    await carregarReceitas();
    await carregarParceiros();
    await carregarServicosParceiros();
    await carregarFechamentos();
    await carregarMensagens();
    
    // Se houver confirmações de não recebimento
    if (typeof carregarConfirmacoesNaoRecebimento === 'function') {
      await carregarConfirmacoesNaoRecebimento();
    }
  } catch (error) {
    console.error("Erro ao inicializar dados:", error);
  }
})();
```

### 2. Atualizar Funções que Criam Registros

No arquivo `funcionario.js`, substitua:

```javascript
registros.push(novo);
registros.sort((a, b) => b.dataEdicao.localeCompare(a.dataEdicao));
salvarRegistros();
```

Por:

```javascript
const resultado = await criarRegistro(novo);
if (resultado.sucesso) {
  registros.sort((a, b) => b.data_edicao.localeCompare(a.data_edicao));
  atualizarTabelaRegistrosFuncionario();
  formRecebimento.reset();
  alert("Registro salvo com sucesso!");
} else {
  alert("Erro ao salvar registro: " + resultado.mensagem);
}
```

### 3. Atualizar Funções que Usam Dados

Todas as funções que acessam dados precisam aguardar o carregamento. Por exemplo, no `login.js`:

```javascript
// Antes
function fazerLogin() {
  carregarUsuarios();
  // ... resto do código
}

// Depois
async function fazerLogin() {
  await carregarUsuarios();
  // ... resto do código
}
```

### 4. Mapeamento de Campos

O Supabase usa `snake_case` enquanto o código atual usa `camelCase`. O arquivo `supabase-db.js` já faz essa conversão, mas você precisa estar ciente:

- `poupatempoId` → `poupatempo_id`
- `dataEdicao` → `data_edicao`
- `dataRecebimento` → `data_recebimento`
- `criadoEm` → `criado_em`
- etc.

### 5. Variáveis Globais

As variáveis globais (`usuarios`, `poupatempos`, etc.) ainda são usadas para cache local. O `supabase-db.js` mantém essas variáveis atualizadas após cada operação.

## 📝 Checklist de Migração

- [ ] Configurar Supabase (URL e chave)
- [ ] Executar script SQL (`supabase-schema.sql`)
- [ ] Atualizar inicialização de dados em `auth.js`
- [ ] Atualizar todas as funções que criam dados para usar funções assíncronas
- [ ] Atualizar todas as funções que leem dados para aguardar carregamento
- [ ] Testar login
- [ ] Testar criação de registros
- [ ] Testar criação de poupatempos
- [ ] Testar criação de parceiros
- [ ] Testar relatórios

## 🔍 Verificação

Para verificar se está usando Supabase:

1. Abra o Console do Desenvolvedor (F12)
2. Verifique se não há erros relacionados ao Supabase
3. Verifique se os dados aparecem no Table Editor do Supabase

## 🐛 Troubleshooting

### Erro: "supabase is not defined"
- Verifique se os scripts estão na ordem correta nos HTMLs
- Verifique se `supabase-config.js` está carregado antes de `supabase-db.js`

### Erro: "relation does not exist"
- Execute o script SQL no Supabase

### Dados não aparecem
- Verifique se as funções estão sendo chamadas com `await`
- Verifique o Console para erros
