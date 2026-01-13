# fitness-app/Makefile
.PHONY: dev backend frontend migrate test docker-up docker-down

dev: docker-up
	@echo "Starting development environment..."

backend:
	cd backend && go run cmd/server/main.go

frontend:
	cd mobile-app && npm start

migrate:
	cd backend && go run scripts/migrate.sh

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

test:
	cd backend && go test ./... -v
	cd mobile-app && npm test