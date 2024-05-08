"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MenuBar = () => {
  const pathname = usePathname();
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const [environment, setEnvironment] = useState(""); // Add environment state
  const linkRefs = useRef({}); // To store references to link elements
  const [displayEnvironment, setDisplayEnvironment] = useState(false);

  const updateIndicator = () => {
    const activeLinkRef = linkRefs.current[pathname];
    if (activeLinkRef) {
      // Calculate the position and width of the active link
      const { offsetLeft, offsetWidth } = activeLinkRef;
      setIndicatorStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
      });
    }
  };

  // Update the indicator on pathname changes
  useEffect(() => {
    updateIndicator();
  }, [pathname]);

  // Function to store references for links
  const storeLinkRef = (path) => (element) => {
    linkRefs.current[path] = element;
  };

  // Determine environment (localhost or production)
  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname === "localhost") {
      setEnvironment("Development (localhost:3000)");
    } else if (hostname === "mapdis.com") {
      setEnvironment("mapdis");
      setDisplayEnvironment(true);
    } else {
      setEnvironment(`Custom Environment (${hostname})`);
    }
  }, []);

  const linkStyle = "hover:text-neutral-100";
  const listItemStyle = (path) =>
    pathname === path ? "text-neutral-100" : "";

  return (
    <nav className="relative bg-primary text-primary-foreground text-sm font-medium p-6 pb-4 shadow border-b lg:border-b-2 mb-1 overscroll-none">
      <ul className="flex flex-wrap justify-between items-center relative">
        <div className="flex md:flex space-x-4">
          <li className={listItemStyle("/")}>
            <Link
              ref={storeLinkRef("/")}
              className={linkStyle}
              href="/"
            >
              Single Country Mode
            </Link>
          </li>
          <li className={listItemStyle("/multi")}>
            <Link
              ref={storeLinkRef("/multi")}
              className={linkStyle}
              href="/multi"
            >
              Conflict Mode
            </Link>
          </li>
        </div>
        {/* Display environment */}
        {displayEnvironment && (
          <div className="ml-auto text-sm text-gray-400">
            {environment}
          </div>
        )}
        {/* Indicator bar */}
        <div
          className="absolute bottom-0 h-[3px] bg-yellow-400 transition-all duration-300"
          style={indicatorStyle}
        />
      </ul>
    </nav>
  );
};

export default MenuBar;
