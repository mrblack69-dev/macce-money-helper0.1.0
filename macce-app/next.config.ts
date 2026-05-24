import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,


  // ✅ Prevents Next image optimization issues in native apps
  images: {
    unoptimized: true,
  },
}

export default nextConfig


