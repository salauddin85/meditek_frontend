export const metadata = {
  title: "Authentication | HRM Pepoltek",
  description: "Login and Authentication for HRM Project by Pepoltek Ltd",
};

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900">
            HRM System
          </h2>
          <p className="mt-2 text-sm text-gray-600">By Pepoltek Ltd</p>
        </div>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
