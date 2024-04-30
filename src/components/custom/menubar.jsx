
import React from 'react';
import Link from 'next/link';

const MenuBar = () => {
  // Placeholder for future conditional styling logic

  const isLoggedIn = false

  return (
    <nav className="bg-primary text-primary-foreground text-sm font-medium p-6 pb-4 shadow border-b lg:border-b-2 mb-1 overscroll-none">
      <ul className="flex flex-wrap justify-between items-center">
        <div className="hidden md:flex space-x-4">
          <li>
            <Link className="hover:text-neutral-100" href="/">
              Home
            </Link>
          </li>
          <li>
            <Link className="hover:text-neutral-100" href="/multi">
              Multi
            </Link>
          </li>
          <li>
            <Link className="hover:text-neutral-100" href="/old">
              Old
            </Link>
          </li>
          <li>
            <Link className="hover:text-neutral-100" href="/prompt">
              Prompt
            </Link>
          </li>
        </div>
        <div className="flex md:hidden space-x-4">
          <li>
            <Link className="hover:text-neutral-100" href="/">
              Menu
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

