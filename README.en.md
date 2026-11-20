# mstroy-tree-store

[Русский](README.md) | **English**

## Requirements

- Node.js 24+
- Docker

## Run

```sh
npm install
cp .env.example .env
docker compose up -d
npm run seed
npm run dev:all
```

The app opens at <http://127.0.0.1:3000>, the API runs at <http://127.0.0.1:3001>.

## Tests

```sh
npx vitest run
```
