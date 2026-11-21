# Painel Epidemiológico de SRAG (SIVEP-Gripe 2019)

Aplicação Web interativa desenvolvida como projeto prático da disciplina de **Banco de Dados I**, voltada à exploração de indicadores clínicos, demográficos e geográficos dos casos hospitalizados de Síndrome Respiratória Aguda Grave (SRAG) no Brasil em 2019.

Os dados são provenientes do Portal de Dados Abertos do SUS (SIVEP-Gripe 2019), modelados e armazenados no banco relacional **`influ_db`** (MySQL 8.0) e consultados diretamente via SQL puro, sem o uso de ORM.

---

## Tecnologias Utilizadas

- **Banco de Dados:** MySQL 8.0 (`influ_db`)
- **Backend:** Python 3.11+, FastAPI, Uvicorn, `mysql-connector-python`, `python-dotenv`
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, React Simple Maps

---

## Estrutura do Repositório

```text
painel-epidemiologico-srag/
├── database/
│   ├── ddl_influ_db.sql          # Criação das 9 tabelas e índices
│   ├── carga_influ_db.sql        # Script de carga do dataset INFLUD19
│   └── consultas_parte3.sql      # Consultas SQL analíticas (Q1 a Q6)
├── backend/
│   ├── .env.example              # Modelo de variáveis de ambiente do MySQL
│   ├── requirements.txt          # Dependências Python
│   ├── database.py               # Pool de conexões MySQL e executor de queries
│   ├── queries.py                # Consultas parametrizadas
│   └── main.py                   # Endpoints REST da API e configuração de CORS
└── frontend/
    ├── package.json
    └── src/
        ├── assets/               # Malha geográfica (GeoJSON/TopoJSON) das UFs
        ├── services/             # Cliente HTTP e tipagens TypeScript
        ├── components/           # Barra de filtros, KPIs, mapa, gráficos e tabela
        └── App.tsx               # Componente principal e controle de estado
```

---

## Funcionalidades

- **Filtros Globais Dinâmicos:** Filtragem simultânea por UF de notificação, sexo, faixa etária, agente etiológico e evolução clínica.
- **Indicadores Gerais (KPIs):** Total de notificações, internações em UTI, taxa de letalidade (%) e média de idade dos pacientes.
- **Panorama Geográfico e Temporal:** Mapa coroplético por UF, ranking de municípios com óbitos acima da média nacional e evolução semanal de casos em 2019.
- **Perfil Clínico e Sintomas:** Frequência de sintomas registrados, preservando sintomas sem ocorrência no recorte filtrado (`LEFT JOIN`).
- **Agentes Etiológicos e Desfechos:** Distribuição dos desfechos clínicos (cura, óbito por SRAG, internação em UTI) por vírus identificado.
- **Explorador de Casos Críticos:** Listagem paginada de casos graves em UTI com comorbidades e sem agente identificado, com opção de exportação em CSV.

---

## Como Executar Localmente

### 1. Banco de Dados (MySQL 8.0)

1. Crie o banco de dados `influ_db` e execute o script de criação das tabelas e índices em `database/ddl_influ_db.sql`.
2. Baixe o arquivo CSV do SIVEP-Gripe 2019 (`INFLUD19`), coloque-o na pasta configurada na variável `secure_file_priv` do seu MySQL e execute `database/carga_influ_db.sql`.

### 2. Backend (FastAPI)

```bash
cd backend
python -m venv venv
```

Ative o ambiente virtual:

- **Windows (PowerShell):**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **Linux / macOS:**
  ```bash
  source venv/bin/activate
  ```

Instale as dependências, configure o `.env` e inicie o servidor:

```bash
pip install -r requirements.txt
cp .env.example .env
# Edite o arquivo .env com o usuário e senha do seu MySQL local
uvicorn main:app --reload
```

A API estará disponível em `http://localhost:8000` (documentação interativa em `http://localhost:8000/docs`).

### 3. Frontend (React)

Em um novo terminal:

```bash
cd frontend
npm install
npm run dev
```

A interface Web estará disponível em `http://localhost:5173`.

---

## Integrantes do Grupo

- Bruno Bortolatto Carvalho
- Gabrielly de Freitas Ferreira
- Juliana Salarini
- Pedro Coelho Cavalcanti
- Vítor Fernandes de Carvalho Ambrizzi
