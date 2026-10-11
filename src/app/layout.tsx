import type { Metadata } from "next";
import { Poppins, Unbounded } from "next/font/google";
import { connection } from "next/server";
import { BottomNav, SiteHeader } from "@/components/nav";
import { SiteFooter } from "@/components/footer";
import { SwRegister } from "@/components/sw-register";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

// Huruf display lebar untuk judul, menggantikan kesan "template" huruf biasa
const display = Unbounded({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "thriftbook. — buku kuliah bekas UM",
  description: "Jual, hibah, dan tukar buku kuliah bekas antar mahasiswa Universitas Negeri Malang.",
  applicationName: "thriftbook.",
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport = { themeColor: "#fbf4e4" };

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : null;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection(); // CSP bernonce butuh render dinamis

  let loggedIn = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    loggedIn = Boolean(data.user);
  } catch {
    loggedIn = false;
  }

  return (
    <html lang="id" className={`${poppins.variable} ${display.variable} h-full antialiased`}>
      <head>
        {supabaseOrigin && <link rel="preconnect" href={supabaseOrigin} crossOrigin="" />}
      </head>
      <body className="flex min-h-full flex-col overflow-x-clip">
        <a href="#konten" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 btn btn-yellow">
          Langsung ke konten
        </a>
        <SiteHeader loggedIn={loggedIn} />
        <div id="konten" className="flex flex-1 flex-col">
          {children}
        </div>
        <SiteFooter />
        <BottomNav />
        <SwRegister />
      </body>
    </html>
  );
}
