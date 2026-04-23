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
  title: "Rumby",
  description:
    "Multimodal mobility platform starting in Madrid with modular city and data-source support.",
};

const auroraCss = [
  "ntizar.css",
  "ntizar.themes.css",
  "ntizar.maps.css",
  "ntizar.forms.css",
  "ntizar.ui.css",
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
        data-nz-theme="light"
        data-nz-skin="aurora"
        data-nz-shape="default"
        data-nz-density="comfortable"
        data-nz-motion="standard"
        data-nz-color-system="hex"
      >
        {children}
      </body>
    </html>
  );
}
