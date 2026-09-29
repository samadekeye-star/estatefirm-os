import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EstateFirm OS",
  description: "Landlord, property, valuation, and document records for Nigerian estate surveying firms.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
