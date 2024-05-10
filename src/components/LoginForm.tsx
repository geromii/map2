// components/LoginForm.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from 'src/utils/supabase/client';
import { useRouter } from 'next/navigation';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // Check if the user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        router.push('/prompt'); // Redirect to prompt page if already logged in
      }
    };
    checkAuthStatus();
  }, [router, supabase]);

  // Function to handle form submission for login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with email:", email);
    console.log("Form submitted with password:", password); // Avoid logging sensitive data in a real application

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.log("Login failed with error:", error.message);
      setError(error.message);
    } else {
      console.log("Login successful");
      setError('');
      router.push('/prompt'); // Redirect to the desired page on successful login
    }
  };

  // Render the login form
  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <button type="submit" className=" w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Login</button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
};

export default LoginForm;
