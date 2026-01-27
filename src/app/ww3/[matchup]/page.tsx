import { Metadata } from "next";
import { parseMatchupSlug, generateMatchupTitle } from "@/utils/conflictSlug";
import { WW3MatchupClient } from "./WW3MatchupClient";
import { DataUpdateBanner } from "../../components/DataUpdateBanner";
import { MapVariantNav } from "@/components/custom/MapVariantNav";
import { WW3MapInstructions } from "../mapInstructions";

interface PageProps {
  params: Promise<{ matchup: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { matchup: slug } = await params;
  const matchup = parseMatchupSlug(slug);

  if (!matchup) {
    return {
      title: "Scenario Not Found | Mapdis",
      description: "This WW3 scenario could not be found.",
    };
  }

  const title = generateMatchupTitle(matchup);

  return {
    title: `${title} - WW3 Map | Mapdis`,
    description: `Explore the World War 3 scenario: ${title}. See how global alliances would cascade and nations would choose sides in this hypothetical WW3 conflict.`,
    alternates: {
      canonical: `https://www.mapdis.com/ww3/${slug}`,
    },
    openGraph: {
      title: `${title} - WW3 Map`,
      description: `WW3 scenario: ${title}. See how alliances would cascade globally.`,
      url: `https://www.mapdis.com/ww3/${slug}`,
      siteName: "Mapdis",
      images: [{
        url: "https://www.mapdis.com/warimage.png",
        width: 800,
        height: 600,
        alt: `${title} WW3 Map`,
      }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - WW3 Map | Mapdis`,
      description: `WW3 scenario: ${title}. Explore alliance cascades.`,
      images: ["https://www.mapdis.com/warimage.png"],
    },
  };
}

export default async function WW3MatchupPage({ params }: PageProps) {
  const { matchup: slug } = await params;
  const matchup = parseMatchupSlug(slug);

  return (
    <div className="transition ease-in-out whole-container h-full w-screen">
      <DataUpdateBanner />
      <MapVariantNav />
      <div>
        <WW3MatchupClient matchup={matchup} />
      </div>
      <WW3MapInstructions />
    </div>
  );
}
