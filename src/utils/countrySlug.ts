import countries from "@/app/countries.json";

// Build a lookup map from slug to country name
const slugToCountryMap: Map<string, string> = new Map();

// Convert country name to URL-friendly slug
export function countryToSlug(country: string): string {
  return country
    .toLowerCase()
    .replace(/['']/g, "") // Remove apostrophes
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

// Initialize the lookup map
countries.forEach((country) => {
  const slug = countryToSlug(country);
  slugToCountryMap.set(slug, country);
});

// Convert slug back to country name, returns null if not found
export function slugToCountry(slug: string): string | null {
  return slugToCountryMap.get(slug.toLowerCase()) ?? null;
}
