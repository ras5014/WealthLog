-- CreateTable
CREATE TABLE "Accounts" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountBalance" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accounts_pkey" PRIMARY KEY ("id")
);
