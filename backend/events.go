package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"strings"
	"time"
)

// Event types used across EcoBin for audit / recovery trails.
const (
	EventModelClassify       = "MODEL_CLASSIFY"
	EventWasteSubmitted      = "WASTE_SUBMITTED"
	EventPointsAwarded       = "POINTS_AWARDED"
	EventGuestScan           = "GUEST_SCAN"
	EventTrainingSampleSaved = "TRAINING_SAMPLE_SAVED"
	EventModelRegistered     = "MODEL_VERSION_REGISTERED"
)

type SystemEvent struct {
	EventID       string          `json:"event_id"`
	EventType     string          `json:"event_type"`
	EventSource   string          `json:"event_source"`
	ActorUserID   string          `json:"actor_user_id,omitempty"`
	CorrelationID string          `json:"correlation_id,omitempty"`
	EntityType    string          `json:"entity_type,omitempty"`
	EntityID      string          `json:"entity_id,omitempty"`
	Message       string          `json:"message,omitempty"`
	Payload       json.RawMessage `json:"payload,omitempty"`
	CreatedAt     string          `json:"created_at"`
}

type TrainingSample struct {
	SampleID         string  `json:"sample_id"`
	Label            string  `json:"label"`
	ImageURL         string  `json:"image_url"`
	Source           string  `json:"source"`
	Confidence       float64 `json:"confidence"`
	RecordID         string  `json:"record_id,omitempty"`
	ModelVersionID   string  `json:"model_version_id,omitempty"`
	ApprovedForTrain bool    `json:"approved_for_train"`
	CreatedAt        string  `json:"created_at"`
	CreatedBy        string  `json:"created_by,omitempty"`
}

type ModelVersion struct {
	VersionID   string `json:"version_id"`
	Provider    string `json:"provider"`
	DisplayName string `json:"display_name"`
	ModelURL    string `json:"model_url"`
	LabelsJSON  string `json:"labels_json"`
	IsActive    bool   `json:"is_active"`
	Notes       string `json:"notes,omitempty"`
	CreatedAt   string `json:"created_at"`
}

func (s *Store) logEvent(
	eventType, source, actorUserID, correlationID, entityType, entityID, message string,
	payload any,
) {
	var payloadJSON any
	if payload != nil {
		b, err := json.Marshal(payload)
		if err == nil {
			payloadJSON = string(b)
		}
	}
	_, err := s.db.Exec(`INSERT INTO system_events
		(event_id, event_type, event_source, actor_user_id, correlation_id, entity_type, entity_id, message, payload_json, created_at)
		VALUES (?,?,?,?,?,?,?,?,?,?)`,
		newID("EVT"), eventType, source, nullStr(actorUserID), nullStr(correlationID),
		nullStr(entityType), nullStr(entityID), nullStr(message), payloadJSON, time.Now())
	if err != nil {
		log.Printf("logEvent %s: %v", eventType, err)
	}
}

func nullStr(v string) any {
	if strings.TrimSpace(v) == "" {
		return nil
	}
	return v
}

func mapTrainingLabel(plasticType string) string {
	n := strings.ToLower(strings.TrimSpace(plasticType))
	if strings.Contains(n, "กระป๋อง") || strings.Contains(n, "can") || strings.Contains(n, "aluminium") || strings.Contains(n, "aluminum") {
		return "CAN"
	}
	if strings.Contains(n, "ขวด") || strings.Contains(n, "plastic") || strings.Contains(n, "pet") || strings.Contains(n, "hdpe") || strings.Contains(n, "bottle") {
		return "PLASTIC_BOTTLE"
	}
	if strings.Contains(n, "ไม่ผ่าน") || strings.Contains(n, "invalid") {
		return "INVALID"
	}
	return "PLASTIC_BOTTLE"
}

func (s *Store) activeModelVersionID() string {
	var id string
	err := s.db.QueryRow(`SELECT version_id FROM model_versions WHERE is_active=1 AND delete_at IS NULL ORDER BY created_at DESC LIMIT 1`).Scan(&id)
	if err != nil {
		return ""
	}
	return id
}

func (s *Store) saveTrainingSample(
	label, imageURL, source string,
	confidence float64,
	recordID, actorUserID, correlationID string,
	meta any,
) string {
	id := newID("SMP")
	var metaJSON any
	if meta != nil {
		if b, err := json.Marshal(meta); err == nil {
			metaJSON = string(b)
		}
	}
	modelID := s.activeModelVersionID()
	_, err := s.db.Exec(`INSERT INTO model_training_samples
		(sample_id, label, image_url, source, confidence, record_id, model_version_id, approved_for_train, metadata_json, created_at, created_by)
		VALUES (?,?,?,?,?,?,?,1,?,?,?)`,
		id, label, imageURL, source, confidence, nullStr(recordID), nullStr(modelID), metaJSON, time.Now(), nullStr(actorUserID))
	if err != nil {
		log.Printf("saveTrainingSample: %v", err)
		return ""
	}
	s.logEvent(EventTrainingSampleSaved, "backend", actorUserID, correlationID, "training_sample", id,
		"บันทึกตัวอย่างเทรนโมเดล", map[string]any{
			"label": label, "image_url": imageURL, "source": source, "confidence": confidence, "record_id": recordID,
		})
	return id
}

