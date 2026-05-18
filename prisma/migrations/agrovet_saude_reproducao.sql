-- Migration: AgroVet — Saúde & Reprodução
-- Cria as tabelas que faltam para o módulo de saúde e reprodução bovina
-- Executar no Supabase SQL Editor

-- ─── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE "TipoEventoReprodutivo" AS ENUM (
        'CIO_DETECTADO',
        'INSEMINACAO_ARTIFICIAL',
        'MONTA_NATURAL',
        'DIAGNOSTICO_PRENHEZ',
        'CONFIRMACAO_PRENHEZ',
        'PARTO',
        'ABORTO',
        'DESMAME',
        'DESCARTE_REPRODUTIVO'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "StatusPrenhez" AS ENUM (
        'VAZIA',
        'PRENHA',
        'INCERTA',
        'PARIDA'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ProtocoloVacinal ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ProtocoloVacinal" (
    "id"           TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "propertyId"   TEXT         NOT NULL,
    "nome"         TEXT         NOT NULL,
    "doenca"       TEXT         NOT NULL,
    "frequencia"   TEXT         NOT NULL DEFAULT 'ANUAL',
    "produto"      TEXT,
    "dose"         TEXT,
    "mesesAplicar" JSONB        NOT NULL DEFAULT '[3,9]',
    "ativo"        BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProtocoloVacinal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProtocoloVacinal_propertyId_fkey"
        FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProtocoloVacinal_propertyId_idx" ON "ProtocoloVacinal"("propertyId");

-- ─── EventoReprodutivo ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "EventoReprodutivo" (
    "id"          TEXT                      NOT NULL DEFAULT gen_random_uuid()::text,
    "animalId"    TEXT                      NOT NULL,
    "tipo"        "TipoEventoReprodutivo"   NOT NULL,
    "data"        TIMESTAMP(3)              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "touruId"     TEXT,
    "veterinario" TEXT,
    "resultado"   TEXT,
    "pesoBezerro" DOUBLE PRECISION,
    "observacao"  TEXT,
    "createdAt"   TIMESTAMP(3)              NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoReprodutivo_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EventoReprodutivo_animalId_fkey"
        FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "EventoReprodutivo_animalId_idx" ON "EventoReprodutivo"("animalId");

-- ─── StatusReprodutivo ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "StatusReprodutivo" (
    "id"                TEXT            NOT NULL DEFAULT gen_random_uuid()::text,
    "animalId"          TEXT            NOT NULL,
    "status"            "StatusPrenhez" NOT NULL DEFAULT 'VAZIA',
    "dataUltimoCio"     TIMESTAMP(3),
    "dataInseminacao"   TIMESTAMP(3),
    "dataPrevistoParto" TIMESTAMP(3),
    "paricoes"          INTEGER         NOT NULL DEFAULT 0,
    "updatedAt"         TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusReprodutivo_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StatusReprodutivo_animalId_key" UNIQUE ("animalId"),
    CONSTRAINT "StatusReprodutivo_animalId_fkey"
        FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE
);
