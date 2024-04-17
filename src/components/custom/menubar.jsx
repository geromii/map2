import React from 'react';
import Link from 'next/link';

const MenuBar = () => {
  // Placeholder for future conditional styling logic
  const isLoggedIn = false; // This will be replaced with actual logic to check if user is logged in

  return (
    <nav className="bg-black text-neutral-300 text-sm font-medium  p-6 shadow mb-1">
      <ul className="flex flex-wrap justify-between items-center">
        <div className="hidden md:flex space-x-4 ">
          <li>
            <Link className="hover:text-neutral-100" href="/">
              Home
            </Link>
          </li>
          <li>
            <Link className="hover:text-neutral-100" href="/ww3">
              WW3
            </Link>
          </li>
          <li>
            <Link className="hover:text-neutral-100" href="/services">
              Services
            </Link>
          </li>
          <li>
            <Link className="hover:text-neutral-100" href="/contact">
              Contact
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
                  Sign in 
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

