import { Geist, Geist_Mono, Inter } from "next/font/google";
import { cn } from "@/shared/utils";
import { Header } from "@/widgets/header";
import "../../styles/globals.css";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html
    lang='en'
    className={cn(
      "h-screen",
      "antialiased",
      geistSans.variable,
      geistMono.variable,
      "font-sans",
      inter.variable,
    )}
  >
    <body className='h-screen antialiased bg-background'>
      <Header />
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </body>
  </html>
);
