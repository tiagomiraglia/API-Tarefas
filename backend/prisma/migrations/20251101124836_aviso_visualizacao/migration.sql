-- CreateTable
CREATE TABLE "AvisoVisualizacao" (
    "id" SERIAL NOT NULL,
    "aviso_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "visualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvisoVisualizacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvisoVisualizacao_aviso_id_usuario_id_key" ON "AvisoVisualizacao"("aviso_id", "usuario_id");

-- AddForeignKey
ALTER TABLE "AvisoVisualizacao" ADD CONSTRAINT "AvisoVisualizacao_aviso_id_fkey" FOREIGN KEY ("aviso_id") REFERENCES "Aviso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvisoVisualizacao" ADD CONSTRAINT "AvisoVisualizacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
