-- CreateTable
CREATE TABLE "PermissaoKanban" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "aba_id" INTEGER NOT NULL,
    "coluna_id" INTEGER,
    "tipo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermissaoKanban_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PermissaoKanban" ADD CONSTRAINT "PermissaoKanban_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissaoKanban" ADD CONSTRAINT "PermissaoKanban_aba_id_fkey" FOREIGN KEY ("aba_id") REFERENCES "Aba"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissaoKanban" ADD CONSTRAINT "PermissaoKanban_coluna_id_fkey" FOREIGN KEY ("coluna_id") REFERENCES "Coluna"("id") ON DELETE SET NULL ON UPDATE CASCADE;
