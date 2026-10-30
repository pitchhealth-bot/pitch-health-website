import FloatingCallButton from "./FloatingCallButton";
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "Pitch Health Solutions | Healthcare with Heart", template: "%s | Pitch Health Solutions" }, description: "Healthcare should feel personal, not like paperwork. Clarity, trust, and real support for your healthcare decisions." };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}<FloatingCallButton/></body></html> }
