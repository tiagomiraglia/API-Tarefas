-- AlterTable
ALTER TABLE "Aviso" ADD COLUMN     "destinatario_id" INTEGER,
ADD COLUMN     "destinatario_nivel" TEXT;

-- AddForeignKey
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
