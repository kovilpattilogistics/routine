import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { HabitProvider } from "@/context/HabitContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Routine Tracker",
  description: "A minimalist routine tracker",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/logo-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Routine",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <HabitProvider>
            {children}
          </HabitProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
