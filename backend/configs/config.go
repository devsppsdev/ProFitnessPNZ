// backend/configs/config.go
package configs

import (
	"os"
	"github.com/joho/godotenv"
)

type Config struct {
	Database struct {
		Host     string
		Port     string
		User     string
		Password string
		Name     string
	}
	CRM struct {
		APIKey  string
		BaseURL string
	}
}

func Load() *Config {
	godotenv.Load(".env") // или "../../.env"
	
	cfg := &Config{}
	
	cfg.Database.Host = getEnv("DB_HOST", "localhost")
	cfg.Database.Port = getEnv("DB_PORT", "5432")
	cfg.Database.User = getEnv("DB_USER", "fitness_user")
	cfg.Database.Password = getEnv("DB_PASSWORD", "")
	cfg.Database.Name = getEnv("DB_NAME", "fitness_app")
	
	cfg.CRM.APIKey = getEnv("CRM_API_KEY", "")
	cfg.CRM.BaseURL = getEnv("CRM_BASE_URL", "")
	
	return cfg
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}