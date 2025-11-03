import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Cheque Manager - Payment Management System",
  description: "Manage cheques and cash records efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <SidebarProvider>
          <AppSidebar />
          <main className="w-full">
            {children}
          </main>
        </SidebarProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}