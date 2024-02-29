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
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        redCountry: "rounded-l-none border-transparent bg-countryRed text-countryRed-foreground shadow hover:bg-countryRed/80",
        blueCountry: "rounded-l-none border-transparent bg-countryBlue text-countryBlue-foreground shadow hover:bg-countryBlue/80",
        neutralCountry: "rounded-l-none  border-transparent bg-countryNeutral text-countryNeutral-foreground shadow hover:bg-countryNeutral/80",
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
