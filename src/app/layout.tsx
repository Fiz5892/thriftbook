import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { connection } from "next/server";
import { BottomNav } from "@/components/nav";
import { SwRegister } from "@/components/sw-register";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "thriftbook. — buku kuliah bekas UM",
  description: "Jual, hibah, dan tukar buku kuliah bekas antar mahasiswa Universitas Negeri Malang.",
  applicationName: "thriftbook.",
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport = { themeColor: "#1a0b7a" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection(); // CSP bernonce butuh render dinamis
  return (
    <html lang="id" className={`${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <BottomNav />
        <SwRegister />
      </body>
    </html>
  );
}
