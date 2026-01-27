import { countryToSlug, slugToCountry } from "./countrySlug";

export interface ConflictMatchup {
  blueCountries: string[];
  redCountries: string[];
}

/**
 * Parse a matchup slug like "usa-vs-russia" or "usa_uk-vs-russia_china"
 * Uses underscore to separate countries on the same side (cleaner than commas)
 * Returns null if invalid
 */
export function parseMatchupSlug(slug: string): ConflictMatchup | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2) return null;

  const [bluePart, redPart] = parts;
  if (!bluePart || !redPart) return null;

  // Split by underscore for multiple countries on same side
  const blueSlugs = bluePart.split("_").map((s) => s.trim()).filter(Boolean);
  const redSlugs = redPart.split("_").map((s) => s.trim()).filter(Boolean);

  if (blueSlugs.length === 0 || redSlugs.length === 0) return null;

  const blueCountries: string[] = [];
  const redCountries: string[] = [];

  for (const slug of blueSlugs) {
    const country = slugToCountry(slug);
    if (!country) return null;
    blueCountries.push(country);
  }

  for (const slug of redSlugs) {
    const country = slugToCountry(slug);
    if (!country) return null;
    redCountries.push(country);
  }

  return { blueCountries, redCountries };
}

/**
 * Generate a matchup slug from country arrays
 * Uses underscore to separate countries on the same side
 */
export function generateMatchupSlug(blueCountries: string[], redCountries: string[]): string {
  const bluePart = blueCountries.map(countryToSlug).join("_");
  const redPart = redCountries.map(countryToSlug).join("_");
  return `${bluePart}-vs-${redPart}`;
}

/**
 * Generate a human-readable title for the matchup
 */
export function generateMatchupTitle(matchup: ConflictMatchup): string {
  const formatSide = (countries: string[]) => {
    if (countries.length === 1) return countries[0];
    if (countries.length === 2) return `${countries[0]} & ${countries[1]}`;
    return `${countries.slice(0, -1).join(", ")} & ${countries[countries.length - 1]}`;
  };

  return `${formatSide(matchup.blueCountries)} vs ${formatSide(matchup.redCountries)}`;
}
