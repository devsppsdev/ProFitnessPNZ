// backend/internal/api/auth.go
package api

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"backend/internal/services/crm"
)

// ==================== СТРУКТУРЫ ДАННЫХ ====================

// SessionStore - структура для хранения сессии
type SessionStore struct {
	Phone      string    `json:"phone"`
	Code       string    `json:"code"`
	ExpiresAt  time.Time `json:"expires_at"`
	ClientID   int       `json:"client_id"`
	ClientName string    `json:"client_name"`
}

// In-memory хранилище сессий (для разработки)
var sessions = make(map[string]SessionStore)

// JWT секретный ключ
var jwtSecret = []byte("your-secret-key-change-in-production")

// ==================== ОБРАБОТЧИКИ API ====================

// SendCode - отправка SMS кода
func SendCode(c *gin.Context) {
	var req struct {
		Phone string `json:"phone" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат запроса"})
		return
	}

	fmt.Printf("[DEBUG] Запрос кода для телефона: %s\n", req.Phone)

	// Временное решение для разработки - пропускаем CRM
	sessionID := generateSessionID()
	code := generateCode()

	sessions[sessionID] = SessionStore{
		Phone:      req.Phone,
		Code:       code,
		ExpiresAt:  time.Now().Add(10 * time.Minute),
		ClientID:   1,
		ClientName: "Тестовый Клиент",
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Код отправлен на телефон",
		"session_id": sessionID,
		"debug": gin.H{
			"code":        code,
			"client_id":   1,
			"client_name": "Тестовый Клиент",
			"expires_in":  "10 минут",
		},
		"note": "CRM проверка временно отключена для разработки",
	})
}

// VerifyCode - проверка SMS кода
func VerifyCode(c *gin.Context) {
	var req struct {
		SessionID string `json:"session_id" binding:"required"`
		Code      string `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат запроса"})
		return
	}

	// Проверяем сессию
	session, exists := sessions[req.SessionID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Сессия не найдена или истекла"})
		return
	}

	// Проверяем срок действия
	if time.Now().After(session.ExpiresAt) {
		delete(sessions, req.SessionID)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Срок действия кода истек"})
		return
	}

	// Проверяем код
	if session.Code != req.Code {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный код подтверждения"})
		return
	}

	// Генерируем JWT токен
	token, err := generateJWTToken(session.Phone, session.ClientID, session.ClientName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка генерации токена"})
		return
	}

	// Удаляем использованную сессию
	delete(sessions, req.SessionID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Авторизация успешна",
		"token":   token,
		"client": gin.H{
			"id":    session.ClientID,
			"name":  session.ClientName,
			"phone": session.Phone,
		},
	})
}

