import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 단독 실행을 위한 standalone 빌드 활성화
  output: "standalone",
};

export default nextConfig;
