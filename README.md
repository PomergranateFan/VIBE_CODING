# Fish & Money Workspace

## Описание проекта
Учебный fullstack-проект в формате monorepo:
- `@fishmoney/frontend` (`apps/frontend`) - SPA на Vite + React.
- `@fishmoney/backend` (`apps/backend`) - API на Express.
- `@fishmoney/shared` (`packages/shared`) - общие контракты и типы на Zod.

## Учебная задача
Собрать приложение, где пользователь вводит тикер акции, а система показывает краткий анализ:
- frontend отправляет тикер на backend;
- backend ходит в n8n webhook за данными;
- ответ приводится к единому контракту и возвращается в UI.

## Что реализовано на первом этапе
- Настроен monorepo с разделением на frontend/backend/shared.
- Добавлен единый API-контракт (`POST /api/analyze`, `GET /api/health`) в `packages/shared`.
- Реализован backend с валидацией env-переменных, CORS и логированием запросов.
- Добавлена нормализация нестабильного ответа n8n (в т.ч. вложенные/строковые JSON-ответы).
- Подключено логирование результатов анализа в БД через Drizzle.
- Реализован frontend-интерфейс: форма ввода тикера, состояния загрузки/ошибки, отображение аналитики и новостей.
- Добавлено избранное тикеров (localStorage): можно добавить тикер из результата анализа, сразу из поля ввода и быстро повторно запускать анализ из списка.
- Улучшена адаптивность формы поиска на мобильных устройствах (кнопки действий корректно переносятся по ширине).

## API
- `POST /api/analyze`
  - запрос: `{ "ticker": "AAPL" }`
  - `200`: нормализованный анализ по контракту `n8nResponseSchema`
  - `400`: некорректный вход
  - `502`: ошибка получения live-данных из n8n
- `GET /api/health` -> `{ "status": "ok" }`

## Переменные окружения
Backend (`apps/backend/.env`):
- `PORT` (по умолчанию `5001`)
- `DATABASE_URL` (обязательно)
- `N8N_WEBHOOK_URL` (обязательно)
- `CORS_ORIGINS` (через запятую, по умолчанию `http://localhost:5173,http://127.0.0.1:5173`)

Frontend (`apps/frontend/.env`):
- `VITE_API_BASE_URL` (например: `http://localhost:5001`)

## Как пользоваться
1. Установить зависимости:
   - `npm install`
2. Подготовить `.env`:
   - `cp apps/backend/.env.example apps/backend/.env`
   - `cp apps/frontend/.env.example apps/frontend/.env`
3. (Опционально) применить схему БД:
   - `npm run db:push`
4. Запустить проект:
   - `npm run dev`
5. Открыть `http://localhost:5173`, ввести тикер (например, `AAPL`) и получить анализ.

## Скрипты (корень репозитория)
- `npm run dev` - backend + frontend параллельно
- `npm run build` - сборка shared, backend, frontend
- `npm run start` - запуск backend в production-режиме
- `npm run check` - проверка TypeScript во всех workspace
- `npm run db:push` - пуш схемы Drizzle для backend

## Production split
- Деплой frontend как статический build: `npm run build -w @fishmoney/frontend`
- Деплой backend как API-сервис: `npm run build -w @fishmoney/backend && npm run start -w @fishmoney/backend`
- Для frontend выставить `VITE_API_BASE_URL` на домен backend API
- Для backend выставить `CORS_ORIGINS` на домен(ы) frontend
