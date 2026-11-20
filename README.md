# mstroy-tree-store

**Русский** | [English](README.en.md)

## Требования

- Node.js 24+
- Docker

## Запуск

```sh
npm install
cp .env.example .env
docker compose up -d
npm run seed
npm run dev:all
```

Приложение откроется на <http://127.0.0.1:3000>, API работает на <http://127.0.0.1:3001>.

## Тесты

```sh
npx vitest run
```
