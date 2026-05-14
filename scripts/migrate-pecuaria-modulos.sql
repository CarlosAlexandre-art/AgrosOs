-- ============================================================
-- Migração: 4 Novos Módulos Pecuários
-- Execute no Supabase SQL Editor
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE "TipoEventoReprodutivo" AS ENUM (
    'CIO_DETECTADO','INSEMINACAO_ARTIFICIAL','MONTA_NATURAL',
    'DIAGNOSTICO_PRENHEZ','CONFIRMACAO_PRENHEZ','PARTO',
    'ABORTO','DESMAME','DESCARTE_REPRODUTIVO'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StatusPrenhez" AS ENUM ('VAZIA','PRENHA','INCERTA','PARIDA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TipoTransacaoGado" AS ENUM (
    'COMPRA','VENDA','LEILAO_COMPRA','LEILAO_VENDA'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Saúde & Reprodução ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ProtocoloVacinal" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "propertyId"   TEXT NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "nome"         TEXT NOT NULL,
  "doenca"       TEXT NOT NULL,
  "frequencia"   TEXT NOT NULL DEFAULT 'ANUAL',
  "produto"      TEXT,
  "dose"         TEXT,
  "mesesAplicar" JSONB NOT NULL DEFAULT '[3,9]',
  "ativo"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ProtocoloVacinal_propertyId_idx" ON "ProtocoloVacinal"("propertyId");

CREATE TABLE IF NOT EXISTS "EventoReprodutivo" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "animalId"    TEXT NOT NULL REFERENCES "Animal"("id") ON DELETE CASCADE,
  "tipo"        "TipoEventoReprodutivo" NOT NULL,
  "data"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "touruId"     TEXT,
  "veterinario" TEXT,
  "resultado"   TEXT,
  "pesoBezerro" DOUBLE PRECISION,
  "observacao"  TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "EventoReprodutivo_animalId_idx" ON "EventoReprodutivo"("animalId");

CREATE TABLE IF NOT EXISTS "StatusReprodutivo" (
  "id"                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "animalId"          TEXT NOT NULL UNIQUE REFERENCES "Animal"("id") ON DELETE CASCADE,
  "status"            "StatusPrenhez" NOT NULL DEFAULT 'VAZIA',
  "dataUltimoCio"     TIMESTAMP(3),
  "dataInseminacao"   TIMESTAMP(3),
  "dataPrevistoParto" TIMESTAMP(3),
  "paricoes"          INTEGER NOT NULL DEFAULT 0,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Nutrição & Pastagem ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PlanoNutricional" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "propertyId"     TEXT NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "loteId"         TEXT REFERENCES "Lote"("id"),
  "nome"           TEXT NOT NULL,
  "objetivo"       TEXT NOT NULL DEFAULT 'GANHO_PESO',
  "racaoKgDia"     DOUBLE PRECISION,
  "proteinaBruta"  DOUBLE PRECISION,
  "mineralKgDia"   DOUBLE PRECISION,
  "custoKgRacao"   DOUBLE PRECISION,
  "custoKgMineral" DOUBLE PRECISION,
  "ativo"          BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PlanoNutricional_propertyId_idx" ON "PlanoNutricional"("propertyId");

CREATE TABLE IF NOT EXISTS "Pastagem" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "propertyId"    TEXT NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "nome"          TEXT NOT NULL,
  "areaHectares"  DOUBLE PRECISION NOT NULL,
  "forrageira"    TEXT,
  "capacidadeUA"  DOUBLE PRECISION,
  "cicloDescanso" INTEGER,
  "status"        TEXT NOT NULL DEFAULT 'DISPONIVEL',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Pastagem_propertyId_idx" ON "Pastagem"("propertyId");

CREATE TABLE IF NOT EXISTS "RotacaoPastagem" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "pastagemId" TEXT NOT NULL REFERENCES "Pastagem"("id") ON DELETE CASCADE,
  "loteId"     TEXT REFERENCES "Lote"("id"),
  "entrada"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "saida"      TIMESTAMP(3),
  "cabecas"    INTEGER,
  "observacao" TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "RotacaoPastagem_pastagemId_idx" ON "RotacaoPastagem"("pastagemId");

-- ── Produção & Qualidade ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ProducaoLeite" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "animalId"    TEXT NOT NULL REFERENCES "Animal"("id") ON DELETE CASCADE,
  "data"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "litrosManha" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "litrosTarde" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalLitros" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ccs"         INTEGER,
  "gordura"     DOUBLE PRECISION,
  "proteina"    DOUBLE PRECISION,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ProducaoLeite_animalId_idx" ON "ProducaoLeite"("animalId");
CREATE INDEX IF NOT EXISTS "ProducaoLeite_data_idx" ON "ProducaoLeite"("data");

CREATE TABLE IF NOT EXISTS "ControleCarcaca" (
  "id"                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "animalId"          TEXT NOT NULL UNIQUE REFERENCES "Animal"("id") ON DELETE CASCADE,
  "dataAbate"         TIMESTAMP(3) NOT NULL,
  "pesoVivo"          DOUBLE PRECISION NOT NULL,
  "pesoCarcaca"       DOUBLE PRECISION,
  "rendimentoCarcaca" DOUBLE PRECISION,
  "classificacao"     TEXT,
  "tipificacao"       TEXT,
  "frigorificoNome"   TEXT,
  "valorArroba"       DOUBLE PRECISION,
  "receitaTotal"      DOUBLE PRECISION,
  "observacao"        TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ControleCarcaca_dataAbate_idx" ON "ControleCarcaca"("dataAbate");

-- ── Financeiro Pecuário ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS "TransacaoGado" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "propertyId"  TEXT NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "tipo"        "TipoTransacaoGado" NOT NULL,
  "data"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cabecas"     INTEGER NOT NULL,
  "pesoTotal"   DOUBLE PRECISION,
  "valorArroba" DOUBLE PRECISION,
  "valorTotal"  DOUBLE PRECISION NOT NULL,
  "contraparte" TEXT,
  "gta"         TEXT,
  "comissao"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "observacao"  TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "TransacaoGado_propertyId_idx" ON "TransacaoGado"("propertyId");
CREATE INDEX IF NOT EXISTS "TransacaoGado_data_idx" ON "TransacaoGado"("data");

CREATE TABLE IF NOT EXISTS "ValuationRebanho" (
  "id"                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "propertyId"         TEXT NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "data"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "totalAnimais"       INTEGER NOT NULL,
  "pesoTotalKg"        DOUBLE PRECISION NOT NULL,
  "valorArrobaRef"     DOUBLE PRECISION NOT NULL DEFAULT 320,
  "totalArrobas"       DOUBLE PRECISION NOT NULL,
  "valorTotalEstimado" DOUBLE PRECISION NOT NULL,
  "custoTotalRebanho"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "margemBruta"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ValuationRebanho_propertyId_idx" ON "ValuationRebanho"("propertyId");
