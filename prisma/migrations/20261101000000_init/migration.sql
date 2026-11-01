-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "editionLabel" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "timeStart" TEXT NOT NULL,
    "timeEnd" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "venueName" TEXT NOT NULL,
    "venueAddress" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ticketUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "heroImage" TEXT NOT NULL,
    "detailsVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Edition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dateDisplay" TEXT NOT NULL,
    "dateISO" TEXT,
    "dateStatus" TEXT NOT NULL DEFAULT 'YEAR_TO_CONFIRM',
    "venue" TEXT,
    "description" TEXT NOT NULL,
    "coverImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Edition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Performer" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imagePath" TEXT,
    "bio" TEXT,
    "socials" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Performer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "src" TEXT,
    "poster" TEXT,
    "caption" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationSeconds" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "storagePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketCategory" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceNaira" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "channel" TEXT NOT NULL,
    "note" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TicketCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketVerification" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'popout',
    "providerRefHash" TEXT NOT NULL,
    "providerRefCipher" TEXT,
    "orderRefHash" TEXT NOT NULL,
    "orderRefLast4" TEXT NOT NULL,
    "purchaserEmailHash" TEXT NOT NULL,
    "purchaserEmailMasked" TEXT NOT NULL,
    "purchaserEmailCipher" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "importBatch" TEXT,
    "purchasedAt" TIMESTAMP(3),
    "rawPayload" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "inviteTokenHash" TEXT,
    "inviteTokenCipher" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "inviteSentAt" TIMESTAMP(3),
    "inviteStatus" TEXT,
    "inviteError" TEXT,

    CONSTRAINT "TicketVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardClaim" (
    "id" TEXT NOT NULL,
    "publicRef" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "verificationId" TEXT,
    "emailCipher" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "emailMasked" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "ticketRefCipher" TEXT,
    "ticketRefLast4" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MANUAL_REVIEW',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "adminNote" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "CardClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TributeSong" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "officialUrl" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'Spotify',
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "linkStatus" TEXT NOT NULL DEFAULT 'SEARCH_FALLBACK',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TributeSong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TributeCard" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "artworkVariant" TEXT NOT NULL DEFAULT 'chrome-999',
    "accessTokenHash" TEXT NOT NULL,
    "accessTokenCipher" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TributeCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDelivery" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "toEmailMasked" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'resend',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Edition_slug_key" ON "Edition"("slug");

-- CreateIndex
CREATE INDEX "Performer_editionId_status_idx" ON "Performer"("editionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Performer_editionId_name_category_key" ON "Performer"("editionId", "name", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Media_key_key" ON "Media"("key");

-- CreateIndex
CREATE INDEX "Media_editionId_status_type_idx" ON "Media"("editionId", "status", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TicketCategory_eventId_name_channel_key" ON "TicketCategory"("eventId", "name", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "TicketVerification_providerRefHash_key" ON "TicketVerification"("providerRefHash");

-- CreateIndex
CREATE UNIQUE INDEX "TicketVerification_inviteTokenHash_key" ON "TicketVerification"("inviteTokenHash");

-- CreateIndex
CREATE INDEX "TicketVerification_purchaserEmailHash_status_idx" ON "TicketVerification"("purchaserEmailHash", "status");

-- CreateIndex
CREATE INDEX "TicketVerification_status_inviteStatus_idx" ON "TicketVerification"("status", "inviteStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CardClaim_publicRef_key" ON "CardClaim"("publicRef");

-- CreateIndex
CREATE UNIQUE INDEX "CardClaim_verificationId_key" ON "CardClaim"("verificationId");

-- CreateIndex
CREATE INDEX "CardClaim_status_createdAt_idx" ON "CardClaim"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CardClaim_emailHash_idx" ON "CardClaim"("emailHash");

-- CreateIndex
CREATE UNIQUE INDEX "TributeSong_title_key" ON "TributeSong"("title");

-- CreateIndex
CREATE UNIQUE INDEX "TributeCard_publicId_key" ON "TributeCard"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "TributeCard_cardNumber_key" ON "TributeCard"("cardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TributeCard_claimId_key" ON "TributeCard"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "TributeCard_accessTokenHash_key" ON "TributeCard"("accessTokenHash");

-- CreateIndex
CREATE INDEX "TributeCard_issuedAt_idx" ON "TributeCard"("issuedAt");

-- CreateIndex
CREATE INDEX "EmailDelivery_status_idx" ON "EmailDelivery"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Performer" ADD CONSTRAINT "Performer_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketCategory" ADD CONSTRAINT "TicketCategory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketVerification" ADD CONSTRAINT "TicketVerification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardClaim" ADD CONSTRAINT "CardClaim_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardClaim" ADD CONSTRAINT "CardClaim_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "TicketVerification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TributeCard" ADD CONSTRAINT "TributeCard_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "CardClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TributeCard" ADD CONSTRAINT "TributeCard_songId_fkey" FOREIGN KEY ("songId") REFERENCES "TributeSong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "TributeCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

