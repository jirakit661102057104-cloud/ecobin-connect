// Example wiring for cmd/api (target). Not used by production entry yet —
// backend/main.go remains the live Cloud Run binary until migration Phase 7.
//
//	wasteRepo := mysql.NewWasteRepo(db)
//	pointsRepo := mysql.NewPointsRepo(db)
//	wasteSvc := service.NewWasteService(wasteRepo, pointsRepo, plasticRepo, userRepo, settingsRepo, imageStore, idgen.Default)
//	wasteH := handler.NewWasteHandler(wasteSvc)
//	r.With(authMW.RequireUser).Post("/waste", wasteH.Create)
package server
