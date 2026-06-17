-- =====================================================
-- AQUICULTURA — Migration completa
-- Rodar no Supabase SQL Editor do SmartAgroOS
-- Projeto: waaxigfbbohajavhkgsb
-- =====================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE "TipoTanque" AS ENUM ('ESCAVADO', 'TANQUE_REDE', 'RACEWAY', 'ACUDE', 'VIVEIRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StatusLoteAqua" AS ENUM ('ATIVO', 'ENCERRADO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TanqueAqua
CREATE TABLE IF NOT EXISTS "TanqueAqua" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "propertyId"    TEXT NOT NULL,
  "nome"          TEXT NOT NULL,
  "tipo"          "TipoTanque" NOT NULL DEFAULT 'ESCAVADO',
  "areaM2"        DOUBLE PRECISION,
  "volumeM3"      DOUBLE PRECISION,
  "profundidadeM" DOUBLE PRECISION,
  "localizacao"   TEXT,
  "ativo"         BOOLEAN NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TanqueAqua_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TanqueAqua_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "TanqueAqua_propertyId_idx" ON "TanqueAqua"("propertyId");

-- LoteAqua
CREATE TABLE IF NOT EXISTS "LoteAqua" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "propertyId"        TEXT NOT NULL,
  "tanqueId"          TEXT NOT NULL,
  "nome"              TEXT NOT NULL,
  "especie"           TEXT NOT NULL,
  "quantidadeInicial" INTEGER NOT NULL,
  "quantidadeAtual"   INTEGER NOT NULL,
  "pesoMedioEntradaG" DOUBLE PRECISION,
  "dataPovamento"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dataDespescaPrev"  TIMESTAMP(3),
  "dataEncerramento"  TIMESTAMP(3),
  "status"            "StatusLoteAqua" NOT NULL DEFAULT 'ATIVO',
  "observacao"        TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoteAqua_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LoteAqua_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LoteAqua_tanqueId_fkey" FOREIGN KEY ("tanqueId") REFERENCES "TanqueAqua"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "LoteAqua_propertyId_idx" ON "LoteAqua"("propertyId");
CREATE INDEX IF NOT EXISTS "LoteAqua_tanqueId_idx" ON "LoteAqua"("tanqueId");

-- BiometriaAqua
CREATE TABLE IF NOT EXISTS "BiometriaAqua" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "loteId"        TEXT NOT NULL,
  "data"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "amostragem"    INTEGER NOT NULL,
  "pesoMedioG"    DOUBLE PRECISION NOT NULL,
  "comprimentoCm" DOUBLE PRECISION,
  "biomasseKg"    DOUBLE PRECISION,
  "observacao"    TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BiometriaAqua_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BiometriaAqua_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "LoteAqua"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BiometriaAqua_loteId_idx" ON "BiometriaAqua"("loteId");

-- ArracoamentoDiario
CREATE TABLE IF NOT EXISTS "ArracoamentoDiario" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "loteId"       TEXT NOT NULL,
  "data"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tipoRacao"    TEXT,
  "quantidadeKg" DOUBLE PRECISION NOT NULL,
  "custoKg"      DOUBLE PRECISION,
  "observacao"   TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArracoamentoDiario_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ArracoamentoDiario_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "LoteAqua"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ArracoamentoDiario_loteId_idx" ON "ArracoamentoDiario"("loteId");

-- QualidadeAguaReg
CREATE TABLE IF NOT EXISTS "QualidadeAguaReg" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tanqueId"        TEXT NOT NULL,
  "data"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ph"              DOUBLE PRECISION,
  "oxigenioMgL"     DOUBLE PRECISION,
  "temperaturaC"    DOUBLE PRECISION,
  "amoniaMgL"       DOUBLE PRECISION,
  "nitritoMgL"      DOUBLE PRECISION,
  "turbidezNTU"     DOUBLE PRECISION,
  "alcalinidadeMgL" DOUBLE PRECISION,
  "observacao"      TEXT,
  "alertas"         TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QualidadeAguaReg_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QualidadeAguaReg_tanqueId_fkey" FOREIGN KEY ("tanqueId") REFERENCES "TanqueAqua"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "QualidadeAguaReg_tanqueId_idx" ON "QualidadeAguaReg"("tanqueId");

-- MortalidadeAqua
CREATE TABLE IF NOT EXISTS "MortalidadeAqua" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "loteId"        TEXT NOT NULL,
  "data"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "quantidade"    INTEGER NOT NULL,
  "causaSuspeita" TEXT,
  "tratamento"    TEXT,
  "observacao"    TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MortalidadeAqua_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MortalidadeAqua_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "LoteAqua"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "MortalidadeAqua_loteId_idx" ON "MortalidadeAqua"("loteId");

-- TratamentoAqua
CREATE TABLE IF NOT EXISTS "TratamentoAqua" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "loteId"       TEXT NOT NULL,
  "data"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "medicamento"  TEXT NOT NULL,
  "dosagem"      TEXT,
  "carenciaDias" INTEGER,
  "motivoCID"    TEXT,
  "observacao"   TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TratamentoAqua_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TratamentoAqua_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "LoteAqua"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "TratamentoAqua_loteId_idx" ON "TratamentoAqua"("loteId");

-- DespescaAqua
CREATE TABLE IF NOT EXISTS "DespescaAqua" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "loteId"          TEXT NOT NULL,
  "data"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "quantidadePeixe" INTEGER NOT NULL,
  "pesoTotalKg"     DOUBLE PRECISION NOT NULL,
  "pesoMedioG"      DOUBLE PRECISION,
  "rendimentoPerc"  DOUBLE PRECISION,
  "destinoVenda"    TEXT,
  "precoKg"         DOUBLE PRECISION,
  "receita"         DOUBLE PRECISION,
  "observacao"      TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DespescaAqua_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DespescaAqua_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "LoteAqua"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "DespescaAqua_loteId_idx" ON "DespescaAqua"("loteId");

-- VendaAqua
CREATE TABLE IF NOT EXISTS "VendaAqua" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "loteId"     TEXT NOT NULL,
  "data"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "especie"    TEXT NOT NULL,
  "pesoKg"     DOUBLE PRECISION NOT NULL,
  "precoKg"    DOUBLE PRECISION NOT NULL,
  "total"      DOUBLE PRECISION NOT NULL,
  "comprador"  TEXT,
  "canal"      TEXT,
  "observacao" TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendaAqua_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VendaAqua_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "LoteAqua"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "VendaAqua_loteId_idx" ON "VendaAqua"("loteId");

-- DocumentoAqua
CREATE TABLE IF NOT EXISTS "DocumentoAqua" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "propertyId"  TEXT NOT NULL,
  "tipo"        TEXT NOT NULL,
  "numero"      TEXT,
  "orgao"       TEXT,
  "emissao"     TIMESTAMP(3),
  "vencimento"  TIMESTAMP(3),
  "status"      TEXT NOT NULL DEFAULT 'VIGENTE',
  "arquivo"     TEXT,
  "observacao"  TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentoAqua_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DocumentoAqua_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "DocumentoAqua_propertyId_idx" ON "DocumentoAqua"("propertyId");
