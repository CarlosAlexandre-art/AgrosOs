-- Migration: Equipe IA — Agentes Autônomos
-- Tabelas AgentConfig e AgentRun

CREATE TYPE "AgentTipo" AS ENUM ('PRONTO', 'PERSONALIZADO');
CREATE TYPE "AgentTrigger" AS ENUM ('CRON', 'MANUAL', 'EVENTO');
CREATE TYPE "RunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

CREATE TABLE "AgentConfig" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"       TEXT NOT NULL,
  "nome"         TEXT NOT NULL,
  "descricao"    TEXT,
  "role"         TEXT NOT NULL,
  "tipo"         "AgentTipo" NOT NULL DEFAULT 'PERSONALIZADO',
  "tools"        TEXT[] NOT NULL DEFAULT '{}',
  "trigger"      "AgentTrigger" NOT NULL DEFAULT 'MANUAL',
  "schedule"     TEXT,
  "modelo"       TEXT NOT NULL DEFAULT 'llama-3.3-70b-versatile',
  "systemPrompt" TEXT,
  "ativo"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgentConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "AgentRun" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "agentId"     TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt"  TIMESTAMP(3),
  "status"      "RunStatus" NOT NULL DEFAULT 'RUNNING',
  "resultado"   TEXT,
  "toolCalls"   TEXT,
  "erro"        TEXT,
  CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgentRun_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentConfig"("id") ON DELETE CASCADE
);

CREATE INDEX "AgentConfig_userId_idx" ON "AgentConfig"("userId");
CREATE INDEX "AgentRun_agentId_idx" ON "AgentRun"("agentId");
CREATE INDEX "AgentRun_userId_idx" ON "AgentRun"("userId");
