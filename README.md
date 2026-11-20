# HelpDesk TI — Firebase + RBAC

Aplicação web de chamados com Node.js, Express, EJS, Firebase Authentication e Cloud Firestore.

Nome: Kauan Borges Araujo / RA: 117638

Link da aplicação no Render: https://chamados-ti-acs-u8ac.onrender.com

## Credenciais de teste
- Email user: joao@empresa.com
- Email técnico: roberto@empresa.com
- Email admin: kauan@empresa.com


## Requisitos

- Node.js 20 ou 22
- Projeto no Firebase com Authentication e Cloud Firestore ativados
- Aplicativo Web cadastrado no Firebase
- Conta de serviço do Firebase Admin SDK

## Configuração local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. No Firebase Console, habilite **Authentication > Sign-in method**:
   - E-mail/senha
   - Google

3. Crie o banco Cloud Firestore em modo de produção.

4. Em Configurações do projeto > Seus apps, registre um aplicativo Web e copie os campos da configuração Firebase.

5. Em Configurações do projeto > Contas de serviço, gere uma chave privada para o Firebase Admin SDK. Mantenha o JSON em segredo.

6. Copie `.env.example` para `.env` e preencha:
   - `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`: configuração do app Web.
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: conteúdo completo do JSON da conta de serviço em uma única linha.
   - `ADMIN_EMAILS`: e-mails que devem receber o perfil inicial `admin`.

7. Execute:

   ```bash
   npm start
   ```

   Acesse `http://localhost:3000/login`.

## Perfis e regras

- `user`: cria chamados e consulta apenas os chamados cujo `autorUid` corresponde ao próprio UID. Pode comentar nos próprios chamados.
- `tecnico`: consulta todos, assume chamados, altera status e adiciona pareceres.
- `admin`: possui as permissões de técnico, pode excluir chamados e alterar perfis na tela Usuários.

O perfil é lido do documento `usuarios/{uid}` no servidor. O endpoint de bootstrap cria esse documento no primeiro login com `uid`, `nome`, `email` e `perfil: "user"`; e-mails presentes em `ADMIN_EMAILS` recebem `admin`. O navegador nunca pode definir o próprio perfil.

## Estrutura Firestore

- `usuarios/{uid}`: `uid`, `nome`, `email`, `perfil`, `criadoEm`.
- `chamados/{id}`: `titulo`, `descricao`, `autorUid`, `autorNome`, `autorEmail`, `status`, `tecnicoResponsavel`, `prioridade`, `categoria`, `setor`, `criadoEm`, `atualizadoEm`.
- `comentarios/{id}`: `chamadoId`, `autorUid`, `autorNome`, `texto`, `criadoEm`.

## Segurança

O servidor verifica o Firebase ID token em todas as rotas `/api` e consulta o perfil no Firestore antes de autorizar operações. As regras Firestore negam acesso direto do navegador; o servidor usa Admin SDK, que ignora as regras e deve ser protegido pelas verificações de autorização do backend.

**Nunca publique** `.env`, JSON da conta de serviço ou chaves privadas no GitHub. A configuração Firebase Web não é uma credencial de servidor; a conta de serviço é segredo.

## Deploy no Render

1. Envie o projeto ao GitHub sem `.env` e sem a chave privada.
2. No Render, crie um **Web Service** conectado ao repositório.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Cadastre todas as variáveis listadas em `.env.example` nas Environment Variables do serviço.
6. Defina `NODE_ENV=production`, `FIREBASE_PROJECT_ID` e `ADMIN_EMAILS`.
7. Faça o deploy e teste cadastro, login Google, isolamento de chamados e permissões dos três perfis.

## Observações importantes

- A tela de cadastro solicita nome completo e cria contas com perfil `user`; o perfil `admin` inicial é concedido somente aos e-mails previamente definidos em `ADMIN_EMAILS`.
- Para promover usuários a `tecnico` ou `admin`, entre com a conta administradora e use a tela Usuários.
- O app utiliza o Admin SDK no backend. Não coloque a chave privada no código do navegador.
- Este pacote substitui a persistência Sequelize/SQLite anterior por Firestore. Os dados existentes no SQLite não são migrados automaticamente.
