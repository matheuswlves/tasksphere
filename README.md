
# TaskSphere - Gestão Colaborativa de Projetos

TaskSphere é uma aplicação web para gerenciamento de projetos e tarefas com colaboração entre usuários autenticados.

## 🚀 Instruções para Instalação e Execução:

### ✔️ Pré-requisitos:

- Node.js (versão 16.x ou superior)
- npm ou yarn
- Git
- JSON Server 

## Instalação:

```bash
git clone https://github.com/matheuswlves/tasksphere
cd tasksphere
npm install
# ou
yarn install
```

## Iniciando o JSON Server:

O arquivo `db.json` tem usuários, projetos e tarefas de exemplo (incluindo um com `role: "admin"`).  
Rode, em um terminal, o comando:

```bash
json-server --watch db.json --port 3001
```

## Rodando a aplicação:

Com o JSON Server ativo, execute, em outro terminal:

```bash
npm start
# ou
yarn start
```

Acesse: [http://localhost:3000](http://localhost:3000)

-----------------------------------------------------------------------------------

## Informações adicionais:

## Credenciais de Teste:

Admin:
Email: admin@viitra.com
Senha: 123456
Usuário 01:(criador de 01 projeto)
Email: matheus@viitra.com
Senha: 123456
Usuário 01:(colaborador)
Email: abraao@viitra.com
Senha: 123456

## Estrutura do Projeto:
public/: Arquivos estáticos e index.html.
src/: Código fonte da aplicação React.
api/: Funções para interagir com as APIs (local e externa).
assets/: Imagens, fontes e outros ativos estáticos (se houver).
components/: Componentes React reutilizáveis (divididos em atoms, molecules, organisms se o Atomic Design foi seguido).
layout/: Componentes de layout como Header, Footer.
contexts/: Contextos React (ex: AuthContext).
hooks/: Hooks customizados.
pages/: Componentes que representam as diferentes telas/rotas da aplicação.
routes/: Configuração de rotas e componentes de proteção de rota.
styles/: Arquivos CSS globais ou específicos (se não usar CSS-in-JS ou módulos).
App.js: Componente raiz da aplicação, onde as rotas principais são definidas.
index.js: Ponto de entrada da aplicação React.
index.css: Estilos globais e variáveis CSS.
db.json: Arquivo de dados para o JSON Server.
package.json: Lista de dependências e scripts do projeto.
