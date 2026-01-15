// backend/internal/api/teachers.go
package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"backend/internal/services/crm"
)

// TeacherResponse - структура ответа для тренеров
type TeacherResponse struct {
	ID         int    `json:"id"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	MiddleName string `json:"middle_name"`
	FullName   string `json:"full_name"`
	HallID     int    `json:"hall_id"`
	Phone      string `json:"phone"`
	Email      string `json:"email"`
	IsActive   bool   `json:"is_active"`
}

// ==================== ПУБЛИЧНЫЙ API (для фронтенда) ====================

// GetTeachersPublic - POST эндпоинт для фронтенда
func GetTeachersPublic(c *gin.Context) {
	fmt.Println("[API] POST /api/public/teacher/list - Запрос тренеров")

	var request struct {
		Limit  int  `json:"limit,omitempty"`
		Page   int  `json:"page,omitempty"`
		Active bool `json:"active_only,omitempty"`
	}

	// Значения по умолчанию
	request.Limit = 100
	request.Page = 1
	request.Active = true

	// Парсим тело запроса (если есть)
	if err := c.ShouldBindJSON(&request); err != nil {
		// Если тело пустое - используем значения по умолчанию
		fmt.Println("[API] Используем значения по умолчанию")
	}

	// Получаем тренеров из CRM
	teachers, err := fetchTeachersFromCRM(request.Limit, request.Page, request.Active)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Ошибка получения тренеров",
			"details": err.Error(),
		})
		return
	}

	fmt.Printf("[API] Успешно получено %d тренеров\n", len(teachers))

	// Формируем ответ для фронтенда
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"items":   teachers, // Важно: items для фронтенда
		"meta": gin.H{
			"total":     len(teachers),
			"limit":     request.Limit,
			"page":      request.Page,
			"timestamp": time.Now().Unix(),
		},
	})
}

// ==================== СТАРЫЙ API (для совместимости) ====================

// GetTeachers - старый GET эндпоинт (оставляем для совместимости)
func GetTeachers(c *gin.Context) {
	fmt.Println("[API] GET /api/v1/teacher - Запрос тренеров")

	teachers, err := fetchTeachersFromCRM(100, 1, true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Ошибка получения тренеров",
			"details": err.Error(),
		})
		return
	}

	// Старый формат ответа
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    teachers, // data для старого API
		"meta": gin.H{
			"total":     len(teachers),
			"timestamp": time.Now().Unix(),
		},
	})
}

// ==================== ОБЩАЯ ЛОГИКА ====================

// fetchTeachersFromCRM - получение тренеров из CRM API
func fetchTeachersFromCRM(limit, page int, activeOnly bool) ([]TeacherResponse, error) {
	crmClient := crm.GetClient()
	if crmClient == nil {
		return nil, fmt.Errorf("CRM клиент не инициализирован")
	}

	// Формируем запрос к CRM
	requestBody := map[string]interface{}{
		"fields": []string{"id", "firstName", "lastName", "middleName", "phone", "email", "isActive"},
		"limit":  limit,
		"page":   page,
		"sort":   map[string]string{"lastName": "asc"},
	}

	// Добавляем фильтр по активности если нужно
	if activeOnly {
		requestBody["columns"] = map[string]interface{}{
			"isActive": true,
		}
	}

	fmt.Printf("[CRM] Запрашиваем тренеров: limit=%d, page=%d, active=%v\n",
		limit, page, activeOnly)

	body, err := crmClient.Post("teacher/list", requestBody)
	if err != nil {
		return nil, err
	}

	// Парсим ответ CRM
	return parseCRMTeachersResponse(body)
}

// parseCRMTeachersResponse - парсинг ответа от CRM
func parseCRMTeachersResponse(body []byte) ([]TeacherResponse, error) {
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("ошибка парсинга JSON: %v", err)
	}

	var teachers []TeacherResponse

	// Ищем данные в разных вариантах ответа CRM
	var items []interface{}
	var found bool

	// Вариант 1: items
	if data, ok := result["items"].([]interface{}); ok {
		items = data
		found = true
		fmt.Printf("[CRM] Найдено %d тренеров в 'items'\n", len(items))
	}

	// Вариант 2: data
	if !found {
		if data, ok := result["data"].([]interface{}); ok {
			items = data
			found = true
			fmt.Printf("[CRM] Найдено %d тренеров в 'data'\n", len(items))
		}
	}

	// Если ничего не нашли
	if !found {
		fmt.Println("[CRM] В ответе нет ни items, ни data")
		return teachers, nil
	}

	// Обрабатываем каждого тренера
	for _, item := range items {
		if teacherData, ok := item.(map[string]interface{}); ok {
			teacher := convertCRMTeacherToResponse(teacherData)
			// Добавляем только если есть ID
			if teacher.ID > 0 {
				teachers = append(teachers, teacher)
			}
		}
	}

	fmt.Printf("[CRM] Успешно сконвертировано %d тренеров\n", len(teachers))
	return teachers, nil
}

// convertCRMTeacherToResponse - конвертация данных CRM в TeacherResponse
func convertCRMTeacherToResponse(crmTeacher map[string]interface{}) TeacherResponse {
	teacher := TeacherResponse{
		HallID:   1, // По умолчанию связываем с первым филиалом
		IsActive: true,
	}

	// ID
	if id, ok := crmTeacher["id"].(float64); ok {
		teacher.ID = int(id)
	}

	// Имя и фамилия
	lastName, _ := crmTeacher["lastName"].(string)
	firstName, _ := crmTeacher["name"].(string) // ВАЖНО: в CRM имя в поле "name"
	middleName, _ := crmTeacher["middleName"].(string)

	teacher.LastName = lastName
	teacher.FirstName = firstName
	teacher.MiddleName = middleName

	// Формируем полное имя
	if lastName != "" && firstName != "" {
		teacher.FullName = fmt.Sprintf("%s %s", lastName, firstName)
		if middleName != "" {
			teacher.FullName += " " + middleName
		}
	} else if lastName != "" {
		teacher.FullName = lastName
	} else if firstName != "" {
		teacher.FullName = firstName
	} else {
		teacher.FullName = "Тренер"
	}

	// Телефон (в CRM это может быть массив)
	if phones, ok := crmTeacher["phone"].([]interface{}); ok && len(phones) > 0 {
		if phone, ok := phones[0].(string); ok {
			teacher.Phone = phone
		}
	} else if phone, ok := crmTeacher["phone"].(string); ok {
		// Или просто строка
		teacher.Phone = phone
	}

	// Email
	if email, ok := crmTeacher["email"].(string); ok {
		teacher.Email = email
	}

	// Активность
	if isActive, ok := crmTeacher["isActive"].(bool); ok {
		teacher.IsActive = isActive
	}

	return teacher
}
