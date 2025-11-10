-- AlterTable
ALTER TABLE "Cartao" ADD COLUMN     "anotacoes" TEXT,
ADD COLUMN     "status_atendimento" TEXT,
ADD COLUMN     "valor_orcamento" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "config_kanban" JSONB NOT NULL DEFAULT '{"usar_orcamento": false, "usar_status_visual": true, "tags_personalizadas": false}';

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#6366f1',
    "icone" TEXT NOT NULL DEFAULT 'tag',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tag_empresa_id_ativo_idx" ON "Tag"("empresa_id", "ativo");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
