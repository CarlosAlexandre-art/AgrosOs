-- Migration mínima para Confinamento Inteligente funcionar
-- Executar no Supabase SQL Editor

-- Enums necessários
DO $$ BEGIN
    CREATE TYPE "ObjetivoLote" AS ENUM ('ABATE','LEITE','REPRODUCAO','RECRIA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "StatusLote" AS ENUM ('ATIVO','ENCERRADO','CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tabela Lote
CREATE TABLE IF NOT EXISTS "Lote" (
    "id"                TEXT             NOT NULL DEFAULT gen_random_uuid()::text,
    "propertyId"        TEXT             NOT NULL,
    "nome"              TEXT             NOT NULL,
    "cabecas"           INTEGER          NOT NULL,
    "racaPredominante"  TEXT,
    "idadeMediaMeses"   INTEGER,
    "pesoMedioEntrada"  DOUBLE PRECISION NOT NULL DEFAULT 0,
    "objetivo"          "ObjetivoLote"   NOT NULL DEFAULT 'ABATE',
    "pesoMetaAbate"     DOUBLE PRECISION,
    "dataEntrada"       TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSaidaPrevista" TIMESTAMP(3),
    "dataEncerramento"  TIMESTAMP(3),
    "custoTotal"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status"            "StatusLote"     NOT NULL DEFAULT 'ATIVO',
    "createdAt"         TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Lote_propertyId_fkey"
        FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Lote_propertyId_idx" ON "Lote"("propertyId");

-- Tabela LoteDiario (registros diários do lote)
CREATE TABLE IF NOT EXISTS "LoteDiario" (
    "id"             TEXT             NOT NULL DEFAULT gen_random_uuid()::text,
    "loteId"         TEXT             NOT NULL,
    "data"           TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumoRacaoKg" DOUBLE PRECISION,
    "consumoAguaL"   DOUBLE PRECISION,
    "pesoMedio"      DOUBLE PRECISION,
    "mortalidade"    INTEGER          NOT NULL DEFAULT 0,
    "medicacao"      TEXT,
    "observacoes"    TEXT,
    "custoRacaoDia"  DOUBLE PRECISION,
    "custoDia"       DOUBLE PRECISION,
    "createdAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoteDiario_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LoteDiario_loteId_fkey"
        FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "LoteDiario_loteId_idx" ON "LoteDiario"("loteId");
CREATE INDEX IF NOT EXISTS "LoteDiario_data_idx"   ON "LoteDiario"("data");
