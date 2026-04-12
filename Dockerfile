# ─────────────────────────────────────────────────────────────
# Iron Device Audio Analysis — Dockerfile
#
# libirontune.so 는 ELF x86-64(Ubuntu) 빌드 → --platform 필수
#
# [빌드]
#   docker build --platform linux/amd64 -t iron-device-sim .
#
# [실행 — Mock 모드]
#   docker run --platform linux/amd64 -p 3000:3000 iron-device-sim
#
# [실행 — Native 모드]
#   docker run --platform linux/amd64 -p 3000:3000 \
#     -e USE_MOCK=false \
#     -e SO_PATH=/app/native/libirontune.so \
#     -v /host/path/libirontune.so:/app/native/libirontune.so \
#     iron-device-sim
# ─────────────────────────────────────────────────────────────

# Stage 1 — 의존성 설치
FROM --platform=linux/amd64 node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2 — 빌드
FROM --platform=linux/amd64 node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3 — 런타임
FROM --platform=linux/amd64 node:20-slim AS runner
WORKDIR /app

# ffmpeg: 오디오 파일 → PCM 변환에 필요
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV USE_MOCK=true
ENV SO_PATH=/app/native/libirontune.so

# standalone 빌드 결과물 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# .so 마운트 디렉토리 생성
RUN mkdir -p /app/native

# .so 파일을 이미지에 포함할 경우 주석 해제:
# COPY libirontune.so ${SO_PATH}

EXPOSE 3000
CMD ["node", "server.js"]
