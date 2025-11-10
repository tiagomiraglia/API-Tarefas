-- CreateTable
CREATE TABLE "Aba" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Aba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coluna" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "aba_id" INTEGER NOT NULL,
    "recebe_whats" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coluna_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Aba" ADD CONSTRAINT "Aba_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coluna" ADD CONSTRAINT "Coluna_aba_id_fkey" FOREIGN KEY ("aba_id") REFERENCES "Aba"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
