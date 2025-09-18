"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MenuBar = () => {
  const pathname = usePathname();
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const linkRefs = useRef({ desktop: {}, mobile: {} }); // Separate refs for desktop and mobile
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };


  const updateIndicator = () => {
    const isMobile = window.innerWidth < 1024;
    const activeLinkRef = isMobile ? linkRefs.current.mobile[pathname] : linkRefs.current.desktop[pathname];
    
    if (activeLinkRef) {
      // Calculate the position and width of the active link
      const { offsetLeft, offsetWidth, offsetTop, offsetHeight } = activeLinkRef;
      // Position the indicator directly below the active link
      setIndicatorStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
        top: `${offsetTop + offsetHeight + 2}px`,
      });
    }
  };

  // Update the indicator on pathname changes and window resize
  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [pathname]);

  // Function to store references for links
  const storeLinkRef = (path, isMobile) => (element) => {
    if (isMobile) {
      linkRefs.current.mobile[path] = element;
    } else {
      linkRefs.current.desktop[path] = element;
    }
  };

  return (
    <nav className="relative bg-primary text-primary-foreground text-sm font-medium p-6 pb-4 shadow lg:border-b-2 overscroll-none min-h-12">
      <div className="hidden lg:flex flex-wrap justify-between items-center relative">
        <div className="absolute flex left-0 space-x-4 overflow-visible w-[100%] lg:w-auto">
          <div>
            <Link ref={storeLinkRef("/diplomacy", false)} href="/diplomacy">
              Single Country Mode
            </Link>
          </div>
          <div>
            <Link ref={storeLinkRef("/conflict", false)} href="/conflict">
              Conflict Mode
            </Link>
          </div>
        </div>
        <div className="hidden text-center m-auto text-xl lg:block font-arvo">Global Relations Map</div>
        {/* Indicator bar */}
        <div
          className="absolute h-[3px] bg-yellow-400 transition-all duration-300"
          style={{
            ...indicatorStyle,
            position: "absolute",
          }}
        />
      </div>
      <div className="lg:hidden">
        <div className="flex flex-row justify-between items-center">
          <button onClick={toggleMenu} className="text-primary-foreground hidden">
            <svg className="w-6 h-6 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
            </svg>
          </button>
          <div className="lg:hidden">
            <Link ref={storeLinkRef("/diplomacy", true)} className="" href="/diplomacy">
              Single Mode
            </Link>
          </div>
          <div className="lg:hidden">
            <Link ref={storeLinkRef("/conflict", true)} href="/conflict">
              Conflict Mode
            </Link>
          </div>
          <div className="text-base text-slate-400 font-arvo ml-16">mapdis</div>
          <div
            className="absolute h-[3px] bg-yellow-400 transition-all duration-300"
            style={{
              ...indicatorStyle,
              position: "absolute",
            }}
          />
        </div>
        <div className={`transition-all duration-300 ${isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}>
          <div className="flex flex-col p-4 space-y-2">
            <a href="#" className="text-primary-foreground hover:text-primary-700">
              Home
            </a>
            <a href="#" className="text-primary-foreground hover:text-primary-700">
              About
            </a>
            <a href="#" className="text-primary-foreground hover:text-primary-700">
              Services
            </a>
            <a href="#" className="text-primary-foreground hover:text-primary-700">
              Contact
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MenuBar;
