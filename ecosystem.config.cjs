const path = require("path");

/**
 * PM2: `pm2 start ecosystem.config.cjs` のみ（`pm2 start npm -- run start` で二重起動しない）
 *
 * standalone の server.js は process.env.HOSTNAME で bind アドレスを決める。
 * interpreter: bash 経由だと環境・名前空間まわりで切り分けが難しいため、node で直接起動する。
 * 3000 を掴んだ残骸がいる場合はデプロイ後に `fuser -k 3000/tcp` してから `pm2 restart teracode`。
 */
module.exports = {
  apps: [
    {
      name: "teracode",
      cwd: path.join(__dirname),
      script: path.join(__dirname, ".next/standalone/server.js"),
      interpreter: "node",
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
