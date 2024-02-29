"use client"

import { Badge } from "@/components/ui/badge"
import { IconLock, IconLockOpen,  } from '@tabler/icons-react';
import { useState } from "react";

export function CountryBadge({ country, color }) {
    const [isLocked, setIsLocked] = useState(false);
    
    const handleClick = () => {
        setIsLocked(!isLocked);
    }
    return (
        <Badge variant={"redCountry"} onClick={handleClick}>
            {country}
            {isLocked ? <IconLock /> : <IconLockOpen />}
        </Badge>
    )


}


