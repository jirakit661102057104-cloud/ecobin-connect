package dto

// CreateWasteRequest matches POST /api/waste body from the Next.js client.
type CreateWasteRequest struct {
	ImageData     string   `json:"image_data"`
	PlasticType   string   `json:"plastic_type"`
	BottleCount   int      `json:"bottle_count"`
	BinLocation   string   `json:"bin_location"`
	WeightKg      *float64 `json:"weight_kg"`
	Confidence    float64  `json:"confidence"`
	ModelLabel    string   `json:"model_label"`
	CorrelationID string   `json:"correlation_id"`
	CaptureSource string   `json:"capture_source"`
	ImageHash     string   `json:"image_hash"`
}

// WasteRecordResponse matches waste_records fields returned to the frontend today.
type WasteRecordResponse struct {
	RecordID              string  `json:"record_id"`
	UserID                string  `json:"user_id"`
	UserName              string  `json:"user_name,omitempty"`
	StudentID             string  `json:"student_id,omitempty"`
	ImageURL              string  `json:"image_url"`
	PlasticType           string  `json:"plastic_type"`
	BottleCount           int     `json:"bottle_count"`
	UploadTimestamp       string  `json:"upload_timestamp"`
	VerificationStatus    string  `json:"verification_status"`
	CarbonSaved           float64 `json:"carbon_saved"`
	WeightKg              float64 `json:"weight_kg"`
	CarbonFootprint       float64 `json:"carbon_footprint"`
	CarbonAvoided         float64 `json:"carbon_avoided"`
	EmissionFactorVersion string  `json:"emission_factor_version,omitempty"`
	PointsAwarded         int     `json:"points_awarded"`
	AdminComment          string  `json:"admin_comment"`
	BinLocation           string  `json:"bin_location,omitempty"`
}

type UserResponse struct {
	UserID           string  `json:"user_id"`
	FullName         string  `json:"full_name"`
	StudentID        string  `json:"student_id"`
	Email            string  `json:"email"`
	UserRole         string  `json:"user_role"`
	TotalPoints      int     `json:"total_points"`
	TotalCarbonSaved float64 `json:"total_carbon_saved"`
}

type CreateWasteResponse struct {
	Record        WasteRecordResponse `json:"record"`
	User          UserResponse        `json:"user"`
	CorrelationID string              `json:"correlation_id"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}
