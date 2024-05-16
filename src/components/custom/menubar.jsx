"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "src/utils/supabase/client";
import { IconX } from "@tabler/icons-react";

const MenuBar = () => {
  const pathname = usePathname();
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const linkRefs = useRef({}); // To store references to link elements
  const [user, setUser] = useState(null); // Add user state
  const [loading, setLoading] = useState(true); // Add loading state
  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getSession(); // Fetch session info
      if (data?.session?.user) {
        setUser(data.session.user); // If user exists, set state
      }
      setLoading(false); // Set loading state to false once complete
    }

    fetchUser(); // Invoke the async function to fetch session data
  }, []);

  const updateIndicator = () => {
    const activeLinkRef = linkRefs.current[pathname];
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

  // Update the indicator on pathname changes
  useEffect(() => {
    updateIndicator();
  }, [pathname]);

  // Function to store references for links
  const storeLinkRef = (path) => (element) => {
    linkRefs.current[path] = element;
  };


  const linkStyle = "hover:text-neutral-100";
  const listItemStyle = (path) =>
    pathname === path ? "text-neutral-100" : "";

  return (
    <nav className="relative bg-primary text-primary-foreground text-sm font-medium p-6 pb-4 shadow border-b lg:border-b-2  overscroll-none min-h-12">
      <ul className="flex flex-wrap justify-between items-center relative">
        <div className="absolute flex left-0  space-x-4 overflow-visible w-[100%] lg:w-auto">
          <li className={listItemStyle("/")}>
            <Link
              ref={storeLinkRef("/")}
              className={linkStyle}
              href="/"
            >
              Single Country Mode
            </Link>
          </li>
          <li className={listItemStyle("/conflict")}>
            <Link
              ref={storeLinkRef("/conflict")}
              className={linkStyle}
              href="/conflict"
            >
              Conflict Mode
            </Link>
          </li>
        </div>
        <div className="hidden text-center m-auto text-xl lg:block font-arvo">
          Global Relations Map
        </div>
        {loading ? (
        <div className = "absolute right-0"></div>
      ) : user ? (
        <div className = "absolute right-0">Logged in</div>
      ) : (
        <div className = "absolute right-0"></div>
      )}
        {/* Indicator bar */}
        <div
          className="absolute h-[3px] bg-yellow-400 transition-all duration-300"
          style={{
            ...indicatorStyle,
            position: "absolute",
          }}
        />
      </ul>
    </nav>
  );
};

export default MenuBar;
