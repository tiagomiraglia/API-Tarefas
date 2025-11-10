-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "needs_password_reset" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "temp_password" TEXT,
ADD COLUMN     "temp_password_expires_at" TIMESTAMP(3);
