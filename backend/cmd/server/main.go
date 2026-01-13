// backend/cmd/server/main.go
package main

import (
	"fitness-app/backend/configs"
	"fitness-app/backend/internal/api"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	_ = configs.Load() // или просто configs.Load() без присваивания

	router := gin.Default()

	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(200)
			return
		}
		c.Next()
	})

	api.RegisterRoutes(router)

	port := "8080"
	log.Printf("Server starting on :%s", port)
	router.Run(":" + port)
}
