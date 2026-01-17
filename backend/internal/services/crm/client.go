// backend/internal/services/crm/client.go
package crm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

type Client struct {
	BaseURL    string
	APIKey     string
	PHPSESSID  string // ← ДОБАВЛЯЕМ сессию
	httpClient *http.Client
}

var (
	globalClient *Client
	clientOnce   sync.Once
	clientMutex  sync.RWMutex
)

func NewClient(apiKey, baseURL string) (*Client, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("CRM API key is required")
	}
	if baseURL == "" {
		return nil, fmt.Errorf("CRM base URL is required")
	}

	return &Client{
		BaseURL: baseURL,
		APIKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}, nil
}

// SetSession устанавливает PHPSESSID для schedule запросов
func (c *Client) SetSession(sessionID string) {
	clientMutex.Lock()
	defer clientMutex.Unlock()
	c.PHPSESSID = sessionID
	fmt.Printf("[CRM Client] Установлена сессия: %s\n", sessionID)
}

// InitGlobalClient initializes the global CRM client
func InitGlobalClient(apiKey, baseURL string) error {
	var err error
	clientOnce.Do(func() {
		globalClient, err = NewClient(apiKey, baseURL)
	})
	return err
}

// GetClient returns the global CRM client instance
func GetClient() *Client {
	clientMutex.RLock()
	defer clientMutex.RUnlock()
	return globalClient
}

