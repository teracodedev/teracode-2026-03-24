import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import { auth } from "@/auth";
import NavMenu from "@/components/NavMenu";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "テラコード - 寺院管理システム",
  description: "戸主・法要を管理するシステム",
};

/** デプロイ直後の古いHTML参照に対する自己復旧（JS/CSSのハッシュ不一致時） */
const CHUNK_RECOVERY_INLINE = `(function(){var K_CHUNK="teracode_chunk_reload";var K_CSS="teracode_css_reload";function once(k){try{if(sessionStorage.getItem(k)==="1")return false;sessionStorage.setItem(k,"1")}catch(e){}return true}function reloadOnce(k){if(once(k))location.reload()}function isChunkErr(r){var t=r&&typeof r==="object"&&r.message?String(r.message):String(r||"");return /ChunkLoadError|Loading chunk|chunk load failed/i.test(t)}window.addEventListener("error",function(ev){var el=ev&&ev.target;if(el&&el.tagName==="LINK"&&/\\/\\_next\\/static\\/css\\//.test(el.href||"")){reloadOnce(K_CSS);return}if(isChunkErr(ev.error||ev.message))reloadOnce(K_CHUNK)},true);window.addEventListener("unhandledrejection",function(ev){if(isChunkErr(ev.reason))reloadOnce(K_CHUNK)});window.addEventListener("DOMContentLoaded",function(){var links=document.querySelectorAll('link[rel="stylesheet"][href*="/_next/static/css/"]');if(!links.length)return;var pending=links.length;var done=false;function fail(){if(done)return;done=true;reloadOnce(K_CSS)}function ok(){pending-=1;if(pending<=0)done=true}links.forEach(function(link){if(link.sheet){ok();return}link.addEventListener("load",ok,{once:true});link.addEventListener("error",fail,{once:true})});setTimeout(function(){if(!done)fail()},2500)})})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="ja">
      <body
        className="font-sans antialiased bg-gray-50 text-stone-900"
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
