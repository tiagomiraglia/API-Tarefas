-- AlterTable
ALTER TABLE "Cartao" ADD COLUMN     "atendente_responsavel_id" INTEGER;

-- CreateTable
CREATE TABLE "CartaoTransferencia" (
    "id" SERIAL NOT NULL,
    "cartao_id" INTEGER NOT NULL,
    "usuario_origem_id" INTEGER NOT NULL,
    "usuario_destino_id" INTEGER NOT NULL,
    "observacao" TEXT,
    "coluna_origem_id" INTEGER,
    "coluna_destino_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartaoTransferencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartaoTransferencia_cartao_id_idx" ON "CartaoTransferencia"("cartao_id");

-- CreateIndex
CREATE INDEX "CartaoTransferencia_usuario_origem_id_idx" ON "CartaoTransferencia"("usuario_origem_id");

-- CreateIndex
CREATE INDEX "CartaoTransferencia_usuario_destino_id_idx" ON "CartaoTransferencia"("usuario_destino_id");

-- CreateIndex
CREATE INDEX "CartaoTransferencia_created_at_idx" ON "CartaoTransferencia"("created_at");

-- AddForeignKey
ALTER TABLE "Cartao" ADD CONSTRAINT "Cartao_atendente_responsavel_id_fkey" FOREIGN KEY ("atendente_responsavel_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartaoTransferencia" ADD CONSTRAINT "CartaoTransferencia_cartao_id_fkey" FOREIGN KEY ("cartao_id") REFERENCES "Cartao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartaoTransferencia" ADD CONSTRAINT "CartaoTransferencia_usuario_origem_id_fkey" FOREIGN KEY ("usuario_origem_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartaoTransferencia" ADD CONSTRAINT "CartaoTransferencia_usuario_destino_id_fkey" FOREIGN KEY ("usuario_destino_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
