import { Metadata } from "next";
import { parseMatchupSlug, generateMatchupTitle } from "@/utils/conflictSlug";
import { ConflictMatchupClient } from "./ConflictMatchupClient";
import { DataUpdateBanner } from "../../components/DataUpdateBanner";
import { MapVariantNav } from "@/components/custom/MapVariantNav";
import { MapInstructions } from "../mapInstructions";

interface PageProps {
  params: Promise<{ matchup: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { matchup: slug } = await params;
  const matchup = parseMatchupSlug(slug);

  if (!matchup) {
    return {
      title: "Matchup Not Found | Mapdis",
      description: "This conflict scenario could not be found.",
    };
  }

  const title = generateMatchupTitle(matchup);

  return {
    title: `${title} - Conflict & Geopolitics Map | Mapdis`,
    description: `Explore the geopolitical conflict scenario: ${title}. See how alliances would align and which countries would support each side.`,
    alternates: {
      canonical: `https://www.mapdis.com/conflict/${slug}`,
    },
    openGraph: {
      title: `${title} - Conflict Map`,
      description: `Explore the geopolitical conflict: ${title}. Visualize alliance alignments.`,
      url: `https://www.mapdis.com/conflict/${slug}`,
      siteName: "Mapdis",
      images: [{
        url: "https://www.mapdis.com/singleimage.png",
        width: 800,
        height: 600,
        alt: `${title} Conflict Map`,
      }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - Conflict Map | Mapdis`,
      description: `Explore the geopolitical conflict: ${title}.`,
      images: ["https://www.mapdis.com/singleimage.png"],
    },
  };
}

export default async function ConflictMatchupPage({ params }: PageProps) {
  const { matchup: slug } = await params;
  const matchup = parseMatchupSlug(slug);

  return (
    <div className="transition ease-in-out whole-container h-full w-screen">
      <DataUpdateBanner />
      <MapVariantNav />
      <div>
        <ConflictMatchupClient matchup={matchup} />
      </div>
      <MapInstructions />
    </div>
  );
}
