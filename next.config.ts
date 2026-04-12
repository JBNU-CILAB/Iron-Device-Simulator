import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 단독 실행을 위한 standalone 빌드 활성화
  output: "standalone",
  // koffi는 .node 네이티브 바이너리 → webpack 번들링 제외, 런타임에 require()
  serverExternalPackages: ["koffi"],
};

export default nextConfig;
