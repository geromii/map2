import "./globals.css";
import { Inter as FontSans, Arvo as FontArvo } from "next/font/google";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import MenuBar from "@/components/custom/menubar";
import { SpeedInsights } from "@vercel/speed-insights/next"
import Script from "next/script";

// Import the Inter font (default)
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Import the Arvo font
const fontArvo = FontArvo({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-arvo",
});

export const metadata = {
  title: "Global Relations Map - Mapdis",
  description: "Explore the world's diplomatic relationships and alliances through an interactive map. Create scenarios to see maps of how the world reacts to potential conflicts and wars.",
  keywords: "geopolitics, world map, international relations, diplomacy, conflicts, alliances, global politics, interactive map",
  canonical: "https://www.mapdis.com",
  openGraph: {
    title: "Global Relations Map - Mapdis",
    description: "Interactive geopolitics map maker",
    url: "https://www.mapdis.com",
    siteName: "Mapdis",
    images: [{
      url: "https://www.mapdis.com/singleimage.png",
      width: 800,
      height: 600,
      alt: "Global Relations Interactive Map",
    }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Relations Map - Mapdis",
    description: "Interactive geopolitics map maker",
    images: ["https://www.mapdis.com/singleimage.png"],
  },
};

// Explore the world's diplomatic relationships and alliances through an interactive map. Dive into the net relationship scores of every country and visualize theoretical conflict scenarios that reveal potential global alliances. A captivating platform for the well-read, curious minds interested in global politics and international relations.

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=10.0, user-scalable=yes" />
        
        <link rel="preload" href="/map_design_2025_08.json" as="fetch" crossOrigin="anonymous" />
        
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KSKH6FD6PY"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KSKH6FD6PY');
          `}
        </Script>
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable, 
          fontArvo.variable
        )}
      >
        <div className="">
          <MenuBar />
        </div>

        {children}
        <Analytics />
        <div className = "flex flex-col items-center bg-slate-200 max-w-100vw" >
        <p className="text-xs  my-2"> 
          Made by Jeremy Russell (<a href="https://twitter.com/geromi_" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">X/Twitter</a>, <a href="https://www.reddit.com/user/RagtagJack" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Reddit</a>), 2024. 
        </p>
        <p className="text-xs mb-2">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLScCY1IVKzNa9fM46kAcJUWT0zvLA99NnbDozmU1qZ8ZhwYg0w/viewform" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
            Please share your feedback (takes 15 seconds)
          </a>
        </p>
        </div>
        <SpeedInsights />
      </body>
    </html>
  );
}
