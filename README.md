## Sistema de Gestão do Diário Oficial - Distribuição para Poupatempos

Sistema completo em HTML/CSS/JS para gerenciar a distribuição do Diário Oficial para 17 unidades de Poupatempo no estado de São Paulo.

### Características

- **Sistema de perfis**: Administrador e Funcionário do Poupatempo
- **Cadastro de Poupatempos**: O administrador cadastra todas as unidades com dados completos
- **Registro de recebimentos**: Funcionários registram quando recebem os jornais
- **Armazenamento local**: Todos os dados ficam salvos no navegador (localStorage)

---

## Como usar

### Primeiro acesso - Login como Administrador

1. Abra o arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Firefox, etc.)
2. Na tela de login:
   - **Tipo de usuário**: Selecione "Administrador"
   - **Senha**: Digite `admin123`
   - Clique em **Entrar**

**OU** crie um novo administrador:
   - **Tipo de usuário**: Selecione "Administrador"
   - **E-mail**: Digite um e-mail (ex: `admin@diariooficial.sp.gov.br`)
   - **Senha**: Digite uma senha
   - Clique em **Entrar** (o sistema criará automaticamente)

### Cadastrar Poupatempos (Administrador)

Após fazer login como administrador:

1. Na aba **"Cadastrar Poupatempo"**:
   - **Nome do Poupatempo**: Ex: "Sé", "Santo Amaro", "Itaquera", etc.
   - **Endereço**: Endereço completo da unidade
   - **Nome do Responsável**: Nome completo do funcionário responsável
   - **E-mail do Responsável**: E-mail que será usado para login do funcionário
   - **Quantidade a ser recebida**: Quantidade padrão de jornais que este Poupatempo deve receber
   - Clique em **Salvar Poupatempo**

2. **Importante**: Ao cadastrar um Poupatempo, o sistema:
   - Cria automaticamente um usuário funcionário com o e-mail informado
   - Gera uma senha automática (exibida na mensagem de sucesso)
   - Anote essa senha para fornecer ao funcionário!

3. Na aba **"Listar Poupatempos"**:
   - Veja todos os Poupatempos cadastrados
   - Exclua unidades se necessário
   - Exporte a lista para CSV

4. Na aba **"Ver Registros de Recebimento"**:
   - Veja todos os registros de recebimento de todos os Poupatempos
   - Use filtros para buscar por Poupatempo ou data da edição
   - Exporte os registros para CSV

### Registrar Recebimento (Funcionário)

1. Na tela de login:
   - **Tipo de usuário**: Selecione "Funcionário do Poupatempo"
   - **E-mail**: Digite o e-mail cadastrado pelo administrador
   - **Senha**: Digite a senha fornecida pelo administrador
   - Clique em **Entrar**

2. Na tela do funcionário:
   - Você verá automaticamente o nome do seu Poupatempo e a quantidade esperada
   - Preencha o formulário:
     - **Data da edição do Diário Oficial**: Data que consta no jornal (ex.: 14/01/2026)
     - **Data de recebimento no Poupatempo**: Data em que você recebeu o jornal
     - **Quantidade recebida**: Número de exemplares recebidos
     - **Observações**: Qualquer informação adicional (opcional)
   - Clique em **Salvar registro**

3. Na tabela abaixo, você verá apenas os seus próprios registros de recebimento

---

## Funcionalidades

### Para Administradores

- ✅ Cadastrar, listar e excluir Poupatempos
- ✅ Visualizar todos os registros de recebimento
- ✅ Filtrar registros por Poupatempo e data da edição
- ✅ Exportar listas de Poupatempos e registros para CSV
- ✅ Criar usuários funcionários automaticamente ao cadastrar Poupatempos

### Para Funcionários

- ✅ Visualizar informações do seu Poupatempo
- ✅ Registrar recebimentos de jornais
- ✅ Ver apenas seus próprios registros
- ✅ Excluir seus próprios registros

---

## Estrutura de Dados

### Poupatempo cadastrado contém:
- Nome do Poupatempo
- Endereço completo
- Nome do responsável
- E-mail do responsável (usado para login)
- Quantidade esperada de jornais

### Registro de recebimento contém:
- Poupatempo (vinculado automaticamente)
- Data da edição do Diário Oficial
- Data de recebimento no Poupatempo
- Quantidade recebida
- Observações (opcional)
- Data/hora de criação do registro

---

## Observações Importantes

⚠️ **Armazenamento Local**: Este sistema usa o localStorage do navegador. Os dados ficam salvos apenas no navegador onde você está usando. Se precisar de acesso simultâneo de várias máquinas ou backup automático, será necessário evoluir para um sistema com backend (API + banco de dados).

⚠️ **Segurança**: As senhas estão armazenadas em texto plano no localStorage. Para uso em produção, recomenda-se implementar hash de senhas e autenticação mais robusta.

⚠️ **Backup**: Para fazer backup dos dados, exporte os CSVs regularmente ou copie o conteúdo do localStorage do navegador.

---

## Próximos Passos (Opcional)

- [ ] Implementar hash de senhas
- [ ] Adicionar sistema de recuperação de senha
- [ ] Criar relatórios e dashboards
- [ ] Adicionar notificações de atraso no recebimento
- [ ] Evoluir para sistema com backend e banco de dados
- [ ] Adicionar controle de edições do Diário Oficial
