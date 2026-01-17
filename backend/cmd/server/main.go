// backend/cmd/server/main.go
package main

import (
	"fmt"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"backend/configs"
	"backend/internal/api"
	"backend/internal/services/crm"
)

func main() {
	// 1. Загружаем конфигурацию
	cfg, err := configs.Load()
	if err != nil {
		log.Fatalf("❌ Ошибка загрузки конфигурации: %v", err)
	}

	// 2. Инициализируем CRM клиент
	fmt.Printf("🔧 Инициализация CRM клиента...\n")
	fmt.Printf("   Base URL: %s\n", cfg.CRM.BaseURL)
	fmt.Printf("   API Key: %s...%s (скрыто)\n", cfg.CRM.APIKey[:min(8, len(cfg.CRM.APIKey))], cfg.CRM.APIKey[max(0, len(cfg.CRM.APIKey)-4):])

	if err := crm.InitGlobalClient(cfg.CRM.APIKey, cfg.CRM.BaseURL); err != nil {
		log.Fatalf("❌ Ошибка инициализации CRM клиента: %v", err)
	}
	fmt.Println("✅ CRM клиент инициализирован")

	crmClient := crm.GetClient()
    crmClient.SetSession("r295oohgcm25381rqelvt0t0lb") // из curl

	// 3. Инициализируем роутер
	r := gin.Default()

	// 2. Настраиваем CORS для фронтенда (важно!)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000", "http://localhost:8081"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 3600, // 12 часов
	}))

	// 3. Регистрируем маршруты из handlers.go
	api.RegisterRoutes(r)

	// 4. Добавляем тестовый маршрут для проверки
	r.GET("/api/test", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "API работает",
			"routes": []string{
				"POST /api/v1/auth/phone",
				"POST /api/v1/auth/verify",
				"GET  /api/v1/schedule",
				"GET  /api/v1/profile",
			},
		})
	})

	// 5. Запускаем сервер
	port := ":8080"
	fmt.Printf("🚀 Сервер запущен на http://localhost%s\n", port)
	fmt.Println("📌 Доступные эндпоинты:")
	fmt.Println("  POST /api/v1/auth/phone     - Отправка SMS кода")
	fmt.Println("  POST /api/v1/auth/verify    - Проверка кода")
	fmt.Println("  GET  /api/v1/schedule       - Расписание")
	fmt.Println("  GET  /api/v1/profile        - Профиль (требует токен)")
	fmt.Println("  GET  /health                - Проверка здоровья")
	fmt.Println("  GET  /api/test              - Тест API")

	if err := r.Run(port); err != nil {
		log.Fatal("❌ Ошибка запуска сервера:", err)
	}
}

// Helper functions for string manipulation
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
