"use client"

import { Badge } from "@/components/ui/badge"
import { IconLock, IconLockOpen, IconTrash } from '@tabler/icons-react';
import { useState } from "react";

export function CountryBadge({ country, color }) {
    const [isLocked, setIsLocked] = useState(false);
    
    const handleClick = () => {
        setIsLocked(!isLocked);
    }

    const lockBadgeClass = `h-6 overflow-hidden flex-shrink-0 border-2 bg-white`;
    return (
        <div class="flex items-center">
        <Badge 
            variant={"lock"} 
            onClick={handleClick} 
            className={lockBadgeClass}>
            {isLocked ? <IconLock color="black" className="p-0.5"/> : <IconLockOpen color="black" className="p-0.5" />}
        </Badge>
        <Badge 
            variant={"redCountry"} 
            onClick={handleClick} 
            className="h-6 flex-shrink-0 rounded-none px-0.5 border-black border-t-2 border-b-2 border-l-0 border-r-2 bg-white text-countryRed">
            {'United States'} {/* Use the country prop */}
        </Badge>
        <Badge 
         variant = {"destructive"}
        onClick={handleClick}
        className="h-6 flex-shrink-0 rounded-l-none px-0.5 bg-white">
        <IconTrash color="red" className="p-0.5 " />
        </Badge>

    </div>
    )


}


