import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "@/lib/providers";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Filofax - Personal Organization App",
  description: "Your digital command center for personal organization",
  icons: {
    icon: "/favicon.ico",
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