// AuthByPhone - авторизация по номеру телефона (комбинированный метод)
func AuthByPhone(c *gin.Context) {
	var req struct {
		Phone string `json:"phone" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат запроса"})
		return
	}

	// Проверяем клиента в CRM
	clientInfo, err := findClientInCRM(req.Phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Ошибка при подключении к CRM",
			"details": err.Error(),
		})
		return
	}

	// Если клиент не найден
	if clientInfo == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Клиент не найден",
			"message": "Извините, мы не нашли ваш номер телефона в нашей базе. " +
				"Пожалуйста, обратитесь на ресепшн.",
		})
		return
	}

	// Извлекаем данные клиента
	clientID, clientName := extractClientData(clientInfo)

	// Генерируем токен (в MVP пропускаем SMS проверку)
	token, err := generateJWTToken(req.Phone, clientID, clientName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка генерации токена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Авторизация успешна",
		"token":   token,
		"client": gin.H{
			"id":    clientID,
			"name":  clientName,
			"phone": req.Phone,
		},
		"note": "В MVP пропущена проверка SMS кода",
	})
}

// GetClientInfo - получение информации о клиенте
func GetClientInfo(c *gin.Context) {
	clientID, _ := c.Get("client_id")
	phone, _ := c.Get("phone")
	name, _ := c.Get("name")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"client": gin.H{
			"id":    clientID,
			"phone": phone,
			"name":  name,
		},
	})
}

// ==================== РАБОТА С CRM API ====================

// findClientInCRM - поиск клиента в CRM
func findClientInCRM(phone string) (map[string]interface{}, error) {
	crmClient := crm.GetClient()
	if crmClient == nil {
		return nil, fmt.Errorf("CRM клиент не инициализирован")
	}

	requestBody := map[string]interface{}{
		"fields": []string{"id", "firstName", "lastName", "middleName", "phone", "abonement"},
		"limit":  1,
		"page":   1,
		"sort":   map[string]string{"created": "desc"},
		"columns": map[string]interface{}{
			"phone":    phone,
			"isActive": true,
			"created": map[string]int{
				"from": 161115200,
				"to":   173569600,
			},
		},
	}

	body, err := crmClient.Post("client/list", requestBody)
	if err != nil {
		return nil, fmt.Errorf("ошибка подключения к CRM: %v", err)
	}

	fmt.Printf("[CRM DEBUG] Ответ: %s\n", string(body[:min(500, len(body))]))

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("ошибка парсинга JSON: %v", err)
	}

	// Ищем клиента в items
	if items, ok := result["items"].([]interface{}); ok && len(items) > 0 {
		fmt.Printf("[CRM DEBUG] Найдено %d клиентов\n", len(items))
		if clientData, ok := items[0].(map[string]interface{}); ok {
			return clientData, nil
		}
	}

	// Ищем в data (на всякий случай)
	if data, ok := result["data"].([]interface{}); ok && len(data) > 0 {
		fmt.Printf("[CRM DEBUG] Найдено %d клиентов в ключе 'data'\n", len(data))
		if clientData, ok := data[0].(map[string]interface{}); ok {
			return clientData, nil
		}
	}

	fmt.Printf("[CRM DEBUG] Клиент не найден\n")
	return nil, nil
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// extractClientData - извлечение данных клиента
// extractClientData - извлечение данных клиента
// extractClientData - извлечение данных клиента
func extractClientData(clientInfo map[string]interface{}) (int, string) {
	clientID := 0
	clientName := ""

	if id, ok := clientInfo["id"].(float64); ok {
		clientID = int(id)
	}

	// ИСПРАВЛЕНО: Правильное объявление переменных
	firstName, _ := clientInfo["firstName"].(string)   // было lastName
	lastName, _ := clientInfo["lastName"].(string)     // было firstName (но это ошибка)
	middleName, _ := clientInfo["middleName"].(string) // было middleName (правильно)

	if firstName != "" || lastName != "" {
		// Правильный порядок: Фамилия Имя Отчество
		clientName = fmt.Sprintf("%s %s %s", lastName, firstName, middleName)
	} else {
		// Резервный вариант
		clientName = "Клиент"
	}

	return clientID, strings.TrimSpace(clientName)
}

// generateCode - генерация 4-значного кода
func generateCode() string {
	max := big.NewInt(9999)
	n, _ := rand.Int(rand.Reader, max)
	return fmt.Sprintf("%04d", n.Int64()+1)
}

// generateSessionID - генерация ID сессии
func generateSessionID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

// generateJWTToken - генерация JWT токена
func generateJWTToken(phone string, clientID int, clientName string) (string, error) {
	claims := jwt.MapClaims{
		"phone":     phone,
		"client_id": clientID,
		"name":      clientName,
		"hall_id":   0, // ПОКА НЕИЗВЕСТНО
		"exp":       time.Now().Add(30 * 24 * time.Hour).Unix(),
		"iat":       time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ValidateTokenMiddleware - middleware для проверки JWT токена
func ValidateTokenMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Требуется авторизация"})
			c.Abort()
			return
		}

		// Извлекаем токен (формат: "Bearer <token>")
		if len(authHeader) < 8 || authHeader[:7] != "Bearer " {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный формат токена"})
			c.Abort()
			return
		}

		tokenString := authHeader[7:]

		// Парсим токен
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("неверный метод подписи")
			}
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Недействительный токен"})
			c.Abort()
			return
		}

		// Сохраняем данные в контекст
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			c.Set("phone", claims["phone"])
			c.Set("client_id", claims["client_id"])
			c.Set("name", claims["name"])
		}

		c.Next()
	}
}

// min - вспомогательная функция
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
