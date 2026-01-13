// backend/internal/api/auth.go
package api

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

func SendCode(c *gin.Context) {
	var req struct {
		Phone string `json:"phone" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Код отправлен",
		"debug_code": "1234",
	})
}

func VerifyCode(c *gin.Context) {
	var req struct {
		Phone string `json:"phone" binding:"required"`
		Code  string `json:"code" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	
	if req.Code == "1234" {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Авторизация успешна",
			"token": "jwt_demo_token",
		})
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Неверный код",
		})
	}
}