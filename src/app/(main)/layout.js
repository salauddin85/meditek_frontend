export const metadata = {
  title: "HRM System | Pepoltek Ltd",
  description: "Public portal for the HRM System by Pepoltek Ltd.",
};

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="/" className="-m-1.5 p-1.5 text-2xl font-black text-blue-600 tracking-tight">
              Pepoltek
            </a>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            <a href="#" className="text-sm font-semibold leading-6 text-gray-700 hover:text-blue-600 transition-colors">HR Features</a>
            <a href="#" className="text-sm font-semibold leading-6 text-gray-700 hover:text-blue-600 transition-colors">About Us</a>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <a 
              href="/auth" 
              className="text-sm font-semibold leading-6 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition"
            >
              Sign In
            </a>
          </div>
        </nav>
      </header>

      {/* Page Content */}
      <main className="flex-1 bg-white mb-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="#" className="text-gray-400 hover:text-gray-500">
              Terms
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              Privacy
            </a>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-sm leading-5 text-gray-500">
              &copy; {new Date().getFullYear()} Pepoltek Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
