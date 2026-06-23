import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
      <div className="text-center">
        <div className="text-8xl font-black text-green-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="btn-primary inline-flex">Go Home</Link>
      </div>
    </div>
  );
}
