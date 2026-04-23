import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travely",
  description:
    "Multimodal mobility platform starting in Madrid with modular city and data-source support.",
};

const auroraCss = [
  "ntizar.css",
  "ntizar.themes.css",
  "ntizar.data.css",
  "ntizar.maps.css",
  "ntizar.viz.css",
  "ntizar.motion.css",
  "ntizar.forms.css",
  "ntizar.ui.css",
  "ntizar.patterns.css",
  "ntizar.next.css",
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {auroraCss.map((file) => (
          <link
            key={file}
            rel="stylesheet"
            href={`https://cdn.jsdelivr.net/gh/Ntizar/Ntizar-Aurora@v5.1.0/${file}`}
          />
        ))}
      </head>
      <body
        className="nz min-h-full"
        data-nz-theme="dark"
        data-nz-skin="aurora"
        data-nz-shape="rounded"
        data-nz-density="comfortable"
        data-nz-motion="calm"
        data-nz-color-system="oklch"
      >
        {children}
      </body>
    </html>
  );
}
