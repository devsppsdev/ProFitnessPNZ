// backend/internal/api/halls.go
package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"backend/internal/services/crm"

	"github.com/gin-gonic/gin"
)

// HallResponse - структура ответа для залов
type HallResponse struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Address  string `json:"address"`
	Phone    string `json:"phone"`
	Capacity int    `json:"capacity,omitempty"`
	IsActive bool   `json:"is_active"`
}

// ==================== ПУБЛИЧНЫЙ API (для фронтенда) ====================

// GetHallsPublic - POST эндпоинт для фронтенда
func GetHallsPublic(c *gin.Context) {
	fmt.Println("[API] POST /api/public/hall/list - Запрос залов")

	var request struct {
		Limit  int  `json:"limit,omitempty"`
		Page   int  `json:"page,omitempty"`
		Active bool `json:"active_only,omitempty"`
	}

	// Значения по умолчанию
	request.Limit = 50
	request.Page = 1
	request.Active = true

	// Парсим тело запроса (если есть)
	if err := c.ShouldBindJSON(&request); err != nil {
		// Если тело пустое - используем значения по умолчанию
		fmt.Println("[API] Используем значения по умолчанию")
	}

	// Получаем залы из CRM
	halls, err := fetchHallsFromCRM(request.Limit, request.Page, request.Active)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Ошибка получения залов",
			"details": err.Error(),
		})
		return
	}

	fmt.Printf("[API] Успешно получено %d залов\n", len(halls))

	// Формируем ответ для фронтенда
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"items":   halls, // Важно: items для фронтенда
		"meta": gin.H{
			"total":     len(halls),
			"limit":     request.Limit,
			"page":      request.Page,
			"timestamp": time.Now().Unix(),
		},
	})
}

// ==================== СТАРЫЙ API (для совместимости) ====================

// GetHalls - старый GET эндпоинт (оставляем для совместимости)
func GetHalls(c *gin.Context) {
	fmt.Println("[API] GET /api/v1/hall - Запрос залов")

	halls, err := fetchHallsFromCRM(50, 1, true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Ошибка получения залов",
			"details": err.Error(),
		})
		return
	}

	// Старый формат ответа
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    halls, // data для старого API
		"meta": gin.H{
			"total":     len(halls),
			"timestamp": time.Now().Unix(),
		},
	})
}

// ==================== ОБЩАЯ ЛОГИКА ====================

// fetchHallsFromCRM - получение залов из CRM API
func fetchHallsFromCRM(limit, page int, activeOnly bool) ([]HallResponse, error) {
	crmClient := crm.GetClient()
	if crmClient == nil {
		return nil, fmt.Errorf("CRM клиент не инициализирован")
	}

	// Формируем запрос к CRM
	requestBody := map[string]interface{}{
		"fields": []string{"id", "name", "address", "phone", "capacity", "isActive"},
		"limit":  limit,
		"page":   page,
		"sort":   map[string]string{"name": "asc"},
	}

	// Добавляем фильтр по активности если нужно
	if activeOnly {
		requestBody["columns"] = map[string]interface{}{
			"isActive": true,
		}
	}

	fmt.Printf("[CRM] Запрашиваем залы: limit=%d, page=%d, active=%v\n",
		limit, page, activeOnly)

	body, err := crmClient.Post("hall/list", requestBody)
	if err != nil {
		return nil, err
	}

	// Парсим ответ CRM
	return parseCRMHallResponse(body)
}

// parseCRMHallResponse - парсинг ответа от CRM
func parseCRMHallResponse(body []byte) ([]HallResponse, error) {
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("ошибка парсинга JSON: %v", err)
	}

	var halls []HallResponse

	// Ищем данные в разных вариантах ответа CRM
	var items []interface{}
	var found bool

	// Вариант 1: items
	if data, ok := result["items"].([]interface{}); ok {
		items = data
		found = true
		fmt.Printf("[CRM] Найдено %d залов в 'items'\n", len(items))
	}

	// Вариант 2: data
	if !found {
		if data, ok := result["data"].([]interface{}); ok {
			items = data
			found = true
			fmt.Printf("[CRM] Найдено %d залов в 'data'\n", len(items))
		}
	}

	// Если ничего не нашли
	if !found {
		fmt.Println("[CRM] В ответе нет ни items, ни data")
		return halls, nil
	}

	// Обрабатываем каждый зал
	for _, item := range items {
		if hallData, ok := item.(map[string]interface{}); ok {
			hall := convertCRMHallToResponse(hallData)
			// Добавляем только если есть ID
			if hall.ID > 0 {
				halls = append(halls, hall)
			}
		}
	}

	fmt.Printf("[CRM] Успешно сконвертировано %d залов\n", len(halls))
	return halls, nil
}

// convertCRMHallToResponse - конвертация данных CRM в HallResponse
func convertCRMHallToResponse(crmData map[string]interface{}) HallResponse {
	hall := HallResponse{
		IsActive: true,
	}

	// ID
	if id, ok := crmData["id"].(float64); ok {
		hall.ID = int(id)
	}

	// Название
	if name, ok := crmData["name"].(string); ok {
		hall.Name = name
	} else {
		hall.Name = "Зал"
	}

	// Адрес
	if address, ok := crmData["address"].(string); ok {
		hall.Address = address
	}

	// Телефон
	if phone, ok := crmData["phone"].(string); ok {
		hall.Phone = phone
	}

	// Вместимость
	if capacity, ok := crmData["capacity"].(float64); ok {
		hall.Capacity = int(capacity)
	}

	// Активность
	if isActive, ok := crmData["isActive"].(bool); ok {
		hall.IsActive = isActive
	}

	return hall
}
