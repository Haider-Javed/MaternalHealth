import { Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const urdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-urdu",
});

export const metadata = {
  title: "MedTriage AI — Maternal Health Risk Co-Pilot",
  description:
    "AI-powered maternal health risk triage for Lady Health Workers in rural Pakistan. Bilingual English/Urdu, Random Forest ML, Gemini AI guidance.",
  keywords: ["maternal health", "AI triage", "LHW", "Pakistan", "pregnancy risk"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${urdu.variable} font-sans antialiased`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
