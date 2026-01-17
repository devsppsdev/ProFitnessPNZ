// backend/internal/api/handlers.go
package api

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.Engine) {
	// Health
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Auth
	router.POST("/api/v1/auth/phone", SendCode)
	router.POST("/api/v1/auth/verify", VerifyCode)
	router.POST("/api/v1/auth/by-phone", AuthByPhone)

	// Public API для фронтенда (ВСЕ POST)
	router.POST("/api/public/branch/list", GetBranchesPublic)
	router.POST("/api/public/schedule/list", GetSchedulePublic)
	router.POST("/api/public/teacher/list", GetTeachersPublic)
	

	// Старые GET эндпоинты (можно оставить для совместимости)
	router.GET("/api/v1/schedule", GetSchedule)
	router.GET("/api/v1/teacher", GetTeachers)
	router.GET("/api/v1/branch", GetBranches)

	// Защищенные маршруты
	protected := router.Group("/api/v1")
	protected.Use(ValidateTokenMiddleware())
	{
		protected.GET("/profile", GetProfile)
		protected.GET("/client-info", GetClientInfo)
	}
}
