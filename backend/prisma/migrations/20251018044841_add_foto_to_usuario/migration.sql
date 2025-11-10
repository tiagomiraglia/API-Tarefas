-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "foto" TEXT,
ADD COLUMN     "ultimo_login" TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "Aviso" (
    "id" SERIAL NOT NULL,
    "mensagem" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_expiracao" TIMESTAMP(3),

    CONSTRAINT "Aviso_pkey" PRIMARY KEY ("id")
);
