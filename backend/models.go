package main

import "time"

type User struct {
	UserID           string  `json:"user_id"`
	FullName         string  `json:"full_name"`
	FirstName        string  `json:"first_name"`
	LastName         string  `json:"last_name"`
	NeedsProfile     bool    `json:"needs_profile"`
	StudentID        string  `json:"student_id"`
	Email            string  `json:"email"`
	PasswordHash     string  `json:"-"`
	UserRole         string  `json:"user_role"`
	TotalPoints      int     `json:"total_points"`
	TotalCarbonSaved float64 `json:"total_carbon_saved"`
	AvatarURL        string  `json:"avatar_url,omitempty"`
	Department       string  `json:"department,omitempty"`
	Phone            string  `json:"phone,omitempty"`
	AuthProvider     string  `json:"auth_provider,omitempty"`
}

type WasteRecord struct {
	RecordID           string  `json:"record_id"`
	UserID             string  `json:"user_id"`
	UserName           string  `json:"user_name,omitempty"`
	StudentID          string  `json:"student_id,omitempty"`
	ImageURL           string  `json:"image_url"`
	PlasticType        string  `json:"plastic_type"`
	BottleCount        int     `json:"bottle_count"`
	UploadTimestamp    string  `json:"upload_timestamp"`
	VerificationStatus string  `json:"verification_status"`
	CarbonSaved        float64 `json:"carbon_saved"`
	PointsAwarded      int     `json:"points_awarded"`
	AdminComment       string  `json:"admin_comment"`
	BinLocation        string  `json:"bin_location,omitempty"`
}

type PointTransaction struct {
	TransactionID   string `json:"transaction_id"`
	UserID          string `json:"user_id"`
	RecordID        string `json:"record_id,omitempty"`
	PointsEarned    int    `json:"points_earned"`
	TransactionType string `json:"transaction_type"`
	Description     string `json:"description"`
	TransactionDate string `json:"transaction_date"`
}

type Reward struct {
	RewardID          string `json:"reward_id"`
	RewardName        string `json:"reward_name"`
	PointsRequired    int    `json:"points_required"`
	RewardDescription string `json:"reward_description"`
	RewardStock       int    `json:"reward_stock"`
	RewardImage       string `json:"reward_image"`
	Category          string `json:"category"`
}

type Redemption struct {
	RedeemID     string `json:"redeem_id"`
	UserID       string `json:"user_id"`
	UserName     string `json:"user_name,omitempty"`
	StudentID    string `json:"student_id,omitempty"`
	RewardID     string `json:"reward_id"`
	RewardName   string `json:"reward_name"`
	RewardImage  string `json:"reward_image"`
	PointsUsed   int    `json:"points_used"`
	RedeemDate   string `json:"redeem_date"`
	RedeemStatus string `json:"redeem_status"`
	PickupCode   string `json:"pickup_code"`
}

type GuestLog struct {
	GuestSessionID  string `json:"guest_session_id"`
	DeviceID        string `json:"device_id"`
	TempImagePath   string `json:"temp_image_path"`
	TempScanResult  string `json:"temp_scan_result"`
	DetectedBottles int    `json:"detected_bottles"`
	EstimatedPoints int    `json:"estimated_points"`
	Timestamp       string `json:"timestamp"`
}

type ScanResult struct {
	Valid        bool    `json:"valid"`
	PlasticType  string  `json:"plastic_type"`
	BottleCount  int     `json:"bottle_count"`
	Confidence   float64 `json:"confidence"`
	Notes        string  `json:"notes"`
	NotesEN      string  `json:"notes_en"`
	PlasticTypeEN string `json:"plastic_type_en"`
}

func fmtTime(t time.Time) string {
	return t.Format("2006-01-02 15:04:05")
}

type SmartBin struct {
	BinID        string `json:"bin_id"`
	BinName      string `json:"bin_name"`
	Status       string `json:"status"`
	CapacityNote string `json:"capacity_note,omitempty"`
}

type AppSettings struct {
	PointsPerBottle  int     `json:"points_per_bottle"`
	CarbonPerBottle  float64 `json:"carbon_per_bottle"`
	Announcement     string  `json:"announcement"`
	WasteAutoApprove bool    `json:"waste_auto_approve"`
}

type PlasticType struct {
	PlasticCode     int     `json:"plastic_code"`
	ShortName       string  `json:"short_name"`
	FullName        string  `json:"full_name"`
	DisplayNameTH   string  `json:"display_name_th"`
	CarbonFactor    float64 `json:"carbon_factor"`
	PointsPerBottle int     `json:"points_per_bottle"`
	RecyclingTips   string  `json:"recycling_tips,omitempty"`
}