func (s *Store) listSystemEvents(limit int, eventType, correlationID string) ([]SystemEvent, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	q := `SELECT event_id, event_type, event_source, IFNULL(actor_user_id,''), IFNULL(correlation_id,''),
		IFNULL(entity_type,''), IFNULL(entity_id,''), IFNULL(message,''), payload_json,
		DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s')
		FROM system_events WHERE 1=1`
	args := []any{}
	if eventType != "" {
		q += ` AND event_type=?`
		args = append(args, eventType)
	}
	if correlationID != "" {
		q += ` AND correlation_id=?`
		args = append(args, correlationID)
	}
	q += ` ORDER BY created_at DESC LIMIT ?`
	args = append(args, limit)

	rows, err := s.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []SystemEvent{}
	for rows.Next() {
		var e SystemEvent
		var payload sql.NullString
		if err := rows.Scan(&e.EventID, &e.EventType, &e.EventSource, &e.ActorUserID, &e.CorrelationID,
			&e.EntityType, &e.EntityID, &e.Message, &payload, &e.CreatedAt); err != nil {
			return nil, err
		}
		if payload.Valid && payload.String != "" {
			e.Payload = json.RawMessage(payload.String)
		}
		out = append(out, e)
	}
	return out, nil
}

func (s *Store) listTrainingSamples(label string, limit int) ([]TrainingSample, error) {
	if limit <= 0 || limit > 1000 {
		limit = 200
	}
	q := `SELECT sample_id, label, image_url, source, IFNULL(confidence,0), IFNULL(record_id,''),
		IFNULL(model_version_id,''), approved_for_train,
		DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s'), IFNULL(created_by,'')
		FROM model_training_samples WHERE delete_at IS NULL AND approved_for_train=1`
	args := []any{}
	if label != "" {
		q += ` AND label=?`
		args = append(args, label)
	}
	q += ` ORDER BY created_at DESC LIMIT ?`
	args = append(args, limit)

	rows, err := s.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []TrainingSample{}
	for rows.Next() {
		var t TrainingSample
		if err := rows.Scan(&t.SampleID, &t.Label, &t.ImageURL, &t.Source, &t.Confidence, &t.RecordID,
			&t.ModelVersionID, &t.ApprovedForTrain, &t.CreatedAt, &t.CreatedBy); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, nil
}

func (s *Store) listModelVersions() ([]ModelVersion, error) {
	rows, err := s.db.Query(`SELECT version_id, provider, display_name, model_url, CAST(labels_json AS CHAR),
		is_active, IFNULL(notes,''), DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s')
		FROM model_versions WHERE delete_at IS NULL ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ModelVersion{}
	for rows.Next() {
		var m ModelVersion
		if err := rows.Scan(&m.VersionID, &m.Provider, &m.DisplayName, &m.ModelURL, &m.LabelsJSON,
			&m.IsActive, &m.Notes, &m.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, nil
}

func (s *Store) ensureDefaultModelVersion() {
	var n int
	_ = s.db.QueryRow(`SELECT COUNT(*) FROM model_versions WHERE delete_at IS NULL`).Scan(&n)
	if n > 0 {
		return
	}
	labels := `["PLASTIC_BOTTLE","CAN","INVALID"]`
	id := "MOD-ECOBIN-LOCAL"
	_, err := s.db.Exec(`INSERT INTO model_versions
		(version_id, provider, display_name, model_url, labels_json, is_active, notes, created_at, created_by)
		VALUES (?,?,?,?,?,1,?,?,?)`,
		id, "ecobin_local", "EcoBin bottle/can (MobileNet head)",
		"/models/ecobin-bottle-can/", labels, "โมเดลใน frontend/public — สำรองตัวอย่างใน model_training_samples เพื่อเทรน Teachable ใหม่ได้",
		time.Now(), actorSystem)
	if err != nil {
		log.Printf("ensureDefaultModelVersion: %v", err)
		return
	}
	s.logEvent(EventModelRegistered, "system", actorSystem, "", "model_version", id,
		"ลงทะเบียนโมเดลเริ่มต้น", map[string]any{"provider": "ecobin_local", "model_url": "/models/ecobin-bottle-can/"})
}
