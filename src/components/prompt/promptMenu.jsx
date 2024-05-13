"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "src/utils/supabase/client";
import { IconMenu2 } from "@tabler/icons-react"; // Import Tabler icon

export default function PromptMenu() {
  const supabase = createClient(); // Initialize Supabase client
  const router = useRouter(); // Access Next.js router for navigation
  const [user, setUser] = useState(null); // State to hold user information
  const [loading, setLoading] = useState(true); // Loading state
  const [menuOpen, setMenuOpen] = useState(false); // Menu visibility for mobile
  const menuRef = useRef(null); // Reference to the sidebar menu container

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

  // Handle user logout
  const handleLogout = async () => {
    await supabase.auth.signOut(); // Call Supabase to sign out
    router.push("/login"); // Redirect to login page
  };

  // Toggle mobile menu
  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Handle click events outside the menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false); // Close the menu if the click occurred outside
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Remove event listener on cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      {/* Mobile menu toggle button */}
      {menuOpen ? null : (
        <button
          onClick={toggleMenu}
          className="lg:hidden fixed p-2 m-2 text-white bg-gray-700 rounded-lg focus:outline-none"
        >
          <IconMenu2 size={24} />
        </button>
      )}

      {/* Sidebar menu */}
      <div
        ref={menuRef}
        className={`${
          menuOpen ? "block" : "hidden"
        } lg:block w-60 bg-gradient-to-b from-gray-700 to-gray-800 text-white h-screen p-6 shadow-lg z-50 fixed lg:relative`}
      >
        {/* Display loading indicator or user status */}
        {loading ? (
          <p className="text-center text-gray-400 h-24">Loading...</p>
        ) : user ? (
          <div className="mb-4 text-center h-24">
            <p className="font-semibold text-sm mb-2">Welcome, {user.email}</p>{" "}
            {/* Display user's email */}
            <button
              onClick={handleLogout}
              className="mt-2 p-1 px-4 bg-slate-800 hover:bg-slate-900 text-white border border-transparent rounded-lg shadow"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-400 h-24 space-y-2">
            <Link
              href="/login"
              className="block py-2 px-3 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors border border-yellow-400"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="block py-2 px-3 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}

        <h1 className="mt-4 mb-2 text-xl font-semibold text-center border-b border-gray-600 pb-2">
          Prompt Menu
        </h1>
        <ul className="space-y-3 mt-4">
          <li>
            <Link
              href="/prompt"
              className="block py-2 px-3 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/prompt/generate"
              className="block py-2 px-3 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
            >
              Generate
            </Link>
          </li>
          <li>
            <Link
              href="/prompt/saved"
              className="block py-2 px-3 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
            >
              Saved
            </Link>
          </li>
          <li>
            <Link
              href="/prompt/test"
              className="block py-2 px-3 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
            >
              Test
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
