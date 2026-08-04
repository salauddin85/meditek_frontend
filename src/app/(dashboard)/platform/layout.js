import "../dashboard.css";

export const metadata = {
  title: "Platform Admin | Meditek",
  description: "Meditek Platform Control Plane",
};

export default function PlatformLayout({ children }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}

