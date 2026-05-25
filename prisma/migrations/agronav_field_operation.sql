-- AgroNav Phase 3: tabela de operações de campo
CREATE TABLE IF NOT EXISTS "FieldOperation" (
  "id"            TEXT NOT NULL,
  "fieldId"       TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "tipo"          TEXT NOT NULL,
  "larguraM"      DOUBLE PRECISION NOT NULL,
  "anguloGraus"   DOUBLE PRECISION NOT NULL,
  "velocidadeKmh" DOUBLE PRECISION NOT NULL,
  "areaHa"        DOUBLE PRECISION NOT NULL,
  "passadas"      INTEGER NOT NULL,
  "comprimentoKm" DOUBLE PRECISION NOT NULL,
  "tempoEstHoras" DOUBLE PRECISION NOT NULL,
  "tempoRealMin"  DOUBLE PRECISION,
  "combustivelL"  DOUBLE PRECISION,
  "modoGps"       BOOLEAN NOT NULL DEFAULT false,
  "serviceId"     TEXT,
  "completedAt"   TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FieldOperation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FieldOperation"
  ADD CONSTRAINT IF NOT EXISTS "FieldOperation_fieldId_fkey"
  FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FieldOperation"
  ADD CONSTRAINT IF NOT EXISTS "FieldOperation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "FieldOperation_fieldId_idx" ON "FieldOperation"("fieldId");
CREATE INDEX IF NOT EXISTS "FieldOperation_userId_idx"  ON "FieldOperation"("userId");
