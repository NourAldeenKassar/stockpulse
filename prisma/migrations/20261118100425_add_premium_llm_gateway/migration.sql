-- AlterTable
ALTER TABLE "users" ADD COLUMN     "llmPremiumGatewayUrl" TEXT,
ADD COLUMN     "llmPremiumKeyEncrypted" TEXT,
ADD COLUMN     "llmPremiumKeyIv" TEXT,
ADD COLUMN     "llmPremiumKeyTag" TEXT;
