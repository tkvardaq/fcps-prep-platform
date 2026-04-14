import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "FCPS Prep — Gynae & Obs Part 1",
  description:
    "Professional FCPS Part 1 exam preparation platform for Gynecology & Obstetrics. AI-powered MCQs, study notes, spaced repetition, and mock exams.",
  keywords: [
    "FCPS Part 1",
    "Gynecology",
    "Obstetrics",
    "MCQ",
    "Medical Exam",
    "Pakistan",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
