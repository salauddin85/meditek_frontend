import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteLogo } from "@/components/svg";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto py-20">
        <div className="mb-10">
          <SiteLogo className="h-20 w-20 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-default-900 mb-4">
            Pepoltek <span className="text-primary">HRM</span>
          </h1>
          <p className="text-lg md:text-xl text-default-600 max-w-2xl mx-auto">
            Experience the future of Human Resource Management. Optimized for performance, designed for excellence.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="xl" color="primary" className="rounded-full shadow-lg hover:translate-y-[-2px] transition-transform">
            <Link href="/auth/login">
              Login to Portal
            </Link>
          </Button>
          <Button asChild size="xl" variant="outline" className="rounded-full border-2 border-primary text-primary hover:bg-primary/10 hover:translate-y-[-2px] transition-transform">
            <Link href="/auth/registration">
              Join Pepoltek
            </Link>
          </Button>
          <Button asChild size="xl" color="dark" className="rounded-full shadow-md hover:translate-y-[-2px] transition-transform">
            <Link href="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full">
          <div className="p-6 bg-white dark:bg-default-950 rounded-2xl shadow-base">
            <h3 className="font-bold text-lg mb-2">Instant Load</h3>
            <p className="text-default-500 text-sm">Removal of hydration guards ensures your workspace is ready the moment you arrive.</p>
          </div>
          <div className="p-6 bg-white dark:bg-default-950 rounded-2xl shadow-base">
            <h3 className="font-bold text-lg mb-2">Modern UI</h3>
            <p className="text-default-500 text-sm">A premium, high-fidelity interface designed to maximize productivity and visual delight.</p>
          </div>
          <div className="p-6 bg-white dark:bg-default-950 rounded-2xl shadow-base">
            <h3 className="font-bold text-lg mb-2">Rebranded</h3>
            <p className="text-default-500 text-sm">Every element reflects the Pepoltek Ltd brand, providing a cohesive and professional identity.</p>
          </div>
        </div>
      </main>
      
      <footer className="py-10 text-center text-default-400 text-sm border-t border-border mt-auto">
        &copy; {new Date().getFullYear()} Pepoltek Ltd. All rights reserved.
      </footer>
    </div>
  );
}