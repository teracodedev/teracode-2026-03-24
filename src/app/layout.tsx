import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { auth } from "@/auth";
import NavMenu from "@/components/NavMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "テラコード - 寺院管理システム",
  description: "戸主・法要を管理するシステム",
};

/** デプロイ直後の ChunkLoadError 用（public/ の配信に依存しない） */
const CHUNK_RECOVERY_INLINE = `(function(){var k="teracode_chunk_reload";function sr(r){var t=r&&typeof r==="object"&&r.message?String(r.message):String(r||"");if(!/ChunkLoadError|Loading chunk|chunk load failed/i.test(t))return false;try{if(sessionStorage.getItem(k)==="1")return false;sessionStorage.setItem(k,"1")}catch(e){}return true}window.addEventListener("error",function(ev){if(sr(ev.error||ev.message))location.reload()});window.addEventListener("unhandledrejection",function(ev){if(sr(ev.reason))location.reload()})})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-gray-50 text-stone-900`}
      >
        <script
          dangerouslySetInnerHTML={{ __html: CHUNK_RECOVERY_INLINE }}
        />
        <nav className="bg-stone-800 text-white shadow-md relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center justify-between gap-4 h-16">
              <Link href="/" className="flex shrink-0 items-center gap-2">
                <span className="text-2xl font-bold">寺</span>
                <span className="font-bold text-xl tracking-wide">テラコード</span>
              </Link>
              <NavMenu
                userName={session?.user?.name}
                isAdmin={session?.user?.isAdmin ?? false}
              />
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
