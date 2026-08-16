package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

func scanImage(imageData string) ScanResult {
	fallback := ScanResult{
		Valid:         true,
		PlasticType:   "PET (เบอร์ 1 - ขวดน้ำใส)",
		PlasticTypeEN: "PET (#1 - Clear Bottle)",
		BottleCount:   2,
		Confidence:    90,
		Notes:         "ตรวจพบขวดพลาสติก PET (โหมดสำรองเมื่อไม่มี Gemini API key)",
		NotesEN:       "Detected PET bottles (fallback mode without Gemini API key)",
	}

	key := os.Getenv("GEMINI_API_KEY")
	if key == "" {
		return fallback
	}

	mime, b64 := splitDataURL(imageData)
	if b64 == "" {
		return fallback
	}

	body := map[string]any{
		"contents": []map[string]any{
			{
				"parts": []any{
					map[string]string{"text": `You are EcoBin Connect vision. Analyze this photo of waste.
Reply ONLY valid JSON with keys:
valid (boolean: true only if recyclable PET or HDPE plastic bottles),
plastic_type_th, plastic_type_en, bottle_count (int), confidence (0-100), notes_th, notes_en.
If mixed trash or bags, valid=false and bottle_count=0.`},
					map[string]any{
						"inline_data": map[string]string{
							"mime_type": mime,
							"data":      b64,
						},
					},
				},
			},
		},
		"generationConfig": map[string]any{
			"temperature":     0.1,
			"responseMimeType": "application/json",
		},
	}
	raw, _ := json.Marshal(body)
	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + key
	resp, err := http.Post(url, "application/json", bytes.NewReader(raw))
	if err != nil {
		fallback.Notes = "Gemini เรียกไม่สำเร็จ จึงใช้โหมดสำรอง"
		return fallback
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		fallback.Notes = fmt.Sprintf("Gemini HTTP %d จึงใช้โหมดสำรอง", resp.StatusCode)
		return fallback
	}

	var parsed struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(respBody, &parsed); err != nil || len(parsed.Candidates) == 0 || len(parsed.Candidates[0].Content.Parts) == 0 {
		return fallback
	}

	text := strings.TrimSpace(parsed.Candidates[0].Content.Parts[0].Text)
	var g struct {
		Valid         bool    `json:"valid"`
		PlasticTypeTH string  `json:"plastic_type_th"`
		PlasticTypeEN string  `json:"plastic_type_en"`
		BottleCount   int     `json:"bottle_count"`
		Confidence    float64 `json:"confidence"`
		NotesTH       string  `json:"notes_th"`
		NotesEN       string  `json:"notes_en"`
	}
	if err := json.Unmarshal([]byte(text), &g); err != nil {
		return fallback
	}
	if g.BottleCount < 0 {
		g.BottleCount = 0
	}
	if g.PlasticTypeTH == "" {
		g.PlasticTypeTH = fallback.PlasticType
	}
	return ScanResult{
		Valid:         g.Valid,
		PlasticType:   g.PlasticTypeTH,
		PlasticTypeEN: g.PlasticTypeEN,
		BottleCount:   g.BottleCount,
		Confidence:    g.Confidence,
		Notes:         g.NotesTH,
		NotesEN:       g.NotesEN,
	}
}

func splitDataURL(imageData string) (mime, b64 string) {
	mime = "image/jpeg"
	if strings.HasPrefix(imageData, "http://") || strings.HasPrefix(imageData, "https://") {
		resp, err := http.Get(imageData)
		if err != nil {
			return mime, ""
		}
		defer resp.Body.Close()
		data, err := io.ReadAll(resp.Body)
		if err != nil {
			return mime, ""
		}
		ct := resp.Header.Get("Content-Type")
		if strings.HasPrefix(ct, "image/") {
			mime = strings.Split(ct, ";")[0]
		}
		return mime, base64.StdEncoding.EncodeToString(data)
	}
	if strings.HasPrefix(imageData, "data:") {
		parts := strings.SplitN(imageData, ",", 2)
		if len(parts) != 2 {
			return mime, ""
		}
		meta := parts[0]
		if i := strings.Index(meta, ":"); i >= 0 {
			if j := strings.Index(meta, ";"); j > i {
				mime = meta[i+1 : j]
			}
		}
		return mime, parts[1]
	}
	return mime, imageData
}
