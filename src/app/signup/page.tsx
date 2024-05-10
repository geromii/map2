// app/signup/page.tsx
import SignupForm from '@/components/SignupForm';
import Link from 'next/link';

const SignupPage = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-600 to-gray-700">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md relative py-10">
      <Link href="/login" className="underline absolute right-10 block py-2 px-3 rounded-lg transition-colors">
        Login
        </Link>
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Sign Up</h1>
        <SignupForm />
      </div>
    </main>
  );
};

export default SignupPage;
