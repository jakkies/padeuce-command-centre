import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Padeuce Command Centre",
  description:
    "Score every point. Control every court. Run every competition with Padeuce.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Padeuce Command Centre",
    description:
      "The operational command centre for padel clubs, courts and competitions.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1748,
        height: 915,
        alt: "Padeuce Command Centre live court operations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Padeuce Command Centre",
    description:
      "Score every point. Control every court. Run every competition.",
    images: ["/og.png"],
  },
  other: {
    "theme-color": "#07111c",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
