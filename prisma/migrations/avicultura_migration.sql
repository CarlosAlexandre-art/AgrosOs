-- =====================================================
-- AVICULTURA — Migration completa
-- Rodar no Supabase SQL Editor do SmartAgroOS
-- Foco: galinhas poedeiras e codornas de postura
-- =====================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE "FaseProducaoAve" AS ENUM ('CRIA', 'RECRIA', 'POSTURA', 'DESCARTE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StatusLoteAve" AS ENUM ('ATIVO', 'ENCERRADO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TipoSanidadeAve" AS ENUM ('VACINA', 'MEDICAMENTO', 'VERMIFUGO', 'BIOSSEGURANCA', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TipoVendaAve" AS ENUM ('OVOS', 'AVES');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AveLote
CREATE TABLE IF NOT EXISTS "AveLote" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "propertyId"        TEXT NOT NULL,
  "nome"              TEXT NOT NULL,
  "especie"           TEXT NOT NULL,
  "linhagem"          TEXT,
  "instalacao"        TEXT,
  "quantidadeInicial" INTEGER NOT NULL,
  "quantidadeAtual"   INTEGER NOT NULL,
  "idadeInicialDias"  INTEGER,
  "dataAlojamento"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "faseProducao"      "FaseProducaoAve" NOT NULL DEFAULT 'CRIA',
  "dataInicioPostura" TIMESTAMP(3),
  "dataEncerramento"  TIMESTAMP(3),
  "status"            "StatusLoteAve" NOT NULL DEFAULT 'ATIVO',
  "observacao"        TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AveLote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AveLote_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AveLote_propertyId_idx" ON "AveLote"("propertyId");

-- AveProducaoOvos (postura diária)
CREATE TABLE IF NOT EXISTS "AveProducaoOvos" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "loteId"          TEXT NOT NULL,
  "data"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ovosColetados"   INTEGER NOT NULL,
  "ovosQuebrados"   INTEGER,
  "ovosSujos"       INTEGER,
  "ovosDescartados" INTEGER,
  "pesoMedioG"      DOUBLE PRECISION,
  "horasLuz"        DOUBLE PRECISION,
  "observacao"      TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AveProducaoOvos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AveProducaoOvos_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "AveLote"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AveProducaoOvos_loteId_idx" ON "AveProducaoOvos"("loteId");

-- AveArracoamento
CREATE TABLE IF NOT EXISTS "AveArracoamento" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "loteId"         TEXT NOT NULL,
  "data"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tipoRacao"      TEXT,
  "faseAlimentar"  TEXT,
  "quantidadeKg"   DOUBLE PRECISION NOT NULL,
  "custoKg"        DOUBLE PRECISION,
  "aguaConsumidaL" DOUBLE PRECISION,
  "observacao"     TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AveArracoamento_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AveArracoamento_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "AveLote"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AveArracoamento_loteId_idx" ON "AveArracoamento"("loteId");

-- AveMortalidade
CREATE TABLE IF NOT EXISTS "AveMortalidade" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "loteId"        TEXT NOT NULL,
  "data"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "quantidade"    INTEGER NOT NULL,
  "causaSuspeita" TEXT,
  "observacao"    TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AveMortalidade_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AveMortalidade_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "AveLote"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AveMortalidade_loteId_idx" ON "AveMortalidade"("loteId");

-- AveSanidade
CREATE TABLE IF NOT EXISTS "AveSanidade" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "loteId"           TEXT NOT NULL,
  "data"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tipo"             "TipoSanidadeAve" NOT NULL DEFAULT 'VACINA',
  "produto"          TEXT NOT NULL,
  "dosagem"          TEXT,
  "viaAplicacao"     TEXT,
  "carenciaDias"     INTEGER,
  "proximaAplicacao" TIMESTAMP(3),
  "observacao"       TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AveSanidade_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AveSanidade_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "AveLote"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AveSanidade_loteId_idx" ON "AveSanidade"("loteId");

-- AveVenda
CREATE TABLE IF NOT EXISTS "AveVenda" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "loteId"        TEXT NOT NULL,
  "data"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tipo"          "TipoVendaAve" NOT NULL DEFAULT 'OVOS',
  "quantidade"    DOUBLE PRECISION NOT NULL,
  "unidade"       TEXT,
  "precoUnitario" DOUBLE PRECISION NOT NULL,
  "total"         DOUBLE PRECISION NOT NULL,
  "comprador"     TEXT,
  "canal"         TEXT,
  "observacao"    TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AveVenda_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AveVenda_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "AveLote"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AveVenda_loteId_idx" ON "AveVenda"("loteId");
