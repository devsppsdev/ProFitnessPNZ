// backend/internal/api/bookings.go
package api

import (
	"net/http"
	"time" // ← ДОБАВЬТЕ ЭТОТ ИМПОРТ

	"github.com/gin-gonic/gin"
)

// GetMyBookings - получение бронирований пользователя
func GetMyBookings(c *gin.Context) {
	clientID, _ := c.Get("client_id")
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": []gin.H{
			{
				"id":          1,
				"schedule_id": 123,
				"class_name":  "Йога для начинающих",
				"date":        "2024-01-15",
				"time":        "10:00",
				"coach":       "Анна Иванова",
				"status":      "confirmed",
			},
		},
		"meta": gin.H{
			"client_id": clientID,
			"total":     1,
		},
		"note": "В MVP возвращаем тестовые данные. Интегрируйте с CRM эндпоинтом 'reservation'",
	})
}

// BookSchedule - создание бронирования
func BookSchedule(c *gin.Context) {
	clientID, _ := c.Get("client_id")
	
	var req struct {
		ScheduleID int `json:"schedule_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат запроса"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Запись на занятие создана",
		"data": gin.H{
			"booking_id":   1001,
			"client_id":    clientID,
			"schedule_id":  req.ScheduleID,
			"status":       "booked",
			"created_at":   time.Now().Format(time.RFC3339),
		},
		"note": "В MVP создаем тестовую запись. Интегрируйте с CRM эндпоинтом 'reservation'",
	})
}

// CancelBooking - отмена бронирования
func CancelBooking(c *gin.Context) {
	clientID, _ := c.Get("client_id")
	bookingID := c.Param("id")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Бронирование отменено",
		"data": gin.H{
			"booking_id":  bookingID,
			"client_id":   clientID,
			"canceled_at": time.Now().Format(time.RFC3339),
		},
		"note": "В MVP симуляция отмены. Интегрируйте с CRM API",
	})
}