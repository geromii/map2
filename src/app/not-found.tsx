
 
export default function NotFound() {
  return (
    <div className="min-h-screen h-full w-full flex flex-col items-center justify-center bg-gray-100 text-center">
      <h2 className="text-3xl font-bold text-red-600 mb-4">404 - Not Found</h2>
      <p className="text-lg text-gray-700 mb-6">The requested resource could not be found.</p>
      <a href="/" className="text-blue-500 hover:text-blue-700 transition duration-300">Return Home</a>
    </div>
  )
}