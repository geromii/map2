import "./globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react"
import  MenuBar from "@/components/custom/menubar"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Global Relations Map",
  description:
    "An interactive map that displays the diplomatic relations of the world.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <div className="">
        <MenuBar/>
        </div>
        {children}
        <Analytics />
      </body>
    </html>
  );
}