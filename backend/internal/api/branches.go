// backend/internal/api/branches.go
package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"backend/internal/services/crm"

	"github.com/gin-gonic/gin"
)

// BranchResponse - структура для ответа филиала
type BranchResponse struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Address  string `json:"address,omitempty"`
	Phone    string `json:"phone,omitempty"`
	City     string `json:"city,omitempty"`
	IsActive bool   `json:"is_active"`
}

// GetBranches - GET эндпоинт для получения филиалов (публичный)
func GetBranches(c *gin.Context) {
	fmt.Println("[API] GET /api/public/branch - Запрос филиалов")

	branches, err := fetchBranchesFromCRM()
	if err != nil {
		fmt.Printf("[API] Ошибка получения филиалов: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Ошибка получения филиалов из CRM",
			"details": err.Error(),
		})
		return
	}

	fmt.Printf("[API] Успешно получено %d филиалов\n", len(branches))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    branches,
		"meta": gin.H{
			"total":     len(branches),
			"timestamp": time.Now().Unix(),
			"source":    "impulseCRM",
		},
	})
}

// fetchBranchesFromCRM - получение филиалов из CRM API
func fetchBranchesFromCRM() ([]BranchResponse, error) {
	crmClient := crm.GetClient()
	if crmClient == nil {
		return nil, fmt.Errorf("CRM клиент не инициализирован")
	}

	// Формируем тело запроса для CRM
	requestBody := map[string]interface{}{
		"fields": []string{"id", "name", "phone"},
		"limit":  20,
		"page":   1,
		"sort":   map[string]string{"id": "asc"},
		/*"columns": map[string]interface{}{
			"deleted":  false, // Только неудаленные
			"archived": false, // Только неархивированные
		},*/
	}

	fmt.Printf("[CRM] Запрашиваем филиалы...\n")

	body, err := crmClient.Post("branch/list", requestBody)
	if err != nil {
		fmt.Printf("[CRM ERROR] Ошибка при запросе к CRM: %v\n", err)
		return nil, fmt.Errorf("ошибка запроса к CRM: %v", err)
	}

	fmt.Printf("[CRM] Получен ответ от CRM, размер: %d байт\n", len(body))

	// Парсим ответ
	return parseCRMBranchesResponse(body)
}

// parseCRMBranchesResponse - парсинг ответа от CRM
func parseCRMBranchesResponse(body []byte) ([]BranchResponse, error) {
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		fmt.Printf("[CRM ERROR] Ошибка парсинга JSON: %v\n", err)
		fmt.Printf("[CRM ERROR] Сырой JSON: %s\n", string(body))
		return nil, fmt.Errorf("ошибка парсинга JSON: %v", err)
	}

	// ВЫВЕДИ СТРУКТУРУ ОТВЕТА
	fmt.Printf("[CRM DEBUG] Структура ответа: %+v\n", result)

	var branches []BranchResponse

	// Ищем данные в items
	items, itemsExists := result["items"].([]interface{})
	if !itemsExists {
		fmt.Println("[CRM ERROR] В ответе нет ключа 'items'")
		// Выведи все ключи для отладки
		for key := range result {
			fmt.Printf("[CRM DEBUG] Ключ в ответе: %s\n", key)
		}
		return branches, nil
	}

	fmt.Printf("[CRM] Найдено %d элементов в items\n", len(items))

	// Обрабатываем каждый филиал
	for i, item := range items {
		if branchData, ok := item.(map[string]interface{}); ok {
			fmt.Printf("[CRM DEBUG] Элемент %d: %+v\n", i, branchData)

			branch := convertCRMBranch(branchData)
			// Добавляем только если есть ID
			if branch.ID > 0 {
				branches = append(branches, branch)
			}
		}
	}

	fmt.Printf("[CRM] Успешно сконвертировано %d филиалов\n", len(branches))
	return branches, nil
}

// convertCRMBranch - конвертация данных CRM в BranchResponse
func convertCRMBranch(crmData map[string]interface{}) BranchResponse {
	branch := BranchResponse{
		IsActive: true, // По умолчанию активен
	}

	// ID
	if id, ok := crmData["id"].(float64); ok {
		branch.ID = int(id)
	}

	// Название
	if name, ok := crmData["name"].(string); ok {
		branch.Name = name
	} else {
		branch.Name = "Филиал"
	}

	// Телефон
	if phone, ok := crmData["phone"].(string); ok && phone != "" {
		branch.Phone = phone
	} else {
		branch.Phone = ""
	}

	return branch
}

// GetBranchesPublic - POST эндпоинт для фронтенда (если нужно)
func GetBranchesPublic(c *gin.Context) {
	fmt.Println("[API] POST /api/public/branch/list - Запрос филиалов")

	var request struct {
		Limit  int  `json:"limit,omitempty"`
		Page   int  `json:"page,omitempty"`
		Active bool `json:"active_only,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		// Если нет тела запроса - используем значения по умолчанию
		request.Limit = 100
		request.Page = 1
		request.Active = true
	}

	branches, err := fetchBranchesFromCRM()
	if err != nil {
		fmt.Printf("[API ERROR] Ошибка получения филиалов: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Ошибка получения филиалов из CRM",
			"details": err.Error(),
		})
		return
	}

	fmt.Printf("[API] Успешно получено %d филиалов\n", len(branches))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"items":   branches,
		"meta": gin.H{
			"total": len(branches),
		},
	})
}
