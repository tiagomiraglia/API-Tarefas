-- CreateTable
CREATE TABLE "WhatsAppSession" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "telefone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "qr_code" TEXT,
    "auth_data" JSONB,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "connected_at" TIMESTAMP(3),
    "disconnected_at" TIMESTAMP(3),

    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSession_session_id_key" ON "WhatsAppSession"("session_id");

-- CreateIndex
CREATE INDEX "WhatsAppSession_empresa_id_idx" ON "WhatsAppSession"("empresa_id");

-- CreateIndex
CREATE INDEX "WhatsAppSession_status_idx" ON "WhatsAppSession"("status");

-- CreateIndex
CREATE INDEX "WhatsAppSession_last_activity_idx" ON "WhatsAppSession"("last_activity");

-- AddForeignKey
ALTER TABLE "WhatsAppSession" ADD CONSTRAINT "WhatsAppSession_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
