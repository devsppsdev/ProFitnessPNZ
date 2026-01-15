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

	// Set authentication header
	req.SetBasicAuth("", c.APIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

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

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Get makes a GET request to the CRM API
// NOTE: Most CRM API endpoints (like /list endpoints) only support POST, not GET.
// Use Post() method for list endpoints.
func (c *Client) Get(endpoint string) ([]byte, error) {
	// Ensure base URL ends with / and endpoint doesn't start with /
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

	// Set authentication header
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
