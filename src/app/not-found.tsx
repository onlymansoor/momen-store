import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-primary">
      <div className="text-center max-w-md px-6">
        <h1 className="text-8xl font-bold text-gradient mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-2">
          Page Not Found
        </h2>
        <p className="text-white-muted mb-8">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-primary font-semibold rounded-lg hover:bg-accent-light transition-all duration-300 glow-sm"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
