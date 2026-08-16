package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	loadBackendEnv()
	requireSecureSecrets()
	db, err := openDB()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	if err := migrateSoftDelete(db); err != nil {
		log.Fatal(err)
	}
	seedIfEmpty(db)

	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = filepath.Join(".", "uploads")
	}
	_ = os.MkdirAll(uploadDir, 0755)

	s := &Server{store: &Store{db: db, uploadDir: uploadDir}}
	origins := corsOrigins()

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	r.Get("/health", s.handleHealth)
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadDir))))

	r.Route("/api", func(r chi.Router) {
		r.Get("/state", s.handleState)
		r.Post("/auth/register", s.handleRegister)
		r.Post("/auth/login", s.handleLogin)
		r.Post("/auth/logout", s.handleLogout)
		r.Get("/auth/google/config", s.handleGoogleConfig)
		r.Post("/auth/google", s.handleGoogleAuth)
		r.Post("/auth/phone/otp", s.handlePhoneOTP)
		r.Post("/auth/phone/otp/check", s.handlePhoneOTPCheck)
		r.Post("/auth/phone/verify", s.handlePhoneVerify)
		r.Post("/auth/email/otp", s.handleEmailOTP)
		r.Post("/auth/email/otp/check", s.handleEmailOTPCheck)
		r.Post("/scan", s.handleScan)
		r.Post("/guest/scan", s.handleGuestScan)
		r.Get("/rewards", func(w http.ResponseWriter, req *http.Request) {
			list, _ := s.store.listRewards()
			writeJSON(w, 200, list)
		})

		r.Group(func(r chi.Router) {
			r.Use(s.requireUser)
			r.Patch("/me", s.handleUpdateProfile)
			r.Post("/me/avatar", s.handleUploadAvatar)
			r.Post("/waste", s.handleCreateWaste)
			r.Post("/rewards/{id}/redeem", s.handleRedeem)
		})

		r.Group(func(r chi.Router) {
			r.Use(s.requireAdmin)
			r.Get("/admin/stats", s.handleAdminStats)
			r.Get("/admin/relations", s.handleAdminRelations)
			r.Get("/admin/relations/users/{id}", s.handleAdminUserChildren)
			r.Patch("/admin/waste/{id}", s.handleVerifyWaste)
			r.Post("/admin/rewards", s.handleCreateReward)
			r.Put("/admin/rewards/{id}", s.handleUpdateReward)
			r.Delete("/admin/rewards/{id}", s.handleDeleteReward)
			r.Get("/admin/redeem/lookup", s.handleAdminRedeemLookup)
			r.Post("/admin/redeem/claim", s.handleAdminRedeemClaim)
			r.Post("/admin/redeem/cancel", s.handleAdminRedeemCancel)
			r.Patch("/admin/settings", s.handleAdminPatchSettings)
			r.Post("/admin/bins", s.handleAdminCreateBin)
			r.Put("/admin/bins/{id}", s.handleAdminUpdateBin)
			r.Delete("/admin/bins/{id}", s.handleAdminDeleteBin)
			r.Patch("/admin/users/{id}", s.handleAdminPatchUser)
			r.Delete("/admin/users/{id}", s.handleAdminDeleteUser)
			r.Post("/admin/plastics", s.handleAdminCreatePlastic)
			r.Put("/admin/plastics/{id}", s.handleAdminUpdatePlastic)
			r.Delete("/admin/plastics/{id}", s.handleAdminDeletePlastic)
		})
	})

	addr := os.Getenv("API_ADDR")
	if addr == "" {
		addr = ":8080"
	}
	log.Printf("EcoBin API listening on %s (%s)", addr, os.Getenv("APP_ENV"))
	log.Fatal(http.ListenAndServe(addr, http.MaxBytesHandler(r, 12<<20)))
}
