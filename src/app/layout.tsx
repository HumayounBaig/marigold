import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AppGate } from "@/components/shell";
import { StoreProvider } from "@/components/store";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Marigold",
  description: "A private postpartum recovery companion. Movement, food, and pain care planned on your computer.",
};

const themeBoot = `try{var s=JSON.parse(localStorage.getItem("marigold.v1")||"null");if(s&&s.night)document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <StoreProvider>
          <AppGate>{children}</AppGate>
        </StoreProvider>
      </body>
    </html>
  );
}
