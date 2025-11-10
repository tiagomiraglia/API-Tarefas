-- CreateTable
CREATE TABLE "Cartao" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "coluna_id" INTEGER NOT NULL,
    "usuario_atribuido_id" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "data_vencimento" TIMESTAMP(3),
    "etiquetas" JSONB DEFAULT '[]',
    "checklist" JSONB DEFAULT '[]',
    "cor" TEXT DEFAULT '#ffffff',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" INTEGER,

    CONSTRAINT "Cartao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartaoWhatsApp" (
    "id" SERIAL NOT NULL,
    "cartao_id" INTEGER NOT NULL,
    "conversa_id" TEXT NOT NULL,
    "conversa_nome" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartaoWhatsApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemWhatsApp" (
    "id" SERIAL NOT NULL,
    "cartao_whatsapp_id" INTEGER NOT NULL,
    "mensagem_id" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "conteudo" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "midia_url" TEXT,
    "status" TEXT DEFAULT 'sent',
    "is_from_me" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensagemWhatsApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartaoHistorico" (
    "id" SERIAL NOT NULL,
    "cartao_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "acao" TEXT NOT NULL,
    "descricao" TEXT,
    "de_coluna_id" INTEGER,
    "para_coluna_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartaoHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartaoAnexo" (
    "id" SERIAL NOT NULL,
    "cartao_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT,
    "tamanho" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by_id" INTEGER,

    CONSTRAINT "CartaoAnexo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CartaoWhatsApp_cartao_id_key" ON "CartaoWhatsApp"("cartao_id");

-- CreateIndex
CREATE UNIQUE INDEX "MensagemWhatsApp_cartao_whatsapp_id_mensagem_id_key" ON "MensagemWhatsApp"("cartao_whatsapp_id", "mensagem_id");

-- AddForeignKey
ALTER TABLE "Cartao" ADD CONSTRAINT "Cartao_coluna_id_fkey" FOREIGN KEY ("coluna_id") REFERENCES "Coluna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cartao" ADD CONSTRAINT "Cartao_usuario_atribuido_id_fkey" FOREIGN KEY ("usuario_atribuido_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cartao" ADD CONSTRAINT "Cartao_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartaoWhatsApp" ADD CONSTRAINT "CartaoWhatsApp_cartao_id_fkey" FOREIGN KEY ("cartao_id") REFERENCES "Cartao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemWhatsApp" ADD CONSTRAINT "MensagemWhatsApp_cartao_whatsapp_id_fkey" FOREIGN KEY ("cartao_whatsapp_id") REFERENCES "CartaoWhatsApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartaoHistorico" ADD CONSTRAINT "CartaoHistorico_cartao_id_fkey" FOREIGN KEY ("cartao_id") REFERENCES "Cartao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartaoHistorico" ADD CONSTRAINT "CartaoHistorico_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartaoAnexo" ADD CONSTRAINT "CartaoAnexo_cartao_id_fkey" FOREIGN KEY ("cartao_id") REFERENCES "Cartao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartaoAnexo" ADD CONSTRAINT "CartaoAnexo_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
