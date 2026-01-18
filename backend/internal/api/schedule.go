// backend/internal/api/schedule.go
package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"backend/internal/services/crm"

	"github.com/gin-gonic/gin"
)

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

// GetSchedulePublic - POST эндпоинт для фронтенда
func GetSchedulePublic(c *gin.Context) {
	fmt.Println("[API] POST /api/public/schedule/list - Запрос расписания")

	var request struct {
		DateFrom string `json:"date_from" binding:"required"`
		DateTo   string `json:"date_to,omitempty"`
		BranchID int    `json:"branch_id,omitempty"`
		Limit    int    `json:"limit,omitempty"`
		Page     int    `json:"page,omitempty"`
	}

	today := time.Now().Format("2006-01-02")
	request.DateFrom = today
	request.Limit = 1000
	request.Page = 1

	if err := c.ShouldBindJSON(&request); err != nil {
		fmt.Println("[API] Используем значения по умолчанию")
	}

	// Если date_to не указан, используем date_from + 1 день
	if request.DateTo == "" {
		if fromDate, err := time.Parse("2006-01-02", request.DateFrom); err == nil {
			request.DateTo = fromDate.AddDate(0, 0, 1).Format("2006-01-02")
		} else {
			request.DateTo = request.DateFrom
		}
	}

	fmt.Printf("[API] Параметры: date_from=%s, date_to=%s, branch_id=%d\n",
		request.DateFrom, request.DateTo, request.BranchID)

	allSchedule, err := fetchScheduleFromCRM(request.DateFrom, request.BranchID, request.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Ошибка получения расписания",
			"details": err.Error(),
		})
		return
	}

	fmt.Printf("[API] Получено %d занятий от CRM\n", len(allSchedule))

	// Сортируем перед фильтрацией для отладки
	sort.Slice(allSchedule, func(i, j int) bool {
		if allSchedule[i].Date != allSchedule[j].Date {
			return allSchedule[i].Date < allSchedule[j].Date
		}
		return allSchedule[i].Time < allSchedule[j].Time
	})

	// Фильтруем по диапазону дат
	var filteredSchedule []ScheduleItem
	for i, item := range allSchedule {
		if item.Date >= request.DateFrom && item.Date <= request.DateTo {
			filteredSchedule = append(filteredSchedule, item)
			if i < 3 { // Логируем первые 3 отфильтрованных занятия
				fmt.Printf("[API] Занятие %d: %s %s - %s\n", i, item.Date, item.Time, item.Name)
			}
		}
	}

	fmt.Printf("[API] После фильтрации: %d занятий\n", len(filteredSchedule))

	// Сортируем результат
	sort.Slice(filteredSchedule, func(i, j int) bool {
		if filteredSchedule[i].Date != filteredSchedule[j].Date {
			return filteredSchedule[i].Date < filteredSchedule[j].Date
		}
		return filteredSchedule[i].Time < filteredSchedule[j].Time
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"items":   filteredSchedule,
		"meta": gin.H{
			"total":     len(filteredSchedule),
			"date_from": request.DateFrom,
			"date_to":   request.DateTo,
			"branch_id": request.BranchID,
			"limit":     request.Limit,
			"timestamp": time.Now().Unix(),
		},
	})
}

// GetSchedule - старый GET эндпоинт
func GetSchedule(c *gin.Context) {
	dateFromStr := c.Query("date_from")
	dateToStr := c.Query("date_to")
	limitStr := c.Query("limit")
	branchIDStr := c.Query("branch_id")

	if dateFromStr == "" {
		dateFromStr = time.Now().Format("2006-01-02")
	}

	if dateToStr == "" {
		if fromDate, err := time.Parse("2006-01-02", dateFromStr); err == nil {
			dateToStr = fromDate.AddDate(0, 0, 1).Format("2006-01-02")
		} else {
			dateToStr = dateFromStr
		}
	}

	limit := 1000
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

	fmt.Printf("[API] GET /api/v1/schedule - date_from=%s, date_to=%s, branch_id=%d\n",
		dateFromStr, dateToStr, branchID)

	allSchedule, err := fetchScheduleFromCRM(dateFromStr, branchID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Ошибка получения расписания",
			"details": err.Error(),
		})
		return
	}

	var filteredSchedule []ScheduleItem
	for _, item := range allSchedule {
		if item.Date >= dateFromStr && item.Date <= dateToStr {
			filteredSchedule = append(filteredSchedule, item)
		}
	}

	sort.Slice(filteredSchedule, func(i, j int) bool {
		if filteredSchedule[i].Date != filteredSchedule[j].Date {
			return filteredSchedule[i].Date < filteredSchedule[j].Date
		}
		return filteredSchedule[i].Time < filteredSchedule[j].Time
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    filteredSchedule,
		"meta": gin.H{
			"total":     len(filteredSchedule),
			"date_from": dateFromStr,
			"date_to":   dateToStr,
			"branch_id": branchID,
			"timestamp": time.Now().Unix(),
		},
	})
}

