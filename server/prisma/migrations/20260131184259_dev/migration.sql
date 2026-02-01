/*
  Warnings:

  - A unique constraint covering the columns `[bankName]` on the table `Accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Accounts_bankName_key" ON "Accounts"("bankName");
