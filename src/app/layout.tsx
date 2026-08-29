import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Ready Kids",
    template: "%s · AI Ready Kids",
  },
  description:
    "AI Ready Kids helps students understand the nuances of safety in using artificial intelligence before they are thrust into prompts and language models. It starts with First Look, an introduction for children who have not been told what AI is, then builds privacy, verification and independent learning through teacher-guided scenarios for grades 1 to 5.",
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
