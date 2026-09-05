import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Ready Kids",
    template: "%s · AI Ready Kids",
  },
  description:
    "AI Ready Kids gives students practice at the decisions an AI tool will ask them to make, before they meet one for real. Twenty-seven authored decision-practice missions for grades 2 to 4 build privacy, verification and independent learning, and First Look — three short introductory sessions per class, in a grades 1 and 2 track and a grades 3 to 5 track — is there for a class that has not been told what AI is.",
};

export const viewport: Viewport = {
  themeColor: "#fdf7ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
