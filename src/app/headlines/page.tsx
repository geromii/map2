import { preloadQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { HeadlinesClient } from "./HeadlinesClient";

// Revalidate every 60 seconds - new headlines appear within a minute
export const revalidate = 60;

export default async function HeadlinesPage() {
  // Preload data on the server - this makes the initial render instant
  const preloadedFeatured = await preloadQuery(api.headlines.getFeaturedHeadlines);
  const preloadedActive = await preloadQuery(api.headlines.getActiveHeadlines);

  return (
    <HeadlinesClient
      preloadedFeatured={preloadedFeatured}
      preloadedActive={preloadedActive}
    />
  );
}
