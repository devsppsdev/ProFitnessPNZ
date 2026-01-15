// backend/configs/config.go
package configs

import (
	"fmt"
	"os"
	"strings"

	"github.com/goccy/go-yaml"
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

var globalConfig *Config

func Load() (*Config, error) {
	if globalConfig != nil {
		return globalConfig, nil
	}

	// Load .env file if exists
	godotenv.Load(".env")
	godotenv.Load("../.env")
	godotenv.Load("../../.env")

	cfg := &Config{}

	// Try to load from config.yaml (try multiple possible paths)
	configPaths := []string{
		"configs/config.yaml",
		"../configs/config.yaml",
		"../../configs/config.yaml",
		"./config.yaml",
	}

	var configData []byte
	var loadedPath string
	for _, configPath := range configPaths {
		if _, err := os.Stat(configPath); err == nil {
			if data, err := os.ReadFile(configPath); err == nil {
				configData = data
				loadedPath = configPath
				fmt.Printf("[Config] Найден config файл: %s\n", configPath)
				break
			}
		}
	}
	if loadedPath == "" {
		fmt.Printf("[Config] config.yaml не найден ни по одному из путей: %v\n", configPaths)
	}

	if configData != nil {
		var yamlConfig struct {
			Database struct {
				Host     string `yaml:"host"`
				Port     int    `yaml:"port"`
				User     string `yaml:"user"`
				Password string `yaml:"password"`
				DBName   string `yaml:"dbname"`
			} `yaml:"database"`
			CRM struct {
				BaseURL string `yaml:"base_url"`
				APIKey  string `yaml:"api_key"`
			} `yaml:"crm"`
		}

		if err := yaml.Unmarshal(configData, &yamlConfig); err == nil {
			fmt.Printf("[Config] Загружены данные из YAML\n")
			if yamlConfig.CRM.BaseURL != "" {
				cfg.CRM.BaseURL = yamlConfig.CRM.BaseURL
				fmt.Printf("[Config] CRM BaseURL из YAML: %s\n", cfg.CRM.BaseURL)
			}
			if yamlConfig.CRM.APIKey != "" {
				cfg.CRM.APIKey = yamlConfig.CRM.APIKey
			}
			if yamlConfig.Database.Host != "" {
				cfg.Database.Host = yamlConfig.Database.Host
			}
			if yamlConfig.Database.Port > 0 {
				cfg.Database.Port = fmt.Sprintf("%d", yamlConfig.Database.Port)
			}
			if yamlConfig.Database.User != "" {
				cfg.Database.User = yamlConfig.Database.User
			}
			if yamlConfig.Database.Password != "" {
				cfg.Database.Password = yamlConfig.Database.Password
			}
			if yamlConfig.Database.DBName != "" {
				cfg.Database.Name = yamlConfig.Database.DBName
			}
		} else {
			fmt.Printf("[Config] Ошибка парсинга YAML: %v\n", err)
		}
	} else {
		fmt.Printf("[Config] config.yaml не найден, используем значения по умолчанию\n")
	}

	// Environment variables override YAML config
	fmt.Printf("[Config] Проверка переменных окружения...\n")
	cfg.Database.Host = getEnv("DB_HOST", cfg.Database.Host, "localhost")
	cfg.Database.Port = getEnv("DB_PORT", cfg.Database.Port, "5432")
	cfg.Database.User = getEnv("DB_USER", cfg.Database.User, "fitness_user")
	cfg.Database.Password = getEnv("DB_PASSWORD", cfg.Database.Password, "")
	cfg.Database.Name = getEnv("DB_NAME", cfg.Database.Name, "fitness_app")

	// Check if env vars override CRM config
	// Check if env vars override CRM config
	envAPIKey := os.Getenv("CRM_API_KEY")
	envBaseURL := os.Getenv("CRM_BASE_URL")

	// API Key - принимаем только если не пустой
	if envAPIKey != "" {
		cfg.CRM.APIKey = envAPIKey
		fmt.Printf("[Config] CRM APIKey из переменной окружения\n")
	}

	// Base URL - ПРОВЕРЯЕМ что он правильный (/api/public/)
	if envBaseURL != "" {
		// 🔧 ИСПРАВЛЕНИЕ: проверяем что URL содержит правильный путь
		if strings.Contains(envBaseURL, "/api/public/") {
			cfg.CRM.BaseURL = envBaseURL
			fmt.Printf("[Config] CRM BaseURL из переменной окружения: %s\n", cfg.CRM.BaseURL)
		} else {
			// Игнорируем неправильный URL из переменной окружения
			fmt.Printf("[Config] ⚠️ Игнорируем неправильный CRM_BASE_URL из окружения: %s\n", envBaseURL)
			fmt.Printf("[Config] ✅ Используем CRM BaseURL из YAML: %s\n", cfg.CRM.BaseURL)
		}
	} else {
		fmt.Printf("[Config] CRM BaseURL (после всех источников): %s\n", cfg.CRM.BaseURL)
	}

	// Validate CRM config
	if cfg.CRM.APIKey == "" {
		return nil, fmt.Errorf("CRM API key is required (set CRM_API_KEY env var or in config.yaml)")
	}
	if cfg.CRM.BaseURL == "" {
		return nil, fmt.Errorf("CRM Base URL is required (set CRM_BASE_URL env var or in config.yaml)")
	}

	globalConfig = cfg
	return cfg, nil
}

func getEnv(key, currentValue, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	if currentValue != "" {
		return currentValue
	}
	return defaultValue
}

// GetConfig returns the global config instance
func GetConfig() *Config {
	if globalConfig == nil {
		cfg, err := Load()
		if err != nil {
			panic(fmt.Sprintf("Failed to load config: %v", err))
		}
		return cfg
	}
	return globalConfig
}
