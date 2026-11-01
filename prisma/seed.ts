import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { last4, maskEmail } from "../src/lib/crypto";
import { emailHash, ticketRefHash } from "../src/lib/pii";

const prisma = new PrismaClient();

const TICKET_URL = "https://popouttickets.com/events/atpdettydecember";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to seed the admin account.");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: { name: "WESTHAN.ENT Owner", passwordHash, role: "OWNER", active: true },
    create: {
      email: adminEmail.toLowerCase(),
      name: "WESTHAN.ENT Owner",
      passwordHash,
      role: "OWNER",
    },
  });

  const event = await prisma.event.upsert({
    where: { slug: "atlantis-4" },
    update: {
      title: "ATLANTIS THE PARTY",
      editionLabel: "4.0 — Detty December",
      eventDate: new Date("2026-12-30T13:00:00+01:00"),
      timeStart: "1:00 PM",
      timeEnd: "11:00 PM",
      timezone: "Africa/Lagos",
      venueName: "Watercress Event Center",
      venueAddress: "Allen, Ikeja, Lagos",
      description:
        "The fourth Atlantis lands on December 30 for Detty December — a full day-to-night party with music, performances and a special 999 remembrance experience.",
      ticketUrl: TICKET_URL,
      status: "UPCOMING",
      heroImage: "/media/images/atlantis-4-flyer.webp",
      detailsVerified: false,
    },
    create: {
      slug: "atlantis-4",
      title: "ATLANTIS THE PARTY",
      editionLabel: "4.0 — Detty December",
      eventDate: new Date("2026-12-30T13:00:00+01:00"),
      timeStart: "1:00 PM",
      timeEnd: "11:00 PM",
      timezone: "Africa/Lagos",
      venueName: "Watercress Event Center",
      venueAddress: "Allen, Ikeja, Lagos",
      description:
        "The fourth Atlantis lands on December 30 for Detty December — a full day-to-night party with music, performances and a special 999 remembrance experience.",
      ticketUrl: TICKET_URL,
      status: "UPCOMING",
      heroImage: "/media/images/atlantis-4-flyer.webp",
      detailsVerified: false,
    },
  });

  const editions = [
    {
      slug: "atlantis-1",
      number: 1,
      name: "ATLANTIS 1.0",
      label: "The Beginning",
      dateDisplay: "August 18",
      dateISO: null,
      dateStatus: "YEAR_TO_CONFIRM",
      venue: "Watercress Event Center, Allen, Ikeja, Lagos",
      description:
        "The first Atlantis arrived at Watercress Event Center with food and drinks, DJs and hypemen, a photo booth, tattoo artists, a face painter and party games. The flyer announces August 18, 2–9 PM.",
      coverImage: "/media/images/atlantis-1-flyer.webp",
      status: "PUBLISHED",
      note: "Year not stated on the supplied flyer — to be confirmed by the organizer.",
      sortOrder: 1,
    },
    {
      slug: "atlantis-2",
      number: 2,
      name: "ATLANTIS 2.0",
      label: "The Evolution",
      dateDisplay: "December 29",
      dateISO: null,
      dateStatus: "YEAR_TO_CONFIRM",
      venue: "Watercress Event Center, Allen, Ikeja, Lagos",
      description:
        "The Christmas edition grew the room into a full lineup: twenty-five credited artists, hypemen, DJs and guest appearances, running 1–11 PM at Watercress Event Center. This is the only edition associated with the supplied lineup flyer.",
      coverImage: "/media/images/atlantis-2-flyer.webp",
      status: "PUBLISHED",
      note: "Year not stated on the supplied flyer. Lineup spellings transcribed from the flyer and pending proofreading.",
      sortOrder: 2,
    },
    {
      slug: "atlantis-3",
      number: 3,
      name: "ATLANTIS 3.0",
      label: "The Experience",
      dateDisplay: "Date to be confirmed",
      dateISO: null,
      dateStatus: "FLAGGED",
      venue: "Somewhere in Ikeja, Lagos (per flyer)",
      description:
        "The third edition brought guest artists, a pop-up, tattoos and piercings, DJs and hypemen, and a photo booth together for an 1–11 PM party in Ikeja. The supplied videos were provided by the organizer as Atlantis 3.0 footage.",
      coverImage: "/media/images/atlantis-3-flyer.webp",
      status: "PUBLISHED",
      note: "Date conflict: the organizer says August 19 while the supplied flyer reads AUG 18. Preserve both until resolved.",
      sortOrder: 3,
    },
    {
      slug: "atlantis-4",
      number: 4,
      name: "ATLANTIS 4.0",
      label: "Detty December",
      dateDisplay: "December 30, 2026",
      dateISO: "2026-12-30",
      dateStatus: "CONFIRMED",
      venue: "Watercress Event Center, Allen, Ikeja, Lagos",
      description:
        "Detty December closes the year with Atlantis 4.0 on December 30, 2026, including the 999 remembrance experience. Venue, time and prices are transcribed from the official flyer pending final organizer confirmation.",
      coverImage: "/media/images/atlantis-4-flyer.webp",
      status: "PUBLISHED",
      note: "Lineup is intentionally empty until performers are confirmed in the admin dashboard.",
      sortOrder: 4,
    },
  ];

  for (const edition of editions) {
    await prisma.edition.upsert({
      where: { slug: edition.slug },
      update: edition,
      create: edition,
    });
  }

  const editionBySlug = Object.fromEntries(
    (await prisma.edition.findMany()).map((edition) => [edition.slug, edition]),
  );

  const performers = [
    // Historic Atlantis 2.0 lineup — transcribed from the supplied lineup flyer.
    { name: "Menad", category: "ARTIST" },
    { name: "Artsalghul", category: "ARTIST" },
    { name: "Wavestar", category: "ARTIST", imagePath: "/media/images/atlantis-2-wavestar.webp" },
    { name: "Re3nzo", category: "ARTIST" },
    { name: "Ovi Payne", category: "ARTIST" },
    { name: "Scotty Olorin", category: "ARTIST", imagePath: "/media/images/atlantis-2-scotty-olorin.webp" },
    { name: "Ravington", category: "ARTIST" },
    { name: "Logdrapper", category: "ARTIST" },
    { name: "Ewyse", category: "ARTIST" },
    { name: "Golden X", category: "ARTIST" },
    { name: "AY of Hype", category: "HYPEMAN" },
    { name: "Ketan", category: "HYPEMAN" },
    { name: "Yazee", category: "HYPEMAN" },
    { name: "Khay", category: "HYPEMAN" },
    { name: "Noel", category: "HYPEMAN" },
    { name: "Evian of Hype", category: "HYPEMAN" },
    { name: "DJ Benzo", category: "DJ" },
    { name: "DJ Flash", category: "DJ" },
    { name: "DJ Zenny", category: "DJ" },
    { name: "DJ Tekest", category: "DJ" },
    { name: "DJ Eddie", category: "DJ" },
    { name: "Asherkine", category: "GUEST" },
    { name: "Perlinks", category: "GUEST" },
    { name: "Lagos", category: "GUEST" },
    { name: "Tush", category: "GUEST" },
  ];

  for (const [index, performer] of performers.entries()) {
    await prisma.performer.upsert({
      where: {
        editionId_name_category: {
          editionId: editionBySlug["atlantis-2"].id,
          name: performer.name,
          category: performer.category,
        },
      },
      update: {
        imagePath: performer.imagePath ?? null,
        status: "ARCHIVED",
        featured: false,
        sortOrder: index,
      },
      create: {
        editionId: editionBySlug["atlantis-2"].id,
        name: performer.name,
        category: performer.category,
        imagePath: performer.imagePath ?? null,
        status: "ARCHIVED",
        sortOrder: index,
      },
    });
  }

  const posters = [
    "Crowd and stage energy",
    "Inside the room",
    "Lights down, hands up",
    "On the floor at Atlantis 3.0",
    "The crowd in full voice",
    "Stage-side moments",
    "From the third edition",
    "A night in Ikeja",
    "Closing out the third edition",
  ];

  for (let i = 2; i <= 10; i += 1) {
    const padded = String(i).padStart(2, "0");
    const caption = posters[i - 2];
    await prisma.media.upsert({
      where: { key: `atlantis-3-highlight-${padded}` },
      update: {
        src: `/media/videos/atlantis-3-highlight-${padded}.mp4`,
        poster: `/media/posters/atlantis-3-poster-${padded}.webp`,
        caption: `Atlantis 3.0 — ${caption}`,
        status: "APPROVED",
        type: "VIDEO",
        width: i === 9 ? 480 : 576,
        height: i === 9 ? 848 : 1024,
        durationSeconds: [0, 0, 6.6, 25.7, 17.1, 14.0, 14.2, 11.9, 21.7, 27.0, 32.9][i],
        sortOrder: i,
      },
      create: {
        key: `atlantis-3-highlight-${padded}`,
        editionId: editionBySlug["atlantis-3"].id,
        type: "VIDEO",
        src: `/media/videos/atlantis-3-highlight-${padded}.mp4`,
        poster: `/media/posters/atlantis-3-poster-${padded}.webp`,
        caption: `Atlantis 3.0 — ${caption}`,
        width: i === 9 ? 480 : 576,
        height: i === 9 ? 848 : 1024,
        durationSeconds: [0, 0, 6.6, 25.7, 17.1, 14.0, 14.2, 11.9, 21.7, 27.0, 32.9][i],
        status: "APPROVED",
        sortOrder: i,
      },
    });

    await prisma.media.upsert({
      where: { key: `atlantis-3-still-${padded}` },
      update: {
        src: `/media/posters/atlantis-3-poster-${padded}.webp`,
        caption: `Atlantis 3.0 — ${caption} (video still)`,
        status: "APPROVED",
        type: "IMAGE",
        width: 720,
        height: 1280,
        sortOrder: 20 + i,
      },
      create: {
        key: `atlantis-3-still-${padded}`,
        editionId: editionBySlug["atlantis-3"].id,
        type: "IMAGE",
        src: `/media/posters/atlantis-3-poster-${padded}.webp`,
        caption: `Atlantis 3.0 — ${caption} (video still)`,
        width: 720,
        height: 1280,
        status: "APPROVED",
        sortOrder: 20 + i,
      },
    });
  }

  // Flagged clip: stored outside the public web root, never served until approved.
  await prisma.media.upsert({
    where: { key: "atlantis-3-review-01" },
    update: {
      src: null,
      poster: null,
      status: "PENDING",
      storagePath: "storage/private/atlantis-3-clip-review-01.mp4",
    },
    create: {
      key: "atlantis-3-review-01",
      editionId: editionBySlug["atlantis-3"].id,
      type: "VIDEO",
      src: null,
      poster: null,
      caption: "Unverified 3.7s portrait clip — held for organizer review",
      width: 576,
      height: 1024,
      durationSeconds: 3.7,
      status: "PENDING",
      storagePath: "storage/private/atlantis-3-clip-review-01.mp4",
      sortOrder: 99,
    },
  });

  const stills = [
    {
      key: "atlantis-1-flyer",
      edition: "atlantis-1",
      src: "/media/images/atlantis-1-flyer.webp",
      caption: "Atlantis 1.0 — original flyer",
      width: 1052,
      height: 1280,
      sortOrder: 1,
    },
    {
      key: "atlantis-2-flyer",
      edition: "atlantis-2",
      src: "/media/images/atlantis-2-flyer.webp",
      caption: "Atlantis 2.0 — Christmas edition flyer",
      width: 1024,
      height: 1280,
      sortOrder: 1,
    },
    {
      key: "atlantis-2-lineup",
      edition: "atlantis-2",
      src: "/media/images/atlantis-2-lineup.webp",
      caption: "Atlantis 2.0 — lineup flyer (historic, not the 4.0 lineup)",
      width: 1024,
      height: 1280,
      sortOrder: 2,
    },
    {
      key: "atlantis-2-scotty",
      edition: "atlantis-2",
      src: "/media/images/atlantis-2-scotty-olorin.webp",
      caption: "Atlantis 2.0 — Scotty Olorin performer promo",
      width: 1010,
      height: 1280,
      sortOrder: 3,
    },
    {
      key: "atlantis-2-wavestar",
      edition: "atlantis-2",
      src: "/media/images/atlantis-2-wavestar.webp",
      caption: "Atlantis 2.0 — Wavestar performer promo",
      width: 960,
      height: 1280,
      sortOrder: 4,
    },
    {
      key: "atlantis-3-flyer",
      edition: "atlantis-3",
      src: "/media/images/atlantis-3-flyer.webp",
      caption: "Atlantis 3.0 — original flyer (reads AUG 18)",
      width: 1042,
      height: 1280,
      sortOrder: 1,
    },
    {
      key: "atlantis-4-flyer",
      edition: "atlantis-4",
      src: "/media/images/atlantis-4-flyer.webp",
      caption: "Atlantis 4.0 — Detty December flyer, December 30",
      width: 1024,
      height: 1280,
      sortOrder: 1,
    },
  ];

  for (const still of stills) {
    const data = {
      editionId: editionBySlug[still.edition].id,
      type: "IMAGE",
      src: still.src,
      caption: still.caption,
      width: still.width,
      height: still.height,
      status: "APPROVED",
      sortOrder: still.sortOrder,
    };
    await prisma.media.upsert({
      where: { key: still.key },
      update: data,
      create: { key: still.key, ...data },
    });
  }

  const ticketCategories = [
    { name: "Regular", priceNaira: 12000, channel: "ONLINE", sortOrder: 1 },
    { name: "VIP", priceNaira: 25000, channel: "ONLINE", sortOrder: 2 },
    { name: "Regular", priceNaira: 20000, channel: "GATE", sortOrder: 3 },
    { name: "VIP", priceNaira: 35000, channel: "GATE", sortOrder: 4 },
  ];

  for (const category of ticketCategories) {
    await prisma.ticketCategory.upsert({
      where: {
        eventId_name_channel: {
          eventId: event.id,
          name: category.name,
          channel: category.channel,
        },
      },
      update: {
        priceNaira: category.priceNaira,
        sortOrder: category.sortOrder,
        note: "Printed on the Atlantis 4.0 flyer — confirm the current price with Popout Tickets.",
        verified: false,
      },
      create: {
        eventId: event.id,
        ...category,
        note: "Printed on the Atlantis 4.0 flyer — confirm the current price with Popout Tickets.",
        verified: false,
      },
    });
  }

  const songs = [
    ["Lucid Dreams", "https://open.spotify.com/search/Lucid%20Dreams"],
    ["All Girls Are the Same", "https://open.spotify.com/search/All%20Girls%20Are%20the%20Same"],
    ["Robbery", "https://open.spotify.com/search/Robbery%20Juice%20WRLD"],
    ["Wishing Well", "https://open.spotify.com/search/Wishing%20Well%20Juice%20WRLD"],
    ["Legends", "https://open.spotify.com/search/Legends%20Juice%20WRLD"],
    ["Righteous", "https://open.spotify.com/search/Righteous%20Juice%20WRLD"],
  ];

  for (const [index, [title, officialUrl]] of songs.entries()) {
    await prisma.tributeSong.upsert({
      where: { title },
      update: { officialUrl, approved: true, linkStatus: "SEARCH_FALLBACK", sortOrder: index },
      create: {
        title,
        officialUrl,
        platform: "Spotify",
        approved: true,
        linkStatus: "SEARCH_FALLBACK",
        sortOrder: index,
      },
    });
  }

  const settings = [
    ["claimsOpen", "true"],
    ["tributeEnabled", "true"],
    ["ticketProvider", "Popout Tickets"],
  ];
  for (const [key, value] of settings) {
    await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  if (process.env.DEMO_MODE === "true") {
    const providerRef = "SANDBOX-ATP4-0001";
    const email = "demo.attendee@example.com";
    await prisma.ticketVerification.upsert({
      where: { providerRefHash: ticketRefHash(providerRef) },
      update: {
        status: "VERIFIED",
        purchaserEmailHash: emailHash(email),
        purchaserEmailMasked: maskEmail(email),
        orderRefHash: ticketRefHash(providerRef),
        orderRefLast4: last4(providerRef),
      },
      create: {
        eventId: event.id,
        provider: "popout",
        providerRefHash: ticketRefHash(providerRef),
        orderRefHash: ticketRefHash(providerRef),
        orderRefLast4: last4(providerRef),
        purchaserEmailHash: emailHash(email),
        purchaserEmailMasked: maskEmail(email),
        quantity: 1,
        status: "VERIFIED",
        source: "SANDBOX",
        verifiedAt: new Date(),
        rawPayload: JSON.stringify({
          sandbox: true,
          note: "Local demo verification record. Remove before production.",
        }),
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      actorEmail: admin.email,
      action: "SYSTEM_SEED",
      entity: "SYSTEM",
      metadata: JSON.stringify({ demoMode: process.env.DEMO_MODE === "true" }),
    },
  });

  console.log("Seed complete.");
  console.log(`Admin: ${admin.email}`);
  if (process.env.DEMO_MODE === "true") {
    console.log("Sandbox ticket: SANDBOX-ATP4-0001 / demo.attendee@example.com");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
