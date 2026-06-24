import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ThemeProvider, type Theme } from "@/lib/theme-context";
import { ColorSchemeProvider } from "@/lib/color-scheme-context";
import { CornerRadiusProvider } from "@/lib/corner-radius-context";
import { getColorSchemeStyle, getCornerRadiusStyle, isColorScheme, parseCornerRadius } from "@/lib/dynamic-ui";
import "./fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Business Platform", template: "%s | Business Platform" },
  description: "Modular product, supplier, procurement, and inventory operations platform.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const theme = (cookieStore.get("theme")?.value === "dark" ? "dark" : "light") as Theme;
  const storedScheme = cookieStore.get("color-scheme")?.value;
  const colorScheme = isColorScheme(storedScheme) ? storedScheme : "emerald";
  const cornerRadius = parseCornerRadius(cookieStore.get("corner-radius")?.value) ?? 10;
  const dynamicUiStyle = {
    ...getColorSchemeStyle(colorScheme),
    ...getCornerRadiusStyle(cornerRadius),
  };

  return (
    <html lang="en" className={theme === "dark" ? "dark" : ""} style={dynamicUiStyle}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/kantumruy-pro/kantumruy-pro-latin-400-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <ProgressBar />
        <ThemeProvider initialTheme={theme}>
          <ColorSchemeProvider initialScheme={colorScheme}>
            <CornerRadiusProvider initialValue={cornerRadius}>
              {children}
            </CornerRadiusProvider>
          </ColorSchemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}