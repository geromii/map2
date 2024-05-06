"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MenuBar = () => {
  const isLoggedIn = false;
  const pathname = usePathname();
  console.log(pathname);

  // Function to determine the class for the active parent <li>
  const listItemStyle = (path) => {
    return pathname === path
      ? "border-b-2 border-yellow-400"
      : "";
  };

  const linkStyle = "hover:text-neutral-100";

  return (
    <nav className="bg-primary text-primary-foreground text-sm font-medium p-6 pb-4 shadow border-b lg:border-b-2 mb-1 overscroll-none">
      <ul className="flex flex-wrap justify-between items-center">
        <div className="hidden md:flex space-x-4">
          <li className={listItemStyle("/")}>
            <Link className={linkStyle} href="/">
              Single Country Mode
            </Link>
          </li>
          <li className={listItemStyle("/multi")}>
            <Link className={linkStyle} href="/multi">
              Conflict Mode
            </Link>
          </li>
          <li className={listItemStyle("/old")}>
            <Link className={linkStyle} href="/old">
              Old
            </Link>
          </li>
          <li className={listItemStyle("/prompt")}>
            <Link className={linkStyle} href="/prompt">
              Prompt
            </Link>
          </li>
        </div>
        <div className="flex md:hidden space-x-4">
          <li className={listItemStyle("/")}>
            <Link className={linkStyle} href="/">
              Single Country Mode
            </Link>
          </li>
          <li className={listItemStyle("/multi")}>
            <Link className={linkStyle} href="/multi">
              Conflict Mode
            </Link>
          </li>
        </div>
        <div className="hidden md:flex space-x-4">
          {isLoggedIn ? (
            <>
              <li>
                <Link className="hover:text-neutral-100" href="/signout">
                  Sign Out
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link className="hover:text-neutral-100" href="/signin">
                  Login
                </Link>
              </li>
              <li>
                <Link className="hover:text-neutral-100" href="/signup">
                  Sign up
                </Link>
              </li>
            </>
          )}
        </div>
      </ul>
    </nav>
  );
};

export default MenuBar;
