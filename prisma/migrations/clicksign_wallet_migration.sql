-- Adiciona campos Clicksign e assinatura ao AgroToken
ALTER TABLE "AgroToken"
  ADD COLUMN IF NOT EXISTS "clicksignDocKey"    TEXT,
  ADD COLUMN IF NOT EXISTS "clicksignSignerKey" TEXT,
  ADD COLUMN IF NOT EXISTS "signedAt"           TIMESTAMPTZ;
