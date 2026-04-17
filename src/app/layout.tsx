import type { Metadata } from "next";
import { Outfit, Manrope, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
});

const manrope = Manrope({
    subsets: ["latin"],
    variable: "--font-manrope",
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "PASCOM - Gestão de Escalas",
    description: "Sistema de Gestão de Escalas da Pastoral da Comunicação",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "PASCOM",
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport = {
    themeColor: "#4361ee",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" className="dark scroll-smooth">
            <head>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" />
            </head>
            <body className={`${outfit.variable} ${manrope.variable} ${inter.variable} font-sans antialiased overflow-x-hidden w-full`}>
                {children}
            </body>
        </html>
    );
}
