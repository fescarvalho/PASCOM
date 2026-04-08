import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
});

export const metadata: Metadata = {
    title: "PASCOM - Gestão de Escalas",
    description: "Sistema de Gestão de Escalas da Pastoral da Comunicação",
    manifest: "/manifest.json",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" className="dark scroll-smooth">
            <body className={`${outfit.variable} font-sans antialiased overflow-x-hidden w-full`}>
                {children}
            </body>
        </html>
    );
}
