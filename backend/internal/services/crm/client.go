// backend/internal/services/crm/client.go
package crm

type Client struct {
	BaseURL string
	APIKey  string
}

func NewClient(apiKey, baseURL string) (*Client, error) {
	return &Client{
		BaseURL: baseURL,
		APIKey:  apiKey,
	}, nil
}
