/*
  Warnings:

  - You are about to drop the column `quantity` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "quantity",
ADD COLUMN     "sellerId" TEXT NOT NULL DEFAULT 'temp-seller',
ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'temp-user';
