# RocketLab Filmes

Aplicação desenvolvida para a atividade do **RocketLab 2026.2**, com o objetivo de construir uma plataforma de catálogo e avaliação de filmes a partir da estrutura de dados fornecida.

O projeto evolui a base inicial para uma aplicação completa, com backend, frontend e banco de dados. O usuário pode explorar o catálogo, pesquisar filmes, visualizar informações detalhadas, criar uma conta, avaliar filmes e manter seu próprio histórico.

Também é possível adicionar novos filmes ao catálogo. Filmes criados manualmente ficam associados ao usuário responsável, que pode posteriormente editá-los.

## Funcionalidades

A aplicação permite:

- visualizar e pesquisar o catálogo de filmes;
- navegar por gêneros, décadas e outras categorias;
- visualizar detalhes, direção, gêneros, sinopse e avaliações de cada filme;
- criar conta e fazer login;
- avaliar filmes utilizando notas de 0 a 5;
- editar avaliações já publicadas;
- marcar filmes como assistidos;
- consultar os filmes assistidos e avaliados na página da conta;
- adicionar novos filmes ao catálogo;
- editar os filmes adicionados pelo próprio usuário;
- visualizar os filmes criados pelo usuário.

## Tecnologias

O backend foi desenvolvido com **Python e FastAPI**, utilizando **SQLAlchemy** para acesso ao banco de dados e **Alembic** para controle das migrações.

O banco utilizado no desenvolvimento é **SQLite**, com operações assíncronas através do `aiosqlite`.

O frontend foi desenvolvido com **React, TypeScript e Vite**. A interface utiliza CSS próprio e ícones do **Lucide React**.

A API também disponibiliza documentação automática através do Swagger.

## Estrutura do projeto

```text
avaliacao-filmes/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── movies/
│   │   └── users/
│   ├── migrations/
│   ├── tests/
│   └── pyproject.toml
│
├── frontend/
│   ├── src/
│   │   ├── auth/
│   │   ├── components/
│   │   └── services/
│   └── package.json
│
└── README.md
```

## Como rodar

### Backend

É necessário ter **Python 3.11 ou superior**.

Na raiz do projeto:

```bash
cd backend
```

Crie o ambiente virtual:

### Windows

```bash
python -m venv .venv
.venv\Scripts\activate
```

Instale as dependências:

```bash
pip install -e ".[dev]"
```

Crie o arquivo `.env` a partir do `.env.example`.

Depois aplique as migrações:

```bash
alembic upgrade head
```

Para desenvolvimento local, defina a chave utilizada pela autenticação:

### PowerShell

```powershell
$env:JWT_SECRET_KEY="rocketlab-dev-secret-key"
```

Inicie a API:

```bash
python -m uvicorn app.main:app --reload
```

O backend ficará disponível em:

```text
http://localhost:8000
```

A documentação Swagger pode ser acessada em:

```text
http://localhost:8000/docs
```

Também é possível verificar se a API está funcionando através de:

```text
GET http://localhost:8000/health
```

### Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O frontend ficará disponível normalmente em:

```text
http://localhost:5173
```

## Banco de dados

O projeto utiliza **SQLite** por padrão. O arquivo local do banco é `rocketlab.db`.

A estrutura do banco é controlada pelo Alembic. Sempre que houver uma alteração nos modelos, uma nova migration pode ser criada com:

```bash
alembic revision --autogenerate -m "descrição da alteração"
alembic upgrade head
```

## API

As principais rotas estão organizadas em:

```text
/api/v1/movies
/api/v1/auth
```

A API concentra as operações de catálogo, avaliações, filmes assistidos e filmes criados pelos usuários. As operações relacionadas à conta utilizam autenticação para identificar o usuário responsável.

---

Projeto desenvolvido para o **RocketLab 2026.2**.