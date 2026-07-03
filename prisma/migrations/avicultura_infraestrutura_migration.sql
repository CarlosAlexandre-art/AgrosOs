-- =====================================================
-- AVICULTURA — Infraestrutura do galpão, programa de luz e choco
-- Rodar no Supabase SQL Editor do SmartAgroOS, DEPOIS de
-- prisma/migrations/avicultura_migration.sql
-- =====================================================

-- Especificações do galpão / instalação
ALTER TABLE "AveLote" ADD COLUMN IF NOT EXISTS "areaM2" DOUBLE PRECISION;
ALTER TABLE "AveLote" ADD COLUMN IF NOT EXISTS "peDireitoM" DOUBLE PRECISION;
ALTER TABLE "AveLote" ADD COLUMN IF NOT EXISTS "numBebedouros" INTEGER;
ALTER TABLE "AveLote" ADD COLUMN IF NOT EXISTS "tipoBebedouro" TEXT;
ALTER TABLE "AveLote" ADD COLUMN IF NOT EXISTS "numComedouros" INTEGER;
ALTER TABLE "AveLote" ADD COLUMN IF NOT EXISTS "tipoComedouro" TEXT;
ALTER TABLE "AveLote" ADD COLUMN IF NOT EXISTS "capacidadeComedouroKg" DOUBLE PRECISION;

-- Programa de luz (fotoperíodo)
ALTER TABLE "AveLote" ADD COLUMN IF NOT EXISTS "horasLuzMeta" DOUBLE PRECISION DEFAULT 16;
ALTER TABLE "AveLote" ADD COLUMN IF NOT EXISTS "horasLuzNaturalMeta" DOUBLE PRECISION;
ALTER TABLE "AveLote" ADD COLUMN IF NOT EXISTS "horasLuzArtificialMeta" DOUBLE PRECISION;
ALTER TABLE "AveLote" ADD COLUMN IF NOT EXISTS "horaAcenderLuz" TEXT;
ALTER TABLE "AveLote" ADD COLUMN IF NOT EXISTS "horaApagarLuz" TEXT;

-- AveChoco (controle de galinhas chocas)
CREATE TABLE IF NOT EXISTS "AveChoco" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "loteId"         TEXT NOT NULL,
  "quantidadeAves" INTEGER NOT NULL,
  "dataInicio"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dataFim"        TIMESTAMP(3),
  "metodo"         TEXT,
  "observacao"     TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AveChoco_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AveChoco_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "AveLote"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AveChoco_loteId_idx" ON "AveChoco"("loteId");
