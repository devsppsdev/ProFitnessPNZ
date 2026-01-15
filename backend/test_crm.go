// backend/test_impulse_api.go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

func main() {
    apiKey := "0cfefe8ddcb57f74c351bc1791372c30"
    baseURL := "https://profitnes31gmailcom.impulsecrm.ru/api/public/"
    
    fmt.Println("🧪 Тест ImpulseCRM API с правильными timestamp")
    fmt.Println("==============================================")
    
    // Тест 1: ТОЧНО как в их примере
    test1(apiKey, baseURL)
    
    // Тест 2: Для расписания с правильными датами
    test2(apiKey, baseURL)
}

func test1(apiKey, baseURL string) {
    fmt.Println("\n1. Тест как в документации (клиенты):")
    
    // ТОЧНЫЕ значения из их примера
    requestBody := map[string]interface{}{
        "fields": []string{"id", "lastName", "name", "middleName"},
        "limit":  10,
        "page":   1,
        "sort": map[string]string{"created": "desc"},
        "columns": map[string]interface{}{
            "created": map[string]int64{
                "from": 161115200,  // МИЛЛИСЕКУНДЫ!
                "to":   173569600,  // МИЛЛИСЕКУНДЫ!
            },
        },
    }
    
    sendRequest(apiKey, baseURL+"client/list", requestBody)
}

func test2(apiKey, baseURL string) {
    fmt.Println("\n2. Тест для расписания:")
    
    now := time.Now()
    weekLater := now.AddDate(0, 0, 7)
    
    requestBody := map[string]interface{}{
        "fields": []string{"id", "name", "date", "time", "coach"},
        "limit":  5,
        "page":   1,
        "sort": map[string]string{"date": "asc"},
        "columns": map[string]interface{}{
            "date": map[string]int64{
                "from": now.Unix() * 1000,       // В миллисекунды!
                "to":   weekLater.Unix() * 1000, // В миллисекунды!
            },
        },
    }
    
    sendRequest(apiKey, baseURL+"event/list", requestBody)
}

func sendRequest(apiKey, url string, bodyData map[string]interface{}) {
    bodyBytes, _ := json.Marshal(bodyData)
    
    req, _ := http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
    req.Header.Set("Authorization", "Basic "+apiKey)
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{Timeout: 10 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        fmt.Printf("   ❌ Ошибка: %v\n", err)
        return
    }
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    
    fmt.Printf("   URL: %s\n", url)
    fmt.Printf("   Статус: %d\n", resp.StatusCode)
    
    if resp.StatusCode == 200 {
        fmt.Printf("   ✅ УСПЕХ!\n")
        
        var result interface{}
        json.Unmarshal(body, &result)
        
        // Красивый вывод JSON
        pretty, _ := json.MarshalIndent(result, "   ", "  ")
        fmt.Printf("   Ответ:\n%s\n", string(pretty))
    } else {
        fmt.Printf("   ❌ Ошибка: %s\n", string(body))
        
        // Выводим отправленные данные для отладки
        sentData, _ := json.MarshalIndent(bodyData, "   ", "  ")
        fmt.Printf("   Отправленные данные:\n%s\n", string(sentData))
    }
}