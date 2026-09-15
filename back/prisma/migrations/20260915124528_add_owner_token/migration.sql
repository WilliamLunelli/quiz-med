/*
  Warnings:

  - Added the required column `ownerToken` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "ownerToken" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Game_ownerToken_idx" ON "Game"("ownerToken");
