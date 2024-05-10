import "./globals.css";
import { Inter as FontSans, Arvo as FontArvo } from "next/font/google";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import MenuBar from "@/components/custom/menubar";

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
  title: "Global Relations Map",
  description: "Explore the world's diplomatic relationships and alliances through an interactive map. Create scenarios to see maps of how the world reacts to potential conflicts and wars.",
};

// Explore the world's diplomatic relationships and alliances through an interactive map. Dive into the net relationship scores of every country and visualize theoretical conflict scenarios that reveal potential global alliances. A captivating platform for the well-read, curious minds interested in global politics and international relations.

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
        <div className = "flex flex-col items-center bg-slate-300 bottom-0" >
        <p className="text-xs  my-2">Made by Jeremy Russell, 2024. <a href="https://twitter.com/geromi_" target="_blank" rel="noopener noreferrer" className="text-blue-500  hover:text-blue-700 visited:text-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-300 mx-1">@geromi_</a>   on Twitter/X (send me a message!).
        <br/> Based in London/Toronto, and very interested in meeting other developers. </p>
        </div>
      </body>
    </html>
  );
}
