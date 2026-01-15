package models

// Структуры для ответов ImpulseCRM
type CRMClient struct {
    ID        int    `json:"id"`
    Name      string `json:"name"`
    LastName  string `json:"lastName"`
    Phone     string `json:"phone"`
    Email     string `json:"email"`
    BirthDate string `json:"birthDate"`
}

type CRMReservation struct {
    ID         int    `json:"id"`
    ClientID   int    `json:"client_id"`
    ScheduleID int    `json:"schedule_id"`
    Status     string `json:"status"` // 'active', 'cancelled', 'visited'
    CreatedAt  string `json:"created"`
}