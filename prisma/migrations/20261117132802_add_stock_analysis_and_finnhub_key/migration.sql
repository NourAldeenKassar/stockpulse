-- AlterTable
ALTER TABLE "users" ADD COLUMN     "finnhubKeyEncrypted" TEXT,
ADD COLUMN     "finnhubKeyIv" TEXT,
ADD COLUMN     "finnhubKeyTag" TEXT;

-- CreateTable
CREATE TABLE "stock_analyses" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "symbol" TEXT,
    "consensus" JSONB,
    "analysis" JSONB NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_analyses_accountId_ticker_createdAt_idx" ON "stock_analyses"("accountId", "ticker", "createdAt");

-- AddForeignKey
ALTER TABLE "stock_analyses" ADD CONSTRAINT "stock_analyses_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "trading_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
