// backend/internal/api/handlers.go
package api

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.Engine) {
	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	
	// Auth endpoints
	router.POST("/api/v1/auth/phone", SendCode)
	router.POST("/api/v1/auth/verify", VerifyCode)
}