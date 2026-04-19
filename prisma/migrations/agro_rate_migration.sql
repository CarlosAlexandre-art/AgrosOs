-- AgroRate Migration
-- Execute quando o banco estiver disponível

-- Adicionar campos à tabela Property
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "agroRateId" UUID UNIQUE REFERENCES "AgroRate"("id") ON DELETE SET NULL;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "creditRequestsId" UUID[];

-- Criar enum ScoreCategory
CREATE TYPE IF NOT EXISTS "ScoreCategory" AS ENUM ('ELITE', 'HIGH', 'GOOD', 'REGULAR', 'LOW', 'CRITICAL');

-- Criar tabela AgroRate
CREATE TABLE IF NOT EXISTS "AgroRate" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "propertyId" UUID UNIQUE NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
    "score" INTEGER DEFAULT 500,
    "category" "ScoreCategory" DEFAULT 'REGULAR',
    "productionScore" INTEGER DEFAULT 0,
    "efficiencyScore" INTEGER DEFAULT 0,
    "behaviorScore" INTEGER DEFAULT 0,
    "operationalScore" INTEGER DEFAULT 0,
    "totalRevenue" DECIMAL DEFAULT 0,
    "totalCosts" DECIMAL DEFAULT 0,
    "productivity" DECIMAL DEFAULT 0,
    "marginRate" DECIMAL DEFAULT 0,
    "activityCount" INTEGER DEFAULT 0,
    "paymentOnTimeRate" DECIMAL DEFAULT 0,
    "dataCompleteness" DECIMAL DEFAULT 0,
    "benchmarkComparison" JSONB DEFAULT '{}',
    "trendHistory" JSONB DEFAULT '[]',
    "lastCalculated" TIMESTAMP DEFAULT NOW(),
    "nextUpdate" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Criar enum CreditRequestStatus
CREATE TYPE IF NOT EXISTS "CreditRequestStatus" AS ENUM ('PENDING', 'ANALYZING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CONTRACTED');

-- Criar tabela CreditPartner
CREATE TABLE IF NOT EXISTS "CreditPartner" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "type" VARCHAR DEFAULT 'BANK',
    "logoUrl" VARCHAR,
    "apiEndpoint" VARCHAR,
    "apiKey" VARCHAR,
    "isActive" BOOLEAN DEFAULT true,
    "priority" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Criar tabela CreditOffer
CREATE TABLE IF NOT EXISTS "CreditOffer" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "partnerId" UUID NOT NULL REFERENCES "CreditPartner"("id") ON DELETE CASCADE,
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,
    "minScore" INTEGER DEFAULT 0,
    "maxScore" INTEGER DEFAULT 1000,
    "minAmount" DECIMAL DEFAULT 0,
    "maxAmount" DECIMAL DEFAULT 1000000,
    "minRate" DECIMAL NOT NULL,
    "maxRate" DECIMAL NOT NULL,
    "minTerm" INTEGER DEFAULT 1,
    "maxTerm" INTEGER DEFAULT 60,
    "requirements" JSONB DEFAULT '{}',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Criar tabela CreditRequest
CREATE TABLE IF NOT EXISTS "CreditRequest" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
    "partnerId" UUID REFERENCES "CreditPartner"("id"),
    "requestedAmount" DECIMAL NOT NULL,
    "approvedAmount" DECIMAL,
    "interestRate" DECIMAL,
    "termMonths" INTEGER,
    "status" "CreditRequestStatus" DEFAULT 'PENDING',
    "rejectionReason" VARCHAR,
    "proposals" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Atualizar Property com Foreign Key
ALTER TABLE "Property" ADD CONSTRAINT "Property_agroRateId_fkey" 
    FOREIGN KEY ("agroRateId") REFERENCES "AgroRate"("id") ON DELETE SET NULL;

-- Seed de parceiros iniciais (opcional)
INSERT INTO "CreditPartner" ("name", "type", "priority") VALUES 
    ('Sicredi', 'COOPERATIVE', 1),
    ('Sicoob', 'COOPERATIVE', 2),
    ('Banco do Brasil', 'BANK', 3),
    ('Bradesco', 'BANK', 4)
ON CONFLICT DO NOTHING;

-- Seed de ofertas (opcional)
DO $$
DECLARE
    sicredi_id UUID;
    sicoob_id UUID;
BEGIN
    SELECT id INTO sicredi_id FROM "CreditPartner" WHERE name = 'Sicredi';
    SELECT id INTO sicoob_id FROM "CreditPartner" WHERE name = 'Sicoob';
    
    IF sicredi_id IS NOT NULL THEN
        INSERT INTO "CreditOffer" ("partnerId", "name", "minScore", "maxScore", "minRate", "maxRate", "minTerm", "maxTerm") VALUES
        (sicredi_id, 'Crédito Rural Premium', 750, 1000, 0.012, 0.018, 6, 24),
        (sicredi_id, 'Financiamento de Insumos', 600, 1000, 0.015, 0.022, 3, 12)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF sicoob_id IS NOT NULL THEN
        INSERT INTO "CreditOffer" ("partnerId", "name", "minScore", "maxScore", "minRate", "maxRate", "minTerm", "maxTerm") VALUES
        (sicoob_id, 'Crédito Agricole', 700, 1000, 0.013, 0.020, 6, 18)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
