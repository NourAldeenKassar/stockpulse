-- CreateTable
CREATE TABLE "insight_records" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "insights" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insight_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "insight_records_accountId_createdAt_idx" ON "insight_records"("accountId", "createdAt");

-- AddForeignKey
ALTER TABLE "insight_records" ADD CONSTRAINT "insight_records_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "trading_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
