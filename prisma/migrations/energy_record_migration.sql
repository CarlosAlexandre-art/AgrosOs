-- Migration: EnergyRecord
-- Tabela de registros de energia da propriedade (consumo, produção solar, custo)
-- Executar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "EnergyRecord" (
    "id"          TEXT             NOT NULL DEFAULT gen_random_uuid()::text,
    "propertyId"  TEXT             NOT NULL,
    "month"       INTEGER          NOT NULL,
    "year"        INTEGER          NOT NULL,
    "source"      TEXT             NOT NULL DEFAULT 'GRID',
    "consumption" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "production"  DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes"       TEXT             NOT NULL DEFAULT '',
    "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnergyRecord_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EnergyRecord_propertyId_fkey"
        FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE,
    CONSTRAINT "EnergyRecord_propertyId_month_year_key"
        UNIQUE ("propertyId", "month", "year")
);

CREATE INDEX IF NOT EXISTS "EnergyRecord_propertyId_idx" ON "EnergyRecord"("propertyId");
