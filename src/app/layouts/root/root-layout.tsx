import { Geist, Geist_Mono, Inter } from "next/font/google";
import { cn } from "@/shared/utils";
import { Header } from "./ui/header";
import { ThemeProvider } from "./ui/theme-provider";
import { scheduleStorageMaintenance } from "@/shared/server";
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
}>) => {
  scheduleStorageMaintenance();

  return (
    <html
      lang='en'
      suppressHydrationWarning
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
        <ThemeProvider>
          <Header />
          <div className='mx-auto max-w-7xl px-6 py-8'>{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
};
