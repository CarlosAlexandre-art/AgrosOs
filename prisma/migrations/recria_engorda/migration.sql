-- Adiciona valores ao enum ObjetivoLote
ALTER TYPE "ObjetivoLote" ADD VALUE IF NOT EXISTS 'ENGORDA';
ALTER TYPE "ObjetivoLote" ADD VALUE IF NOT EXISTS 'RECRIA_ENGORDA';

-- Adiciona campos de recria-engorda ao modelo Lote
ALTER TABLE "Lote"
  ADD COLUMN IF NOT EXISTS "faseAtual"         text,
  ADD COLUMN IF NOT EXISTS "metaGMD"           double precision,
  ADD COLUMN IF NOT EXISTS "pesoInicioEngorda" double precision,
  ADD COLUMN IF NOT EXISTS "dataInicioEngorda" timestamp(3),
  ADD COLUMN IF NOT EXISTS "sistemaProducao"   text,
  ADD COLUMN IF NOT EXISTS "numPiquetes"       integer,
  ADD COLUMN IF NOT EXISTS "areaHectares"      double precision,
  ADD COLUMN IF NOT EXISTS "regiao"            text;
