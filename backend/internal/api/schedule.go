// backend/internal/api/schedule.go
package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
	
	"github.com/gin-gonic/gin"
	"backend/internal/services/crm"
)

// ==================== СТРУКТУРЫ ДАННЫХ ====================

// ScheduleItem - структура для клиентского API
type ScheduleItem struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	Date       string `json:"date"`     // YYYY-MM-DD
	Time       string `json:"time"`     // HH:MM
	Duration   int    `json:"duration"` // минуты
	CoachID    int    `json:"coach_id"`
	CoachName  string `json:"coach_name"`
	RoomID     int    `json:"room_id"`
	RoomName   string `json:"room_name"`
	MaxPlaces  int    `json:"max_places"`
	FreePlaces int    `json:"free_places"`
	StyleID    int    `json:"style_id"`
	StyleName  string `json:"style_name"`
	IsActive   bool   `json:"is_active"`
	HallID     int    `json:"hall_id"`
}

// ==================== ПУБЛИЧНЫЙ API (для фронтенда) ====================

// GetSchedulePublic - POST эндпоинт для фронтенда
func GetSchedulePublic(c *gin.Context) {
	fmt.Println("[API] POST /api/public/schedule/list - Запрос расписания")

	var request struct {
		DateFrom string `json:"date_from"`
		BranchID int    `json:"branch_id,omitempty"`
		Limit    int    `json:"limit,omitempty"`
		Page     int    `json:"page,omitempty"`
	}

	// Устанавливаем значения по умолчанию
	request.Limit = 50
	request.Page = 1

	// Парсим тело запроса
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Неверный формат запроса",
			"details": err.Error(),
		})
		return
	}

	// Проверяем обязательное поле date_from
	if request.DateFrom == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Поле date_from обязательно",
		})
		return
	}

	fmt.Printf("[API] Параметры запроса: date_from=%s, branch_id=%d, limit=%d\n",
		request.DateFrom, request.BranchID, request.Limit)

	// Получаем расписание из CRM
	schedule, err := fetchScheduleFromCRM(request.DateFrom, request.BranchID, request.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Ошибка получения расписания",
			"details": err.Error(),
		})
		return
	}

	fmt.Printf("[API] Успешно получено %d занятий\n", len(schedule))

	// Формируем ответ для фронтенда
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"items":   schedule, // Важно: items для фронтенда
		"meta": gin.H{
			"total":     len(schedule),
			"date_from": request.DateFrom,
			"branch_id": request.BranchID,
			"limit":     request.Limit,
			"timestamp": time.Now().Unix(),
		},
	})
}

// ==================== СТАРЫЙ API (для совместимости) ====================

// GetSchedule - старый GET эндпоинт (оставляем для совместимости)
func GetSchedule(c *gin.Context) {
	// Получаем параметры запроса
	dateFromStr := c.Query("date_from")
	limitStr := c.Query("limit")
	branchIDStr := c.Query("branch_id")

	// Устанавливаем значения по умолчанию
	if dateFromStr == "" {
		dateFromStr = time.Now().Format("2006-01-02")
	}

	limit := 50
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	branchID := 0
	if branchIDStr != "" {
		if parsedBranchID, err := strconv.Atoi(branchIDStr); err == nil {
			branchID = parsedBranchID
		}
	}

	fmt.Printf("[API] GET /api/v1/schedule - date_from=%s, branch_id=%d, limit=%d\n",
		dateFromStr, branchID, limit)

	// Получаем расписание из CRM
	schedule, err := fetchScheduleFromCRM(dateFromStr, branchID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Ошибка получения расписания",
			"details": err.Error(),
		})
		return
	}

	// Старый формат ответа
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    schedule, // data для старого API
		"meta": gin.H{
			"total":     len(schedule),
			"date_from": dateFromStr,
			"branch_id": branchID,
			"timestamp": time.Now().Unix(),
		},
	})
}

// GetScheduleItem - получение конкретного занятия (если нужно)
// Исправленная функция GetScheduleItem в schedule.go
func GetScheduleItem(c *gin.Context) {
	scheduleID := c.Param("id")
	if scheduleID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Не указан ID занятия",
		})
		return
	}

	// ИЗМЕНЕНО: используем другое имя переменной
	scheduleIDInt, err := strconv.Atoi(scheduleID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Неверный формат ID",
		})
		return
	}

	// Получаем занятие по ID
	// TODO: реализовать получение по ID
	// item, err := fetchScheduleItemByID(scheduleIDInt)
	// if err != nil {
	//     c.JSON(http.StatusInternalServerError, gin.H{
	//         "success": false,
	//         "error":   "Ошибка получения занятия",
	//         "details": err.Error(),
	//     })
	//     return
	// }

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    nil,
		"message": fmt.Sprintf("Функция в разработке (ID: %d)", scheduleIDInt),
	})
}

// ==================== ОБЩАЯ ЛОГИКА ====================

