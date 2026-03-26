import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番は自己完結サーバーにすると静的ファイル配信が安定しやすい（next start で /_next/static が 500 になる環境の回避）
  output: "standalone",
  // Prisma は Turbopack/Route Handler でバンドルすると実行時に壊れることがあるため外部化する
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Next.js 16 では `next.config.ts` の `eslint` オプション（ignoreDuringBuilds 等）は非対応。
  // そのため build 時の lint 無効化は設定ではなく、Next.js 側の挙動（ビルドで lint しない）に委ねる。

  // ハッシュ付きアセットのみ長期キャッシュ（HTML の no-store は nginx 側で付与）
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
