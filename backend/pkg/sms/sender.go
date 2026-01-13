// backend/pkg/sms/sender.go
package sms

import "fmt"

type Sender interface {
	SendCode(phone, code string) error
}

type DevSender struct{} // Заглушка для разработки

func (s *DevSender) SendCode(phone, code string) error {
	// В режиме разработки просто выводим код в консоль
	fmt.Printf("SMS code for %s: %s\n", phone, code)
	return nil
}