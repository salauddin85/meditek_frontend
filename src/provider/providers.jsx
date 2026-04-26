"use client";
import { Inter } from "next/font/google";
import { useThemeStore } from "@/store";
import { ThemeProvider, useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { ReactToaster } from "@/components/ui/toaster";
import { Toaster } from "react-hot-toast";
import { SonnToaster } from "@/components/ui/sonner";
import ThemeCustomize from "@/components/dashboard/customizer/theme-customizer";
import { useMounted } from "@/hooks/use-mounted";
import { themes } from "@/config/themes";

const inter = Inter({ subsets: ["latin"] });

const ThemeWrapper = ({ children }) => {
  const { theme, radius } = useThemeStore();
  const { resolvedTheme: mode } = useTheme();
  const mounted = useMounted();

  const activeTheme = themes.find((t) => t.name === theme);
  const themeVars =
    mounted && activeTheme
      ? activeTheme?.cssVars[mode === "dark" ? "dark" : "light"]
      : {};

  // Create a mapping of theme variables to CSS custom properties
  const styleVariables = mounted
    ? {
        "--radius": `${radius}rem`,
        ...Object.fromEntries(
          Object.entries(themeVars).map(([key, value]) => {
            if (
              key !== "radius" &&
              typeof value === "string" &&
              value.includes(" ")
            ) {
              return [`--${key}`, `hsl(${value})`];
            }
            return [`--${key}`, value];
          })
        ),
      }
    : {};

  return (
    <div
      className={cn(
        "dash-tail-app flex-1 flex flex-col ",
        inter.className,
        mounted ? "theme-" + theme : ""
      )}
      style={styleVariables}
    >
      {children}
    </div>
  );
};

const Providers = ({ children }) => {
  return (
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="light">
      <ThemeWrapper>
        <div className="flex-1 flex flex-col h-full">
          {children}
          <ReactToaster />
        </div>
        <Toaster />
        <SonnToaster />
        <ThemeCustomize />
      </ThemeWrapper>
    </ThemeProvider>
  );
};

export default Providers;
