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
  title: "Geopolitical Opinions Map",
  description:
    "An interactive map that displays the geopolitical opinions of the world.",
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