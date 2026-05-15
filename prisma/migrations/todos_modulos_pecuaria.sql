-- Migration: Todos os módulos pecuários
-- NutriBov, AgroGrade, AgroTrade + tabelas auxiliares
-- Executar no Supabase SQL Editor

-- ─── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE "ObjetivoLote" AS ENUM ('ABATE','LEITE','REPRODUCAO','RECRIA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "StatusLote" AS ENUM ('ATIVO','ENCERRADO','CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "TipoTransacaoGado" AS ENUM ('COMPRA','VENDA','LEILAO_COMPRA','LEILAO_VENDA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Lote ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Lote" (
    "id"                TEXT            NOT NULL DEFAULT gen_random_uuid()::text,
    "propertyId"        TEXT            NOT NULL,
    "nome"              TEXT            NOT NULL,
    "cabecas"           INTEGER         NOT NULL,
    "racaPredominante"  TEXT,
    "idadeMediaMeses"   INTEGER,
    "pesoMedioEntrada"  DOUBLE PRECISION NOT NULL DEFAULT 0,
    "objetivo"          "ObjetivoLote"  NOT NULL DEFAULT 'ABATE',
    "pesoMetaAbate"     DOUBLE PRECISION,
    "dataEntrada"       TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSaidaPrevista" TIMESTAMP(3),
    "dataEncerramento"  TIMESTAMP(3),
    "custoTotal"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status"            "StatusLote"    NOT NULL DEFAULT 'ATIVO',
    "createdAt"         TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Lote_propertyId_fkey"
        FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Lote_propertyId_idx" ON "Lote"("propertyId");

-- ─── LoteDiario ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "LoteDiario" (
    "id"            TEXT            NOT NULL DEFAULT gen_random_uuid()::text,
    "loteId"        TEXT            NOT NULL,
    "data"          TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumoRacaoKg" DOUBLE PRECISION,
    "consumoAguaL"  DOUBLE PRECISION,
    "pesoMedio"     DOUBLE PRECISION,
    "mortalidade"   INTEGER         NOT NULL DEFAULT 0,
    "medicacao"     TEXT,
    "observacoes"   TEXT,
    "custoRacaoDia" DOUBLE PRECISION,
    "custoDia"      DOUBLE PRECISION,
    "createdAt"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoteDiario_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LoteDiario_loteId_fkey"
        FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "LoteDiario_loteId_idx" ON "LoteDiario"("loteId");
CREATE INDEX IF NOT EXISTS "LoteDiario_data_idx" ON "LoteDiario"("data");

-- ─── PlanoNutricional ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PlanoNutricional" (
    "id"             TEXT            NOT NULL DEFAULT gen_random_uuid()::text,
    "propertyId"     TEXT            NOT NULL,
    "loteId"         TEXT,
    "nome"           TEXT            NOT NULL,
    "objetivo"       TEXT            NOT NULL DEFAULT 'GANHO_PESO',
    "racaoKgDia"     DOUBLE PRECISION,
    "proteinaBruta"  DOUBLE PRECISION,
    "mineralKgDia"   DOUBLE PRECISION,
    "custoKgRacao"   DOUBLE PRECISION,
    "custoKgMineral" DOUBLE PRECISION,
    "ativo"          BOOLEAN         NOT NULL DEFAULT true,
    "createdAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanoNutricional_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PlanoNutricional_propertyId_fkey"
        FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE,
    CONSTRAINT "PlanoNutricional_loteId_fkey"
        FOREIGN KEY ("loteId") REFERENCES "Lote"("id")
);

CREATE INDEX IF NOT EXISTS "PlanoNutricional_propertyId_idx" ON "PlanoNutricional"("propertyId");

-- ─── Pastagem ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Pastagem" (
    "id"            TEXT            NOT NULL DEFAULT gen_random_uuid()::text,
    "propertyId"    TEXT            NOT NULL,
    "nome"          TEXT            NOT NULL,
    "areaHectares"  DOUBLE PRECISION NOT NULL,
    "forrageira"    TEXT,
    "capacidadeUA"  DOUBLE PRECISION,
    "cicloDescanso" INTEGER,
    "status"        TEXT            NOT NULL DEFAULT 'DISPONIVEL',
    "createdAt"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pastagem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Pastagem_propertyId_fkey"
        FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Pastagem_propertyId_idx" ON "Pastagem"("propertyId");

-- ─── RotacaoPastagem ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "RotacaoPastagem" (
    "id"         TEXT            NOT NULL DEFAULT gen_random_uuid()::text,
    "pastagemId" TEXT            NOT NULL,
    "loteId"     TEXT,
    "entrada"    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saida"      TIMESTAMP(3),
    "cabecas"    INTEGER,
    "observacao" TEXT,
    "createdAt"  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RotacaoPastagem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RotacaoPastagem_pastagemId_fkey"
        FOREIGN KEY ("pastagemId") REFERENCES "Pastagem"("id") ON DELETE CASCADE,
    CONSTRAINT "RotacaoPastagem_loteId_fkey"
        FOREIGN KEY ("loteId") REFERENCES "Lote"("id")
);

CREATE INDEX IF NOT EXISTS "RotacaoPastagem_pastagemId_idx" ON "RotacaoPastagem"("pastagemId");

-- ─── ProducaoLeite ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ProducaoLeite" (
    "id"          TEXT            NOT NULL DEFAULT gen_random_uuid()::text,
    "animalId"    TEXT            NOT NULL,
    "data"        TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "litrosManha" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "litrosTarde" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLitros" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ccs"         INTEGER,
    "gordura"     DOUBLE PRECISION,
    "proteina"    DOUBLE PRECISION,
    "createdAt"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProducaoLeite_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProducaoLeite_animalId_fkey"
        FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProducaoLeite_animalId_idx" ON "ProducaoLeite"("animalId");
CREATE INDEX IF NOT EXISTS "ProducaoLeite_data_idx" ON "ProducaoLeite"("data");

-- ─── ControleCarcaca ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ControleCarcaca" (
    "id"                TEXT            NOT NULL DEFAULT gen_random_uuid()::text,
    "animalId"          TEXT            NOT NULL,
    "dataAbate"         TIMESTAMP(3)    NOT NULL,
    "pesoVivo"          DOUBLE PRECISION NOT NULL,
    "pesoCarcaca"       DOUBLE PRECISION,
    "rendimentoCarcaca" DOUBLE PRECISION,
    "classificacao"     TEXT,
    "tipificacao"       TEXT,
    "frigorificoNome"   TEXT,
    "valorArroba"       DOUBLE PRECISION,
    "receitaTotal"      DOUBLE PRECISION,
    "observacao"        TEXT,
    "createdAt"         TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ControleCarcaca_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ControleCarcaca_animalId_key" UNIQUE ("animalId"),
    CONSTRAINT "ControleCarcaca_animalId_fkey"
        FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ControleCarcaca_dataAbate_idx" ON "ControleCarcaca"("dataAbate");

-- ─── TransacaoGado ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "TransacaoGado" (
    "id"          TEXT                    NOT NULL DEFAULT gen_random_uuid()::text,
    "propertyId"  TEXT                    NOT NULL,
    "tipo"        "TipoTransacaoGado"     NOT NULL,
    "data"        TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cabecas"     INTEGER                 NOT NULL,
    "pesoTotal"   DOUBLE PRECISION,
    "valorArroba" DOUBLE PRECISION,
    "valorTotal"  DOUBLE PRECISION        NOT NULL,
    "contraparte" TEXT,
    "gta"         TEXT,
    "comissao"    DOUBLE PRECISION        NOT NULL DEFAULT 0,
    "observacao"  TEXT,
    "createdAt"   TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransacaoGado_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TransacaoGado_propertyId_fkey"
        FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "TransacaoGado_propertyId_idx" ON "TransacaoGado"("propertyId");
CREATE INDEX IF NOT EXISTS "TransacaoGado_data_idx" ON "TransacaoGado"("data");

-- ─── ValuationRebanho ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ValuationRebanho" (
    "id"                 TEXT            NOT NULL DEFAULT gen_random_uuid()::text,
    "propertyId"         TEXT            NOT NULL,
    "data"               TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAnimais"       INTEGER         NOT NULL,
    "pesoTotalKg"        DOUBLE PRECISION NOT NULL,
    "valorArrobaRef"     DOUBLE PRECISION NOT NULL DEFAULT 320,
    "totalArrobas"       DOUBLE PRECISION NOT NULL,
    "valorTotalEstimado" DOUBLE PRECISION NOT NULL,
    "custoTotalRebanho"  DOUBLE PRECISION NOT NULL DEFAULT 0,
    "margemBruta"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt"          TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValuationRebanho_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ValuationRebanho_propertyId_fkey"
        FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ValuationRebanho_propertyId_idx" ON "ValuationRebanho"("propertyId");
