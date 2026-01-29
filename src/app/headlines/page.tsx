import { preloadQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { HeadlinesClient } from "./HeadlinesClient";

// Revalidate every 6 hours - headlines rarely change
export const revalidate = 21600;

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
