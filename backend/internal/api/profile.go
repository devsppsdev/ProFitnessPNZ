// backend/internal/api/profile.go
package api

import (
	"github.com/gin-gonic/gin"
)

// GetProfile - получение профиля (используем GetClientInfo из auth.go)
// Функция уже добавлена в auth.go как алиас

func GetProfile(c *gin.Context) {
	// Теперь эта функция просто вызывает GetClientInfo из auth.go
	GetClientInfo(c)
}
