import { Metadata } from "next";
import { slugToCountry } from "@/utils/countrySlug";
import { DiplomacyClient } from "./DiplomacyClient";
import summaries from "@/data/country-summaries/summaries.json";

interface CountrySummary {
  country: string;
  summary: string;
  keyInterests: string[];
  alignments: string;
  generatedAt: string;
}

const summariesData = summaries as Record<string, CountrySummary>;

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

  const countrySummary = summariesData[countryName];
  const description = countrySummary?.alignments
    || `Explore ${countryName}'s diplomatic relationships, alliances, and geopolitical position on the interactive world map.`;

  return {
    title: `${countryName} - Global Relations Map | Mapdis`,
    description,
    alternates: {
      canonical: `https://www.mapdis.com/diplomacy/${slug}`,
    },
    openGraph: {
      title: `${countryName} - Global Relations Map`,
      description,
      url: `https://www.mapdis.com/diplomacy/${slug}`,
      siteName: "Mapdis",
      images: [{
        url: `https://www.mapdis.com/og/diplomacy/${slug}.jpg`,
        width: 1200,
        height: 630,
        alt: `${countryName} on the Global Relations Map`,
      }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${countryName} - Global Relations Map | Mapdis`,
      description,
      images: [`https://www.mapdis.com/og/diplomacy/${slug}.jpg`],
    },
  };
}

export default async function DiplomacyCountryPage({ params }: PageProps) {
  const { country: slug } = await params;
  const countryName = slugToCountry(slug);

  return <DiplomacyClient countryName={countryName} />;
}
