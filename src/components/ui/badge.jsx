import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

import { COLOR_MAP } from "@/app/useCountryStore";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-black border-2 border-l-0 bg-red-200 text-destructive shadow hover:bg-destructive/20 px-1",
        outline: "text-foreground",
        redCountry: "rounded-l-none border-transparent bg-white text-countryRed shadow hover:bg-countryRed/20",
        blueCountry: "rounded-l-none border-transparent bg-white text-countryBlue shadow hover:bg-countryBlue/20",
        neutralCountry: "rounded-l-none  border-transparent bg-white text-countryNeutral shadow hover:bg-countryNeutral/20",
        lock: "rounded-r-none border-black border-2 bg-white text-countryRed-foreground shadow hover:bg-gray-200 px-0",
        delete: "rounded-l-none border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
