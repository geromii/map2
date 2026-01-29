import { fetchQuery, preloadQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { HeadlineDetailClient } from "./HeadlineDetailClient";
import type { Metadata } from "next";

// Revalidate every 6 hours - headlines never change after creation
export const revalidate = 21600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate SEO metadata server-side
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const headline = await fetchQuery(api.headlines.getHeadlineBySlug, { slug });

  if (!headline) {
    return {
      title: "Headline Not Found",
    };
  }

  // Get image URL if available
  let imageUrl: string | undefined;
  if (headline.imageId) {
    imageUrl = await fetchQuery(api.headlines.getHeadlineImageUrl, { headlineId: headline._id }) ?? undefined;
  }

  return {
    title: headline.title,
    description: headline.description,
    openGraph: {
      title: headline.title,
      description: headline.description,
      type: "article",
      ...(imageUrl && { images: [{ url: imageUrl }] }),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: headline.title,
      description: headline.description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

// Preload data server-side and pass to client for instant hydration
export default async function HeadlineDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Preload headline data - client will hydrate instantly with this
  const preloadedHeadline = await preloadQuery(api.headlines.getHeadlineBySlug, { slug });

  return <HeadlineDetailClient slug={slug} preloadedHeadline={preloadedHeadline} />;
}