// Post makes a POST request to the CRM API
func (c *Client) Post(endpoint string, requestBody map[string]interface{}) ([]byte, error) {
	// Ensure base URL ends with / and endpoint doesn't start with /
	baseURL := c.BaseURL
	if !strings.HasSuffix(baseURL, "/") {
		baseURL += "/"
	}
	if strings.HasPrefix(endpoint, "/") {
		endpoint = endpoint[1:]
	}
	url := baseURL + endpoint
	
	// Если это schedule и есть сессия - добавляем PHPSESSID
	if strings.Contains(endpoint, "schedule") && c.PHPSESSID != "" {
		url += "?PHPSESSID=" + c.PHPSESSID
		fmt.Printf("[CRM Client] Используем сессию для schedule\n")
	}

	fmt.Printf("[CRM Client] Base URL: %s\n", c.BaseURL)
	fmt.Printf("[CRM Client] Endpoint: %s\n", endpoint)
	fmt.Printf("[CRM Client] Full URL: %s\n", url)

	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("ошибка формирования запроса: %v", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("ошибка создания запроса: %v", err)
	}

	// Для schedule используем заголовки из curl, для остального - API ключ
	if strings.Contains(endpoint, "schedule") && c.PHPSESSID != "" {
		// Schedule запросы с сессией
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json, text/plain, */*")
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
		req.Header.Set("Referer", "https://profitnes31gmailcom.impulsecrm.ru/schedule")
		req.Header.Set("Origin", "https://profitnes31gmailcom.impulsecrm.ru")
		
		// Добавляем куки из curl
		req.AddCookie(&http.Cookie{Name: "__ddg1_", Value: "FShvcfz1cefpptcSeJdc"})
		req.AddCookie(&http.Cookie{Name: "tmr_lvid", Value: "a57f165f9924a6ae5471720dbb3be8cf"})
		req.AddCookie(&http.Cookie{Name: "_ga", Value: "GA1.2.56413904.1768222878"})
		req.AddCookie(&http.Cookie{Name: "_gid", Value: "GA1.2.1673474388.1768669185"})
	} else {
		// Обычные запросы с API ключом
		req.SetBasicAuth("", c.APIKey)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")
	}

	fmt.Printf("[CRM Client] Отправка запроса...\n")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		fmt.Printf("[CRM Client ERROR] Ошибка подключения: %v\n", err)
		return nil, fmt.Errorf("ошибка подключения к CRM: %v", err)
	}
	defer resp.Body.Close()

	fmt.Printf("[CRM Client] Получен ответ, статус: %d\n", resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("ошибка чтения ответа: %v", err)
	}

	// Log response headers for debugging
	fmt.Printf("[CRM Client] Response Headers: Content-Type: %s\n", resp.Header.Get("Content-Type"))

	if resp.StatusCode != http.StatusOK {
		preview := string(body)
		if len(preview) > 500 {
			preview = preview[:500] + "..."
		}
		fmt.Printf("[CRM Client ERROR] Статус %d, тело ответа: %s\n", resp.StatusCode, preview)
		return nil, fmt.Errorf("CRM API вернул ошибку %d: %s", resp.StatusCode, preview)
	}

	// Check if response is actually JSON
	if len(body) > 0 && body[0] != '{' && body[0] != '[' {
		// Response is not JSON, probably HTML or XML
		preview := string(body)
		if len(preview) > 1000 {
			preview = preview[:1000] + "..."
		}
		fmt.Printf("[CRM Client ERROR] Ответ не является JSON. Первые 200 символов: %s\n", preview[:min(200, len(preview))])
		return nil, fmt.Errorf("CRM API вернул не-JSON ответ (возможно HTML/XML). Content-Type: %s, начало: %s",
			resp.Header.Get("Content-Type"), preview[:min(200, len(preview))])
	}

	fmt.Printf("[CRM Client] Успешный JSON ответ, размер: %d байт\n", len(body))
	return body, nil
}

// PostSchedule - специальный метод для schedule с правильными заголовками
func (c *Client) PostSchedule(endpoint string, requestBody map[string]interface{}) ([]byte, error) {
	if c.PHPSESSID == "" {
		return nil, fmt.Errorf("PHPSESSID не установлен для schedule запросов")
	}

	baseURL := c.BaseURL
	if !strings.HasSuffix(baseURL, "/") {
		baseURL += "/"
	}
	if strings.HasPrefix(endpoint, "/") {
		endpoint = endpoint[1:]
	}
	
	url := baseURL + endpoint + "?PHPSESSID=" + c.PHPSESSID
	fmt.Printf("[CRM Schedule Client] URL: %s\n", url)

	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("ошибка формирования запроса: %v", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("ошибка создания запроса: %v", err)
	}

	// Точные заголовки из curl
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0")
	req.Header.Set("Referer", "https://profitnes31gmailcom.impulsecrm.ru/schedule")
	req.Header.Set("Origin", "https://profitnes31gmailcom.impulsecrm.ru")
	req.Header.Set("Cache-Control", "no-cache")
	req.Header.Set("Pragma", "no-cache")
	
	// Куки
	req.AddCookie(&http.Cookie{Name: "__ddg1_", Value: "FShvcfz1cefpptcSeJdc"})
	req.AddCookie(&http.Cookie{Name: "tmr_lvid", Value: "a57f165f9924a6ae5471720dbb3be8cf"})
	req.AddCookie(&http.Cookie{Name: "_ga", Value: "GA1.2.56413904.1768222878"})
	req.AddCookie(&http.Cookie{Name: "_gid", Value: "GA1.2.1673474388.1768669185"})
	req.AddCookie(&http.Cookie{Name: "_ym_uid", Value: "1768222879598196267"})
	req.AddCookie(&http.Cookie{Name: "_ym_d", Value: "1768222879"})
	req.AddCookie(&http.Cookie{Name: "_ym_isad", Value: "2"})
	req.AddCookie(&http.Cookie{Name: "tmr_lvidTS", Value: "1768222877470"})

	fmt.Printf("[CRM Schedule Client] Отправка schedule запроса...\n")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ошибка подключения: %v", err)
	}
	defer resp.Body.Close()

	fmt.Printf("[CRM Schedule Client] Статус: %d\n", resp.StatusCode)
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("ошибка чтения ответа: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Schedule API ошибка %d: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Get makes a GET request to the CRM API
func (c *Client) Get(endpoint string) ([]byte, error) {
	baseURL := c.BaseURL
	if !strings.HasSuffix(baseURL, "/") {
		baseURL += "/"
	}
	if strings.HasPrefix(endpoint, "/") {
		endpoint = endpoint[1:]
	}
	url := baseURL + endpoint

	fmt.Printf("[CRM Client] GET запрос к: %s\n", url)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("ошибка создания запроса: %v", err)
	}

	req.SetBasicAuth("", c.APIKey)
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ошибка подключения к CRM: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("ошибка чтения ответа: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("CRM API вернул ошибку %d: %s", resp.StatusCode, string(body))
	}

	return body, nil
}