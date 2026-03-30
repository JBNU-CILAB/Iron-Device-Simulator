# ─────────────────────────────────────────────────────────────
# Iron Device Audio Analysis — Dockerfile
#
# [빌드]  docker build -t iron-device-sim .
# [실행]  docker run -p 3000:3000 iron-device-sim
#
# .so 도착 후:
#   docker run -p 3000:3000 \
#     -e USE_MOCK=false \
#     -e SO_PATH=/app/native/libaudio_analysis.so \
#     -v /host/path/libaudio_analysis.so:/app/native/libaudio_analysis.so \
#     iron-device-sim
# ─────────────────────────────────────────────────────────────

# Stage 1 — 의존성 설치
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2 — 빌드
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3 — 런타임 (최소 이미지)
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Mock 모드 기본값 — .so 도착 시 false로 변경
ENV USE_MOCK=true
ENV SO_PATH=/app/native/libaudio_analysis.so

# standalone 빌드 결과물 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# public/ 폴더는 이 프로젝트에서 사용하지 않으므로 생략
# 정적 파일(이미지, favicon 등) 추가 시 아래 줄 주석 해제:
# COPY --from=builder /app/public ./public

# .so 마운트 디렉토리 생성 (볼륨 또는 COPY 용도)
RUN mkdir -p /app/native

# .so 파일이 빌드 시 포함될 경우 주석 해제:
# COPY libaudio_analysis.so ${SO_PATH}

EXPOSE 3000
CMD ["node", "server.js"]
