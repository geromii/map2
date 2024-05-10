// app/signup/page.tsx
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import Link from 'next/link';

const LoginPage = () => {



  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-700 to-gray-800">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md relative py-10">
      <div>
        <Link href="/signup" className="underline absolute right-10 block py-2 px-3 rounded-lg transition-colors">
        Sign Up
        </Link>
      </div>
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Login</h1>
        <LoginForm />

      </div>
    </main>
  );
};

export default LoginPage;
