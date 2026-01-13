#!/bin/bash
# backend/scripts/migrate.sh

set -e

# Загрузка переменных из .env если есть
if [ -f "../.env" ]; then
    source ../.env
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-fitness_user}
DB_PASSWORD=${DB_PASSWORD:-your_password}
DB_NAME=${DB_NAME:-fitness_app}

echo "Migrating database..."
echo "Host: $DB_HOST, Database: $DB_NAME"

# Выполняем миграцию
PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "internal/storage/migrations/001_init.sql"

echo "✅ Migration completed"