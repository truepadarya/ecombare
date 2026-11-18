import { media } from "@/data/media";

type CaseDetail = {
  id: string;
  title: string;
  date: string;
  dateLabel: string;
  summary: string;
  cover: ImageMetadata;
  coverPosition?: string;
  logo: ImageMetadata | string;
  logoWidth?: number;
  invertLogo?: boolean;
  badge?: { image: ImageMetadata; label: string; width?: number };
  statistics: { value: string; label: string }[];
  sections: { title: string; paragraphs?: string[]; items?: string[] }[];
  gallery: { image: ImageMetadata; position?: string }[];
};

export const caseDetails = {
  brainrocket: {
    id: "brainrocket",
    title: "BrainRocket village restoration project",
    date: "2025-05",
    dateLabel: "May 2025",
    summary:
      "A full-day community restoration event in one of Cyprus's historic villages — bringing a company team outside the office and into something that actually needed them",
    cover: media.caseBrainrocketCover.src,
    logo: media.brainrocketWhiteLogo.src,
    logoWidth: 20.68225,
    badge: {
      image: media.caseBrainrocketBadge.src,
      label: "200+ participants",
    },
    statistics: [
      { value: "200+", label: "trees and shrubs planted" },
      { value: "5", label: "art installations created" },
      { value: "1", label: "historic village transformed" },
    ],
    sections: [
      {
        title: "What we did:",
        items: [
          "Tree and shrub planting",
          "Mural creation on a restored building",
          "Land art installation at the Geology Museum",
          "Mosaic and photo cutout board for the Knights Museum",
          "Stone art for the Geo Museum",
          "Village cleanup",
        ],
      },
      {
        title: "Why it matters:",
        paragraphs: [
          "BrainRocket didn't just show up — they left something permanent. Every installation is still there.",
        ],
      },
    ],
    gallery: [
      { image: media.caseBrainrocketArtWorkshop.src, position: "62.3% center" },
      { image: media.caseBrainrocketVolunteer.src },
      { image: media.caseBrainrocketPainting.src, position: "62.3% center" },
      { image: media.caseBrainrocketInstallation.src },
    ],
  },
  dashin: {
    id: "dashin",
    title: "Dashin Foundation Groasis Waterboxx pilot",
    date: "2024-11",
    dateLabel: "November 2024",
    summary:
      "Pilot launch of Groasis Waterboxx technology in Cyprus — restoring a mountain slope damaged by the 2021 wildfire, as part of the Back To The Roots festival. Delivered in partnership with the Cyprus Forestry Department and the Municipality of Arakapas",
    cover: media.caseDashinCover.src,
    coverPosition: "center 61.95%",
    logo: media.caseDashinPanelLogo.src,
    logoWidth: 12.4896,
    badge: {
      image: media.caseDashinBadge.src,
      label: "Pilot launch of Groasis Waterboxx",
      width: 34.75,
    },
    statistics: [
      { value: "100", label: "plants with Waterboxx" },
      { value: "50", label: "plants without Waterboxx" },
    ],
    sections: [
      {
        title: "What we did:",
        paragraphs: [
          "Planted 100 endemic species using Groasis Waterboxx technology and 50 without — a side-by-side comparison to generate real survival data for Cypriot conditions. Trained volunteers in long-term monitoring",
        ],
      },
      {
        title: "Why it matters:",
        paragraphs: [
          "This pilot didn't just plant trees — it proved the technology works on Cypriot soil. That data now shapes how ECOmbare trains event managers and selects species for every planting since, including the Souni project with Playrix",
        ],
      },
    ],
    gallery: [
      { image: media.caseDashinWaterboxxCarrying.src },
      { image: media.caseDashinChildPlanting.src },
      { image: media.caseDashinWaterboxxCovers.src },
      { image: media.caseDashinPilotHillside.src },
    ],
  },
  "grow-love": {
    id: "grow-love",
    title: "Grow Love personalized tree gifting program",
    date: "2025-02",
    dateLabel: "February 2025",
    summary:
      "“Grow Love” — a personalized tree gifting program for both companies and individuals, planted using Groasis Waterboxx technology across three Cypriot villages",
    cover: media.caseGrowLoveCover.src,
    coverPosition: "center 73.18%",
    logo: media.caseCommunityMark.src,
    logoWidth: 6.3467,
    invertLogo: true,
    badge: {
      image: media.caseGrowLoveBadge.src,
      label: "Personalized Tree Gifting Program",
    },
    statistics: [
      {
        value: "300+",
        label: "trees planted using Groasis Waterboxx technology",
      },
      { value: "100%", label: "survival rate" },
    ],
    sections: [
      {
        title: "What we did:",
        paragraphs: [
          "Launched personalized tree certificates — B2B and B2C — where each tree is planted in someone's name and dedicated to a person or moment that matters. Introduced a shared responsibility model: people don't just plant and walk away, they return to care for their tree in the years that follow, while we send updates and growth reports. Partnered with the Together Forever Foundation on a joint certificate that supports both nature restoration and children with neurological conditions",
        ],
      },
      {
        title: "Why it matters:",
        paragraphs: [
          "This is the proof that environmental impact and personal meaning aren't separate things. People come back. Trees survive. And every certificate carries a story — sometimes two.",
        ],
      },
    ],
    gallery: [
      { image: media.caseGrowLoveFamily.src },
      { image: media.caseGrowLoveMotherChild.src, position: "center 12.38%" },
      { image: media.caseGrowLoveLakeside.src },
      { image: media.caseGrowLoveTreeCare.src },
    ],
  },
  playrix: {
    id: "playrix",
    title: "Playrix reforestation project",
    date: "2026-05",
    dateLabel: "May 2026",
    summary:
      "First Groasis Waterboxx pilot reforestation on fire-affected land in Cyprus — launched 10 months after the July 2025 wildfire that burned 125 km² and destroyed 43 homes",
    cover: media.casePlayrixCover.src,
    logo: media.playrixWhiteLogo.src,
    badge: {
      image: media.casePlayrixTwoDaysBadge.src,
      label: "Two days with Playrix",
    },
    statistics: [
      { value: "640", label: "Endemic plants" },
      { value: "10", label: "Tree species" },
      { value: "5", label: "Shrub species" },
    ],
    sections: [
      {
        title: "What we did:",
        paragraphs: [
          "320 Waterboxx units installed across a fire-damaged hillside. Each unit: 1 endemic tree + 1 shrub. Soil treated with zeolite and mycorrhizal inoculation to restore what the fire destroyed underground. Every plant registered with GPS + QR code for long-term monitoring",
        ],
      },
      {
        title: "Why it matters:",
        paragraphs: [
          "This is a live research project — not a one-day event. The survival data generated here will shape island-wide reforestation strategy for years to come",
        ],
      },
    ],
    gallery: [
      { image: media.casePlayrixPlantingDetail.src, position: "62.3% center" },
      { image: media.casePlayrixWaterboxxUnits.src },
      {
        image: media.casePlayrixReforestationHillside.src,
        position: "62.3% center",
      },
      { image: media.casePlayrixWaterboxxPreparation.src },
    ],
  },
} satisfies Record<string, CaseDetail>;

export type CaseDetailId = keyof typeof caseDetails;
export type { CaseDetail };

// Plaque IDs are independent of content IDs so artwork and content can evolve.
export const casePopupByPlaque = {
  brainrocket: "brainrocket",
  dashin: "dashin",
  playrix: "playrix",
  community: "grow-love",
} satisfies Record<string, CaseDetailId>;

export const caseModalId = (id: CaseDetail["id"]) => `case-detail-${id}`;
