import type { NextConfig } from "next";

// Catatan: experimental.inlineCss sudah diuji dan TIDAK dipakai. Tag <style> hasilnya tidak
// diberi nonce, sehingga CSP (style-src 'nonce-…') memblokirnya dan situs tampil tanpa gaya.

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
