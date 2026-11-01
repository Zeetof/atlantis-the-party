export type EditionDetail = {
  time: string;
  features: string[];
  online: { name: string; price: string }[];
  gate: { name: string; price: string }[];
  source: string;
  highlight?: string;
};

export const EDITION_DETAILS: Record<string, EditionDetail> = {
  "atlantis-1": {
    time: "2:00 PM — 9:00 PM",
    features: [
      "Food and drinks",
      "DJs and hypemen",
      "Photo booth",
      "Tattoo artists",
      "Face painter",
      "Party games",
    ],
    online: [
      { name: "Regular", price: "₦7,000" },
      { name: "VIP", price: "₦12,000" },
    ],
    gate: [
      { name: "Regular", price: "₦9,000" },
      { name: "VIP", price: "₦15,000" },
    ],
    source:
      "Transcribed from the Atlantis 1.0 flyer. The year is not printed on the supplied artwork and is not assumed.",
    highlight: "The Beginning",
  },
  "atlantis-2": {
    time: "1:00 PM — 11:00 PM",
    features: [
      "Food and drinks",
      "Guest artists",
      "DJs and hypemen",
      "Piercing",
      "Party games",
      "Photo booth",
    ],
    online: [
      { name: "Regular", price: "₦8,000" },
      { name: "VIP", price: "₦12,000" },
    ],
    gate: [
      { name: "Regular", price: "₦10,000" },
      { name: "VIP", price: "₦15,000" },
    ],
    source:
      "Transcribed from the Atlantis 2.0 flyers. The year is not printed on the supplied artwork. This lineup belongs to the second edition only.",
    highlight: "The Evolution",
  },
  "atlantis-3": {
    time: "1:00 PM — 11:00 PM",
    features: [
      "Guest artists",
      "Pop-up",
      "Food and drinks",
      "Tattoos & piercings",
      "DJs n hypemen",
      "Photo booth",
    ],
    online: [
      { name: "Regular", price: "₦12,000" },
      { name: "VIP", price: "₦25,000" },
    ],
    gate: [
      { name: "Regular", price: "₦20,000" },
      { name: "VIP", price: "₦30,000" },
    ],
    source:
      "Transcribed from the Atlantis 3.0 flyer. The organizer dates this edition August 19; the flyer reads AUG 18. The discrepancy remains flagged for review.",
    highlight: "The Experience",
  },
};
