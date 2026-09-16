/*
  Warnings:

  - Added the required column `apiSecretEncrypted` to the `trading_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secretEncryptionIv` to the `trading_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secretEncryptionTag` to the `trading_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "trading_accounts" ADD COLUMN     "apiSecretEncrypted" TEXT NOT NULL,
ADD COLUMN     "secretEncryptionIv" TEXT NOT NULL,
ADD COLUMN     "secretEncryptionTag" TEXT NOT NULL;
