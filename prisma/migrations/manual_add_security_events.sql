-- Migration: adiciona tabela SecurityEvent para monitoramento de fraudes/golpes
-- Rodar no Supabase SQL Editor do projeto agroos (waaxigfbbohajavhkgsb)

CREATE TABLE IF NOT EXISTS "SecurityEvent" (
  "id"        TEXT        NOT NULL,
  "type"      TEXT        NOT NULL,
  "severity"  TEXT        NOT NULL DEFAULT 'MEDIUM',
  "userId"    TEXT,
  "tokenId"   TEXT,
  "stripeId"  TEXT,
  "details"   JSONB,
  "resolved"  BOOLEAN     NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SecurityEvent_userId_idx"    ON "SecurityEvent"("userId");
CREATE INDEX IF NOT EXISTS "SecurityEvent_type_idx"      ON "SecurityEvent"("type");
CREATE INDEX IF NOT EXISTS "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");