func fetchScheduleFromCRM(dateFrom string, branchID, limit int) ([]ScheduleItem, error) {
	crmClient := crm.GetClient()
	if crmClient == nil {
		return nil, fmt.Errorf("CRM клиент не инициализирован")
	}

	fromTime, err := time.Parse("2006-01-02", dateFrom)
	if err != nil {
		return nil, fmt.Errorf("неверный формат даты: %v", err)
	}

	toTime := fromTime.AddDate(0, 0, 7)

	requestBody := map[string]interface{}{
		"range": map[string]interface{}{
			"from": fromTime.Unix(),
			"to":   toTime.Unix(),
		},
		"filters": map[string]interface{}{
			"branch_id":   []int{branchID},
			"groups":      true,
			"individuals": false,
			"rents":       false,
		},
		"limit": limit,
		"page":  1,
	}

	fmt.Printf("[CRM] Запрашиваем расписание: date=%s, branch=%d\n", dateFrom, branchID)

	body, err := crmClient.PostSchedule("schedule/list", requestBody)
	if err != nil {
		fmt.Printf("[CRM ERROR] Ошибка при запросе к CRM: %v\n", err)
		return nil, fmt.Errorf("ошибка запроса к CRM: %v", err)
	}

	return parseCRMScheduleResponse(body, dateFrom)
}

func parseCRMScheduleResponse(body []byte, requestDate string) ([]ScheduleItem, error) {
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("ошибка парсинга JSON: %v", err)
	}

	var items []interface{}
	found := false

	possibleKeys := []string{"items", "data", "schedules"}
	for _, key := range possibleKeys {
		if data, ok := result[key].([]interface{}); ok {
			items = data
			fmt.Printf("[CRM] Найдено %d занятий\n", len(items))
			found = true
			break
		}
	}

	if !found {
		fmt.Println("[CRM] Не нашли занятия в ответе")
		return []ScheduleItem{}, nil
	}

	// Парсим запрошенную дату
	requestTime, err := time.Parse("2006-01-02", requestDate)
	if err != nil {
		requestTime = time.Now()
	}

	// Определяем день недели запрошенной даты в формате Go
	// Go: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
	requestWeekdayGo := int(requestTime.Weekday())

	fmt.Printf("[CRM] Запрошенная дата: %s, день недели (Go): %d\n", requestDate, requestWeekdayGo)

	var schedule []ScheduleItem
	convertedCount := 0

	for i, item := range items {
		if scheduleData, ok := item.(map[string]interface{}); ok {
			// Получаем день недели занятия из CRM
			classDay, hasDay := scheduleData["day"].(float64)

			// Если есть поле day, фильтруем по нему
			if hasDay {
				crmDay := int(classDay)

				// ИСПРАВЛЕНИЕ: CRM скорее всего использует 1=Sunday, 2=Monday, ..., 7=Saturday
				// Преобразуем день недели CRM в формат Go для сравнения
				// CRM: 1=Sunday -> Go: 0=Sunday
				// CRM: 2=Monday -> Go: 1=Monday
				// ...
				// CRM: 7=Saturday -> Go: 6=Saturday
				crmDayGo := crmDay
				if crmDayGo < 0 {
					crmDayGo = 6 // Обработка если 0
				}

				// Теперь сравниваем дни недели
				if crmDayGo != requestWeekdayGo {
					continue // Это занятие на другой день недели
				}

				// Для отладки
				if i < 3 {
					fmt.Printf("[CRM DEBUG] Занятие %d: CRM day=%d -> Go day=%d, Request Go day=%d\n",
						i, crmDay, crmDayGo, requestWeekdayGo)
				}
			}

			scheduleItem := convertCRMScheduleToItem(scheduleData, requestTime)

			if scheduleItem.ID > 0 {
				// Устанавливаем дату как запрошенную
				scheduleItem.Date = requestDate

				schedule = append(schedule, scheduleItem)
				convertedCount++

				// Логируем для отладки
				if convertedCount <= 5 {
					fmt.Printf("[CRM] Занятие %d: %s %s - %s (CRM day=%v, free=%d/%d)\n",
						i, scheduleItem.Date, scheduleItem.Time, scheduleItem.Name,
						classDay, scheduleItem.FreePlaces, scheduleItem.MaxPlaces)
				}
			}
		}
	}

	fmt.Printf("[CRM] Конвертировано %d/%d занятий для даты %s\n", convertedCount, len(items), requestDate)
	return schedule, nil
}

