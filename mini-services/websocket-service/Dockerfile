FROM node:18-alpine

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY . .

RUN bun run build

EXPOSE 3003

CMD ["bun", "run", "start"]