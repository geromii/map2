import { fetchQuery, preloadQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { ScenarioDetailClient } from "./ScenarioDetailClient";
import type { Metadata } from "next";

// Revalidate every 6 hours - scenarios never change after creation
export const revalidate = 21600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const issue = await fetchQuery(api.issues.getIssueBySlug, { slug });

  if (!issue) {
    return { title: "Scenario Not Found" };
  }

  return {
    title: issue.title,
    description: issue.description,
    openGraph: {
      title: issue.title,
      description: issue.description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: issue.title,
      description: issue.description,
    },
  };
}

export default async function ScenarioDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const preloadedIssue = await preloadQuery(api.issues.getIssueBySlug, { slug });

  return <ScenarioDetailClient slug={slug} preloadedIssue={preloadedIssue} />;
}
