import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { Providers } from "@/lib/providers";
import { SessionProvider } from "next-auth/react";

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Filofax - Personal Organization App",
  description: "Your personal digital planner for everyday life",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Filofax",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SessionProvider>
          <Providers>{children}</Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
