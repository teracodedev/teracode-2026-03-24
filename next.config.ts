import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番は自己完結サーバーにすると静的ファイル配信が安定しやすい（next start で /_next/static が 500 になる環境の回避）
  output: "standalone",
  // Prisma は Turbopack/Route Handler でバンドルすると実行時に壊れることがあるため外部化する
  serverExternalPackages: ["@prisma/client", "prisma"],
  // デプロイ高速化: build 時の ESLint 実行を無効化（lint は別途任意/CI で実施）
  eslint: { ignoreDuringBuilds: true },

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
