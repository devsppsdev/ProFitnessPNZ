// backend/internal/models/user.go
package models

type AppUser struct {
    ID          string `json:"id" db:"id"`
    CRMClientID int    `json:"crm_client_id" db:"crm_client_id"`
    Phone       string `json:"phone" db:"phone"`
    NotificationPref string `json:"notification_pref" db:"notification_preference"`
    TelegramChatID *int64 `json:"telegram_chat_id" db:"telegram_chat_id"`
    CreatedAt   string `json:"created_at" db:"created_at"`
}

