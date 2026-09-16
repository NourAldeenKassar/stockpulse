-- AlterTable
ALTER TABLE "users" ADD COLUMN     "llmGatewayKeyEncrypted" TEXT,
ADD COLUMN     "llmGatewayKeyIv" TEXT,
ADD COLUMN     "llmGatewayKeyTag" TEXT,
ADD COLUMN     "llmGatewayUrl" TEXT;
