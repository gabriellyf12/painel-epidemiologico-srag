-- Modelo fisico do banco influ_db (MySQL).
-- Crie o banco e selecione-o antes de executar este script.

CREATE TABLE Regional_de_Saude (
    id INTEGER PRIMARY KEY,
    nome VARCHAR(50) NOT NULL
);

CREATE TABLE Municipio (
    codigo_ibge CHAR(6) PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    uf CHAR(2),
    codigo_regional INTEGER,
    CONSTRAINT fk_Regional_de_Saude_Id FOREIGN KEY (codigo_regional)
        REFERENCES Regional_de_Saude (id) ON DELETE SET NULL
);

CREATE TABLE Sintoma (
    sigla VARCHAR(10) PRIMARY KEY,
    descricao VARCHAR(100) NOT NULL
);

CREATE TABLE Comorbidade (
    sigla VARCHAR(10) PRIMARY KEY,
    descricao VARCHAR(100) NOT NULL
);

CREATE TABLE Agente (
    sigla VARCHAR(10) PRIMARY KEY,
    descricao VARCHAR(100) NOT NULL
);

CREATE TABLE Notificacao (
    numero_notificacao BIGINT PRIMARY KEY,
    data_notificacao DATE,
    sexo CHAR,
    data_nascimento DATE,
    raca_cor INTEGER,
    uti INTEGER,
    evolucao INTEGER,
    classificacao_final INTEGER,
    data_primeiros_sintomas DATE,
    suporte_ventilatorio INTEGER,
    usou_antiviral INTEGER,
    data_internacao DATE,
    vacinada_gripe INTEGER,
    municipio_notificacao CHAR(6),
    municipio_residencia CHAR(6),
    CONSTRAINT fk_Municipio_notificacao FOREIGN KEY (municipio_notificacao)
        REFERENCES municipio (codigo_ibge) ON DELETE SET NULL,
    CONSTRAINT fk_Municipio_residencia FOREIGN KEY (municipio_residencia)
        REFERENCES municipio (codigo_ibge) ON DELETE SET NULL
);

CREATE TABLE Detecta (
    numero_notificacao BIGINT NOT NULL,
    sigla_agente VARCHAR(10),
    metodo VARCHAR(10) NOT NULL CHECK (metodo IN ('RT-PCR', 'ANTIGENO')),
    subtipo INTEGER,
    PRIMARY KEY (numero_notificacao, sigla_agente, metodo),
    CONSTRAINT fk_detecta_numero_notificacao FOREIGN KEY (numero_notificacao)
        REFERENCES notificacao (numero_notificacao) ON DELETE CASCADE,
    CONSTRAINT fk_detecta_sigla_agente FOREIGN KEY (sigla_agente)
        REFERENCES Agente (sigla) ON DELETE CASCADE
);

CREATE TABLE Possui (
    numero_notificacao BIGINT NOT NULL,
    sigla_comorbidade VARCHAR(10),
    resposta INTEGER NOT NULL,
    PRIMARY KEY (numero_notificacao, sigla_comorbidade),
    CONSTRAINT fk_possui_numero_notificacao FOREIGN KEY (numero_notificacao)
        REFERENCES notificacao (numero_notificacao) ON DELETE CASCADE,
    CONSTRAINT fk_comorbidade_sigla FOREIGN KEY (sigla_comorbidade)
        REFERENCES comorbidade (sigla) ON DELETE CASCADE
);

CREATE TABLE Apresenta (
    numero_notificacao BIGINT NOT NULL,
    sigla_sintoma VARCHAR(10),
    resposta_sintoma INTEGER NOT NULL,
    PRIMARY KEY (numero_notificacao, sigla_sintoma),
    CONSTRAINT fk_apresenta_numero_notificacao FOREIGN KEY (numero_notificacao)
        REFERENCES notificacao (numero_notificacao) ON DELETE CASCADE,
    CONSTRAINT fk_apresenta_sigla_sintoma FOREIGN KEY (sigla_sintoma)
        REFERENCES sintoma (sigla) ON DELETE CASCADE
);