func convertCRMScheduleToItem(crmData map[string]interface{}, date time.Time) ScheduleItem {
	// Для отладки - покажем структуру данных от CRM
	if day, ok := crmData["day"]; ok {
		fmt.Printf("[CRM DEBUG] convertCRMScheduleToItem: day field value=%v (type: %T)\n", day, day)
	}

	item := ScheduleItem{
		IsActive: true,
		Duration: 60,
		Date:     date.Format("2006-01-02"), // Устанавливаем запрошенную дату
	}

	// ID
	if id, ok := crmData["id"].(float64); ok {
		item.ID = int(id)
	}

	// Время из minutesBegin
	if minutesBegin, ok := crmData["minutesBegin"].(float64); ok {
		hours := int(minutesBegin) / 60
		minutes := int(minutesBegin) % 60
		item.Time = fmt.Sprintf("%02d:%02d", hours, minutes)

		// Длительность
		if minutesEnd, ok := crmData["minutesEnd"].(float64); ok {
			item.Duration = int(minutesEnd - minutesBegin)
		}
	} else {
		item.Time = "00:00"
	}

	// Зал
	if hall, ok := crmData["hall"].(map[string]interface{}); ok {
		if hallID, ok := hall["id"].(float64); ok {
			item.RoomID = int(hallID)
		}
		if hallName, ok := hall["name"].(string); ok {
			item.RoomName = hallName
		}
	}

	// Group данные
	if group, ok := crmData["group"].(map[string]interface{}); ok {
		// Стиль
		if style, ok := group["style"].(map[string]interface{}); ok {
			if styleName, ok := style["name"].(string); ok {
				item.Name = styleName
				item.StyleName = styleName
			}
			if styleID, ok := style["id"].(float64); ok {
				item.StyleID = int(styleID)
			}
		}

		// Места - ВАЖНО: получаем из CRM если есть!
		if places, ok := group["placeCount"].(float64); ok {
			item.MaxPlaces = int(places)

			// Пробуем получить свободные места - возможно есть другие поля
			// Если нет конкретного поля, пока оставляем как есть
			item.FreePlaces = int(places)
		}

		// Тренер
		if teacher, ok := group["teacher1"].(map[string]interface{}); ok {
			if teacherID, ok := teacher["id"].(float64); ok {
				item.CoachID = int(teacherID)
			}
			item.CoachName = formatTeacherName(teacher)
		}
	}

	// Проверяем прямые поля для свободных мест
	// Возможно есть поля: freePlaces, free_places, availablePlaces и т.д.
	if freePlaces, ok := crmData["freePlaces"].(float64); ok {
		item.FreePlaces = int(freePlaces)
	}
	if free_places, ok := crmData["free_places"].(float64); ok {
		item.FreePlaces = int(free_places)
	}
	if availablePlaces, ok := crmData["availablePlaces"].(float64); ok {
		item.FreePlaces = int(availablePlaces)
	}

	// Проверяем поля для забронированных мест
	if reservedPlaces, ok := crmData["reservedPlaces"].(float64); ok {
		// Если есть забронированные места, вычисляем свободные
		item.FreePlaces = item.MaxPlaces - int(reservedPlaces)
		if item.FreePlaces < 0 {
			item.FreePlaces = 0
		}
	}

	// Значения по умолчанию
	if item.Name == "" {
		item.Name = "Групповое занятие"
	}
	if item.CoachName == "" {
		item.CoachName = "Тренер"
	}
	if item.RoomName == "" {
		item.RoomName = "Основной зал"
	}
	if item.MaxPlaces == 0 {
		item.MaxPlaces = 10
	}
	if item.FreePlaces == 0 {
		item.FreePlaces = item.MaxPlaces // По умолчанию все свободны
	}
	if item.FreePlaces > item.MaxPlaces {
		item.FreePlaces = item.MaxPlaces
	}

	return item
}

func getWeekStart(date time.Time) time.Time {
	weekday := int(date.Weekday())
	if weekday == 0 {
		weekday = 7 // Воскресенье
	}
	return date.AddDate(0, 0, -(weekday - 1)) // Возвращаем понедельник
}

func formatTeacherName(teacher map[string]interface{}) string {
	lastName := getString(teacher, "lastName")
	firstName := getString(teacher, "name")
	middleName := getString(teacher, "middleName")

	if lastName == "" && firstName == "" {
		return ""
	}

	name := fmt.Sprintf("%s %s", lastName, firstName)
	if middleName != "" {
		name += " " + middleName
	}

	return strings.TrimSpace(name)
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}
