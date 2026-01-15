package crm

import (
    "encoding/base64"
    
)

func GetAuthHeader(apiKey string) string {
    // Кодируем ":{apiKey}" в base64 (как в PowerShell)
    authString := ":" + apiKey
    encoded := base64.StdEncoding.EncodeToString([]byte(authString))
    return "Basic " + encoded
}