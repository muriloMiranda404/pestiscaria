import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sans = localFont({
  src: [{ path: "../public/fonts/dm-sans-400.woff2", weight: "400" }, { path: "../public/fonts/dm-sans-700.woff2", weight: "700" }],
  variable: "--font-sans", display: "swap",
});
const display = localFont({
  src: [{ path: "../public/fonts/playfair-display-400.woff2", weight: "400" }],
  variable: "--font-display", display: "swap",
});
export const metadata: Metadata = { applicationName: "Lucrécio Petiscaria", formatDetection: { telephone: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR" className={`${sans.variable} ${display.variable}`}><body>{children}</body></html>;
}
