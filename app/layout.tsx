import type { Metadata, Viewport } from "next";
import { Noto_Sans_Myanmar } from "next/font/google";
import { PwaRegistration } from "@/components/pwa-registration";
import "./globals.css";

const bodyFont = Noto_Sans_Myanmar({
  variable: "--font-body",
  subsets: ["myanmar", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://litre-log.local"),
  applicationName: "Litre Log",
  title: "Litre Log",
  description: "မြန်မာနိုင်ငံ ယာဉ်ဆီဖြည့်စက်ဝိုင်းနှင့် မဂဏန်း/စုံဂဏန်း မောင်းခွင့်ရက်များကို မှတ်သားပါ။",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Litre Log",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e2f4d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="my" className={`${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
