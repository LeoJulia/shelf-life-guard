import { Geist, Geist_Mono, Inter } from "next/font/google";
import { cn } from "@/shared/utils";
import { Header } from "./ui/header";
import "../../styles/globals.css";

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
      <div className='mx-auto max-w-7xl px-6 py-8'>{children}</div>
    </body>
  </html>
);