// fetchScheduleFromCRM - получение расписания из CRM API
func fetchScheduleFromCRM(dateFrom string, branchID, limit int) ([]ScheduleItem, error) {
	crmClient := crm.GetClient()
	if crmClient == nil {
		return nil, fmt.Errorf("CRM клиент не инициализирован")
	}

	// Парсим дату
	fromTime, err := time.Parse("2006-01-02", dateFrom)
	if err != nil {
		return nil, fmt.Errorf("неверный формат даты: %v", err)
	}

	toTime := fromTime.AddDate(0, 0, 1) // +1 день

	// Формируем запрос к CRM
	requestBody := map[string]interface{}{
		"fields": []string{"id", "date", "group", "branch"},
		"limit":  limit,
		"page":   1,
		"sort":   map[string]string{"date": "asc"},
		"columns": map[string]interface{}{
			"date": map[string]interface{}{
				"from": fromTime.Unix(),
				"to":   toTime.Unix(),
			},
		},
	}

	// Если указан branch_id - добавляем фильтр
	if branchID > 0 {
		if columns, ok := requestBody["columns"].(map[string]interface{}); ok {
			columns["branch.id"] = branchID
		}
	}

	fmt.Printf("[CRM] Запрашиваем расписание: date=%s, branch=%d, limit=%d\n",
		dateFrom, branchID, limit)

	body, err := crmClient.Post("schedule/list", requestBody)
	if err != nil {
		return nil, err
	}

	// Парсим ответ CRM
	return parseCRMScheduleResponse(body)
}

// parseCRMScheduleResponse - парсинг ответа от CRM
func parseCRMScheduleResponse(body []byte) ([]ScheduleItem, error) {
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("ошибка парсинга JSON: %v", err)
	}

	var schedule []ScheduleItem

	// Ищем данные в разных вариантах ответа CRM
	var items []interface{}
	var found bool

	// Вариант 1: items
	if data, ok := result["items"].([]interface{}); ok {
		items = data
		found = true
		fmt.Printf("[CRM] Найдено %d занятий в 'items'\n", len(items))
	}

	// Вариант 2: data
	if !found {
		if data, ok := result["data"].([]interface{}); ok {
			items = data
			found = true
			fmt.Printf("[CRM] Найдено %d занятий в 'data'\n", len(items))
		}
	}

	// Если ничего не нашли
	if !found {
		fmt.Println("[CRM] В ответе нет ни items, ни data")
		return schedule, nil
	}

	// Обрабатываем каждое занятие
	for _, item := range items {
		if scheduleData, ok := item.(map[string]interface{}); ok {
			scheduleItem := convertCRMScheduleToItem(scheduleData)
			// Добавляем только если есть ID
			if scheduleItem.ID > 0 {
				schedule = append(schedule, scheduleItem)
			}
		}
	}

	fmt.Printf("[CRM] Успешно сконвертировано %d занятий\n", len(schedule))
	return schedule, nil
}

// convertCRMScheduleToItem - конвертация данных CRM в ScheduleItem
func convertCRMScheduleToItem(crmData map[string]interface{}) ScheduleItem {
	item := ScheduleItem{
		IsActive: true,
		HallID:   1,
		Duration: 60,
	}

	// ID
	if id, ok := crmData["id"].(float64); ok {
		item.ID = int(id)
	}

	// Дата и время (Unix timestamp)
	if dateUnix, ok := crmData["date"].(float64); ok {
		t := time.Unix(int64(dateUnix), 0)
		item.Date = t.Format("2006-01-02")
		item.Time = t.Format("15:04")
	}

	// Branch (филиал)
	if branch, ok := crmData["branch"].(map[string]interface{}); ok {
		if branchID, ok := branch["id"].(float64); ok {
			item.HallID = int(branchID)
		}
		if branchName, ok := branch["name"].(string); ok {
			item.RoomName = branchName
		}
	}

	// Group данные
	if group, ok := crmData["group"].(map[string]interface{}); ok {
		// Стиль тренировки
		if style, ok := group["style"].(map[string]interface{}); ok {
			if styleName, ok := style["name"].(string); ok {
				item.Name = styleName
				item.StyleName = styleName
			}
			if styleID, ok := style["id"].(float64); ok {
				item.StyleID = int(styleID)
			}
		}

		// Места
		if places, ok := group["placeCount"].(float64); ok {
			item.MaxPlaces = int(places)
			item.FreePlaces = int(places) // Временно, потом из CRM
		}

		// Тренер
		if teacher, ok := group["teacher1"].(map[string]interface{}); ok {
			if teacherID, ok := teacher["id"].(float64); ok {
				item.CoachID = int(teacherID)
			}

			lastName := getString(teacher, "lastName")
			firstName := getString(teacher, "name")
			middleName := getString(teacher, "middleName")

			if lastName != "" || firstName != "" {
				item.CoachName = fmt.Sprintf("%s %s", lastName, firstName)
				if middleName != "" {
					item.CoachName += " " + middleName
				}
				item.CoachName = strings.TrimSpace(item.CoachName)
			}
		}
	}

	// Значения по умолчанию
	if item.Name == "" {
		item.Name = "Занятие"
	}
	if item.CoachName == "" {
		item.CoachName = "Тренер"
	}
	if item.RoomName == "" {
		item.RoomName = "Основной зал"
	}
	if item.MaxPlaces == 0 {
		item.MaxPlaces = 10
		item.FreePlaces = 10
	}

	return item
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// getString - безопасное получение строки из map
func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}
