import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "../contexts/AppContext";
import { AppMode } from "../types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BuildFlow - DIY Project Manual Generator",
  description: "Generate and visualize DIY projects with AI-powered instructions and materials lists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Determine initial app mode based on environment
  const initialMode = (() => {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const hasGeminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY && 
                        process.env.NEXT_PUBLIC_GEMINI_API_KEY !== 'your_gemini_api_key';
    
    // Use demo mode if explicitly set or if Gemini API key is not configured
    return (isDemoMode || !hasGeminiKey) ? AppMode.DEMO : AppMode.LIVE;
  })();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProvider initialMode={initialMode}>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
