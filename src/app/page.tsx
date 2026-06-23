import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-stone-900 tracking-tight">
            Momen Store
          </Link>
          <nav className="flex items-center gap-6 text-sm text-stone-600">
            <Link href="/privacy" className="hover:text-amber-700 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-amber-700 transition-colors">
              Terms
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-amber-50 to-white">
          <div className="max-w-4xl mx-auto px-4 py-24 text-center">
            <h1 className="text-5xl font-bold text-stone-900 mb-4 leading-tight">
              Welcome to Momen Store
            </h1>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Quality products delivered to your doorstep. Shop with confidence — Cash on Delivery and Easypaisa accepted across Pakistan.
            </p>
            <div className="mt-10 flex gap-4 justify-center">
              <Link
                href="/privacy"
                className="inline-flex items-center px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors text-sm font-medium"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="inline-flex items-center px-6 py-3 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium"
              >
                Terms & Conditions
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-stone-500">
          <p>&copy; {new Date().getFullYear()} Momen Store. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/privacy" className="hover:text-amber-700 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-amber-700 transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
