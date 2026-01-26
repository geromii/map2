import { Metadata } from "next";
import { slugToCountry } from "@/utils/countrySlug";
import { DiplomacyClient } from "./DiplomacyClient";

interface PageProps {
  params: Promise<{ country: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country: slug } = await params;
  const countryName = slugToCountry(slug);

  if (!countryName) {
    return {
      title: "Country Not Found | Mapdis",
      description: "This country could not be found in our database.",
    };
  }

  return {
    title: `${countryName} - Global Relations Map | Mapdis`,
    description: `Explore ${countryName}'s diplomatic relationships, alliances, and geopolitical position on the interactive world map.`,
    alternates: {
      canonical: `https://www.mapdis.com/diplomacy/${slug}`,
    },
    openGraph: {
      title: `${countryName} - Global Relations Map`,
      description: `Explore ${countryName}'s diplomatic relationships and geopolitical position.`,
      url: `https://www.mapdis.com/diplomacy/${slug}`,
      siteName: "Mapdis",
      images: [{
        url: "https://www.mapdis.com/singleimage.png",
        width: 800,
        height: 600,
        alt: `${countryName} on the Global Relations Map`,
      }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${countryName} - Global Relations Map | Mapdis`,
      description: `Explore ${countryName}'s diplomatic relationships and geopolitical position.`,
      images: ["https://www.mapdis.com/singleimage.png"],
    },
  };
}

export default async function DiplomacyCountryPage({ params }: PageProps) {
  const { country: slug } = await params;
  const countryName = slugToCountry(slug);

  return <DiplomacyClient countryName={countryName} />;
}
