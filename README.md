структура проекта:
fitness-app/
├── backend/                    # Go сервер (API + интеграция с CRM)
│   ├── cmd/
│   │   └── server/
│   │       └── main.go        # Точка входа, инициализация
│   ├── internal/              # Внутренние пакеты (бизнес-логика)
│   │   ├── api/               # HTTP handlers
│   │   │   ├── handlers.go    # Регистрация роутов
│   │   │   ├── auth.go        # Авторизация по SMS
│   │   │   ├── schedule.go    # Расписание, записи
│   │   │   ├── profile.go     # Данные клиента, прогресс
│   │   │   └── notifications.go # Управление уведомлениями
│   │   ├── services/          # Бизнес-логика
│   │   │   ├── crm/           # Работа с ImpulseCRM API
│   │   │   │   ├── client.go  # Структура клиента CRM
│   │   │   │   ├── schedule.go # Загрузка расписания
│   │   │   │   ├── reservations.go # Работа с записями
│   │   │   │   └── webhooks.go # Обработка вебхуков (если будут)
│   │   │   ├── notifications/ # Система уведомлений
│   │   │   │   ├── service.go # Основная логика
│   │   │   │   ├── telegram.go # Отправка в Telegram
│   │   │   │   └── push.go    # Отправка пушей (Firebase)
│   │   │   ├── streaks/       # Подсчет серий посещений
│   │   │   │   └── calculator.go
│   │   │   └── points/        # Система баллов
│   │   │       └── service.go
│   │   ├── storage/           # Работа с БД (PostgreSQL)
│   │   │   ├── repository.go  # Интерфейсы репозиториев
│   │   │   ├── postgres/      # Реализация для Postgres
│   │   │   │   ├── clients.go
│   │   │   │   ├── streaks.go
│   │   │   │   ├── points.go
│   │   │   │   └── measurements.go
│   │   │   └── migrations/    # Миграции БД
│   │   │       └── 001_init.sql
│   │   └── models/            # Структуры данных
│   │       ├── user.go        # Пользователь приложения
│   │       ├── crm.go         # Структуры для ответов CRM
│   │       ├── notification.go
│   │       └── measurement.go
│   ├── pkg/                   # Внешние пакеты (можно использовать в других проектах)
│   │   ├── logger/            # Логирование
│   │   │   └── logger.go
│   │   ├── sms/               # Отправка SMS
│   │   │   └── sender.go
│   │   └── auth/              # JWT токены
│   │       └── jwt.go
│   ├── configs/               # Конфигурация
│   │   └── config.yaml        # Настройки
│   ├── scripts/               # Скрипты
│   │   ├── migrate.sh         # Запуск миграций
│   │   └── deploy.sh          # Деплой
│   ├── Dockerfile
│   ├── go.mod
│   └── go.sum
├── mobile-app/                # React Native приложение
│   ├── src/
│   │   ├── screens/           # Экранът
│   │   │   ├── AuthScreen.js
│   │   │   ├── ScheduleScreen.js
│   │   │   ├── BookingsScreen.js
│   │   │   ├── ProfileScreen.js
│   │   │   └── ProgressScreen.js
│   │   ├── components/        # Переиспользуемые компоненты
│   │   │   ├── StreakCounter.js
│   │   │   ├── PointsDisplay.js
│   │   │   ├── LoadingSpinner.js
│   │   │   └── ScheduleItem.js
│   │   ├── navigation/        # Навигация
│   │   │   ├── AppNavigator.js
│   │   │   └── AuthNavigator.js
│   │   ├── services/          # API вызовы
│   │   │   ├── api.js         # Axios instance
│   │   │   ├── auth.js        # Работа с токенами
│   │   │   └── notifications.js # Push-уведомления
│   │   ├── store/             # State management (Zustand/Redux)
│   │   │   ├── index.js
│   │   │   ├── authStore.js
│   │   │   └── userStore.js
│   │   ├── utils/             # Вспомогательные функции
│   │   │   ├── formatters.js  # Форматирование дат, времени
│   │   │   └── validators.js  # Валидация
│   │   └── assets/            # Статика
│   │       ├── images/
│   │       ├── fonts/
│   │       └── icons/
│   ├── App.js                 # Главный компонент
│   ├── app.json
│   ├── package.json
│   └── index.js
├── shared/                    # Общие типы/контракты
│   └── types/                 # TypeScript типы для frontend/backend
│       ├── api.ts             # Интерфейсы API
│       └── crm.ts             # Типы данных CRM
├── docker-compose.yml         # Для локальной разработки
└── README.md
npm install react-native-async-storage/async-storage