-- AlterTable
ALTER TABLE "User" ADD COLUMN     "devicePublicKey" TEXT,
ADD COLUMN     "encryptedLat" BYTEA,
ADD COLUMN     "encryptedLng" BYTEA,
ADD COLUMN     "encryptedLocNonce" TEXT,
ADD COLUMN     "locationEncPubKey" TEXT;

-- CreateTable
CREATE TABLE "CommanderVisibilityGrant" (
    "id" TEXT NOT NULL,
    "grantedToId" TEXT NOT NULL,
    "targetCommanderId" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "reason" TEXT,
    "viewerPublicKey" TEXT NOT NULL,
    "ephemeralPubKey" TEXT,
    "encryptedViewKey" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "CommanderVisibilityGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommanderVisibilityGrant_grantedToId_idx" ON "CommanderVisibilityGrant"("grantedToId");

-- CreateIndex
CREATE UNIQUE INDEX "CommanderVisibilityGrant_grantedToId_targetCommanderId_key" ON "CommanderVisibilityGrant"("grantedToId", "targetCommanderId");

-- AddForeignKey
ALTER TABLE "CommanderVisibilityGrant" ADD CONSTRAINT "CommanderVisibilityGrant_grantedToId_fkey" FOREIGN KEY ("grantedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommanderVisibilityGrant" ADD CONSTRAINT "CommanderVisibilityGrant_targetCommanderId_fkey" FOREIGN KEY ("targetCommanderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
