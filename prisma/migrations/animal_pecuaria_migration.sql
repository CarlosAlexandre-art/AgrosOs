-- Migration: Tabelas de Pecuária Inteligente (Animal e relacionadas)
-- Executar no Supabase SQL Editor
-- Ordem: enums → Animal → tabelas dependentes

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE "AnimalSexo" AS ENUM ('MACHO','FEMEA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "TipoRegistroSaude" AS ENUM ('VACINA','MEDICACAO','EXAME','DIAGNOSTICO','OBSERVACAO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "TipoMovimento" AS ENUM ('ENTRADA','SAIDA','TRANSFERENCIA','ABATE','NASCIMENTO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "TipoEventoReprodutivo" AS ENUM (
  'CIO_DETECTADO','INSEMINACAO_ARTIFICIAL','MONTA_NATURAL','DIAGNOSTICO_PRENHEZ',
  'CONFIRMACAO_PRENHEZ','PARTO','ABORTO','DESMAME','DESCARTE_REPRODUTIVO'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "StatusPrenhez" AS ENUM ('VAZIA','PRENHA','INCERTA','PARIDA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "TipoTransacaoGado" AS ENUM ('COMPRA','VENDA','LEILAO_COMPRA','LEILAO_VENDA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Animal (depende de Property e Lote — Lote já existe) ──────────────────────

CREATE TABLE IF NOT EXISTS "Animal" (
  "id"               TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "propertyId"       TEXT          NOT NULL,
  "loteId"           TEXT,
  "identificacao"    TEXT          NOT NULL,
  "brincoEletronico" TEXT,
  "sisbovId"         TEXT,
  "rfid"             TEXT,
  "especie"          TEXT          NOT NULL DEFAULT 'BOVINO',
  "raca"             TEXT,
  "sexo"             "AnimalSexo"  NOT NULL,
  "dataNascimento"   TIMESTAMP(3),
  "pesoNascimento"   DOUBLE PRECISION,
  "pesoAtual"        DOUBLE PRECISION,
  "origemFazenda"    TEXT,
  "gtaOrigem"        TEXT,
  "ativo"            BOOLEAN       NOT NULL DEFAULT true,
  "createdAt"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Animal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Animal_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE,
  CONSTRAINT "Animal_loteId_fkey"     FOREIGN KEY ("loteId")     REFERENCES "Lote"("id")     ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "Animal_propertyId_idx"    ON "Animal"("propertyId");
CREATE INDEX IF NOT EXISTS "Animal_identificacao_idx" ON "Animal"("identificacao");
CREATE INDEX IF NOT EXISTS "Animal_sisbovId_idx"      ON "Animal"("sisbovId");

-- ── AnimalSaude ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "AnimalSaude" (
  "id"           TEXT                  NOT NULL DEFAULT gen_random_uuid()::text,
  "animalId"     TEXT                  NOT NULL,
  "tipo"         "TipoRegistroSaude"   NOT NULL DEFAULT 'OBSERVACAO',
  "descricao"    TEXT                  NOT NULL,
  "produto"      TEXT,
  "dose"         TEXT,
  "veterinario"  TEXT,
  "dataRegistro" TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "proximaDose"  TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnimalSaude_pkey"     PRIMARY KEY ("id"),
  CONSTRAINT "AnimalSaude_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AnimalSaude_animalId_idx" ON "AnimalSaude"("animalId");

-- ── AnimalMovimento ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "AnimalMovimento" (
  "id"         TEXT              NOT NULL DEFAULT gen_random_uuid()::text,
  "animalId"   TEXT              NOT NULL,
  "tipo"       "TipoMovimento"   NOT NULL,
  "origem"     TEXT,
  "destino"    TEXT,
  "peso"       DOUBLE PRECISION,
  "data"       TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "gta"        TEXT,
  "observacao" TEXT,
  "createdAt"  TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnimalMovimento_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "AnimalMovimento_animalId_fkey"  FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AnimalMovimento_animalId_idx" ON "AnimalMovimento"("animalId");

-- ── ProtocoloVacinal (depende apenas de Property) ─────────────────────────────

CREATE TABLE IF NOT EXISTS "ProtocoloVacinal" (
  "id"          TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "propertyId"  TEXT          NOT NULL,
  "nome"        TEXT          NOT NULL,
  "doenca"      TEXT          NOT NULL,
  "frequencia"  TEXT          NOT NULL DEFAULT 'ANUAL',
  "produto"     TEXT,
  "dose"        TEXT,
  "mesesAplicar" JSONB        NOT NULL DEFAULT '[3,9]',
  "ativo"       BOOLEAN       NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProtocoloVacinal_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "ProtocoloVacinal_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProtocoloVacinal_propertyId_idx" ON "ProtocoloVacinal"("propertyId");

-- ── EventoReprodutivo ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "EventoReprodutivo" (
  "id"          TEXT                      NOT NULL DEFAULT gen_random_uuid()::text,
  "animalId"    TEXT                      NOT NULL,
  "tipo"        "TipoEventoReprodutivo"   NOT NULL,
  "data"        TIMESTAMP(3)              NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "touruId"     TEXT,
  "veterinario" TEXT,
  "resultado"   TEXT,
  "pesoBezerro" DOUBLE PRECISION,
  "observacao"  TEXT,
  "createdAt"   TIMESTAMP(3)              NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventoReprodutivo_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "EventoReprodutivo_animalId_fkey"  FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "EventoReprodutivo_animalId_idx" ON "EventoReprodutivo"("animalId");

-- ── StatusReprodutivo ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "StatusReprodutivo" (
  "id"                TEXT            NOT NULL DEFAULT gen_random_uuid()::text,
  "animalId"          TEXT            NOT NULL UNIQUE,
  "status"            "StatusPrenhez" NOT NULL DEFAULT 'VAZIA',
  "dataUltimoCio"     TIMESTAMP(3),
  "dataInseminacao"   TIMESTAMP(3),
  "dataPrevistoParto" TIMESTAMP(3),
  "paricoes"          INTEGER         NOT NULL DEFAULT 0,
  "updatedAt"         TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StatusReprodutivo_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "StatusReprodutivo_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE
);

-- ── PlanoNutricional (depende de Property e Lote) ─────────────────────────────

CREATE TABLE IF NOT EXISTS "PlanoNutricional" (
  "id"             TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "propertyId"     TEXT          NOT NULL,
  "loteId"         TEXT,
  "nome"           TEXT          NOT NULL,
  "objetivo"       TEXT          NOT NULL DEFAULT 'GANHO_PESO',
  "racaoKgDia"     DOUBLE PRECISION,
  "proteinaBruta"  DOUBLE PRECISION,
  "mineralKgDia"   DOUBLE PRECISION,
  "custoKgRacao"   DOUBLE PRECISION,
  "custoKgMineral" DOUBLE PRECISION,
  "ativo"          BOOLEAN       NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlanoNutricional_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "PlanoNutricional_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE,
  CONSTRAINT "PlanoNutricional_loteId_fkey"     FOREIGN KEY ("loteId")     REFERENCES "Lote"("id")     ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "PlanoNutricional_propertyId_idx" ON "PlanoNutricional"("propertyId");

-- ── Pastagem ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Pastagem" (
  "id"            TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "propertyId"    TEXT          NOT NULL,
  "nome"          TEXT          NOT NULL,
  "areaHectares"  DOUBLE PRECISION NOT NULL,
  "forrageira"    TEXT,
  "capacidadeUA"  DOUBLE PRECISION,
  "cicloDescanso" INTEGER,
  "status"        TEXT          NOT NULL DEFAULT 'DISPONIVEL',
  "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Pastagem_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "Pastagem_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Pastagem_propertyId_idx" ON "Pastagem"("propertyId");

-- ── RotacaoPastagem (depende de Pastagem e Lote) ──────────────────────────────

CREATE TABLE IF NOT EXISTS "RotacaoPastagem" (
  "id"         TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "pastagemId" TEXT          NOT NULL,
  "loteId"     TEXT,
  "entrada"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "saida"      TIMESTAMP(3),
  "cabecas"    INTEGER,
  "observacao" TEXT,
  "createdAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RotacaoPastagem_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "RotacaoPastagem_pastagemId_fkey" FOREIGN KEY ("pastagemId") REFERENCES "Pastagem"("id") ON DELETE CASCADE,
  CONSTRAINT "RotacaoPastagem_loteId_fkey"     FOREIGN KEY ("loteId")     REFERENCES "Lote"("id")     ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "RotacaoPastagem_pastagemId_idx" ON "RotacaoPastagem"("pastagemId");

-- ── ProducaoLeite ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ProducaoLeite" (
  "id"          TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "animalId"    TEXT          NOT NULL,
  "data"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "litrosManha" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "litrosTarde" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalLitros" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ccs"         INTEGER,
  "gordura"     DOUBLE PRECISION,
  "proteina"    DOUBLE PRECISION,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProducaoLeite_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "ProducaoLeite_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProducaoLeite_animalId_idx" ON "ProducaoLeite"("animalId");
CREATE INDEX IF NOT EXISTS "ProducaoLeite_data_idx"     ON "ProducaoLeite"("data");

-- ── ControleCarcaca ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ControleCarcaca" (
  "id"                TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "animalId"          TEXT          NOT NULL UNIQUE,
  "dataAbate"         TIMESTAMP(3)  NOT NULL,
  "pesoVivo"          DOUBLE PRECISION NOT NULL,
  "pesoCarcaca"       DOUBLE PRECISION,
  "rendimentoCarcaca" DOUBLE PRECISION,
  "classificacao"     TEXT,
  "tipificacao"       TEXT,
  "frigorificoNome"   TEXT,
  "valorArroba"       DOUBLE PRECISION,
  "receitaTotal"      DOUBLE PRECISION,
  "observacao"        TEXT,
  "createdAt"         TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ControleCarcaca_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "ControleCarcaca_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ControleCarcaca_dataAbate_idx" ON "ControleCarcaca"("dataAbate");

-- ── TransacaoGado ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "TransacaoGado" (
  "id"          TEXT                  NOT NULL DEFAULT gen_random_uuid()::text,
  "propertyId"  TEXT                  NOT NULL,
  "tipo"        "TipoTransacaoGado"   NOT NULL,
  "data"        TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cabecas"     INTEGER               NOT NULL,
  "pesoTotal"   DOUBLE PRECISION,
  "valorArroba" DOUBLE PRECISION,
  "valorTotal"  DOUBLE PRECISION      NOT NULL,
  "contraparte" TEXT,
  "gta"         TEXT,
  "comissao"    DOUBLE PRECISION      NOT NULL DEFAULT 0,
  "observacao"  TEXT,
  "createdAt"   TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TransacaoGado_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "TransacaoGado_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "TransacaoGado_propertyId_idx" ON "TransacaoGado"("propertyId");
CREATE INDEX IF NOT EXISTS "TransacaoGado_data_idx"       ON "TransacaoGado"("data");

-- ── ValuationRebanho ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ValuationRebanho" (
  "id"                 TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "propertyId"         TEXT          NOT NULL,
  "data"               TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "totalAnimais"       INTEGER       NOT NULL,
  "pesoTotalKg"        DOUBLE PRECISION NOT NULL,
  "valorArrobaRef"     DOUBLE PRECISION NOT NULL DEFAULT 320,
  "totalArrobas"       DOUBLE PRECISION NOT NULL,
  "valorTotalEstimado" DOUBLE PRECISION NOT NULL,
  "custoTotalRebanho"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "margemBruta"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"          TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ValuationRebanho_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "ValuationRebanho_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ValuationRebanho_propertyId_idx" ON "ValuationRebanho"("propertyId");
