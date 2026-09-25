package handler

import (
	"errors"
	"net/http"

	"github.com/pcru/ecobin-connect/api/internal/dto"
	"github.com/pcru/ecobin-connect/api/internal/middleware"
	"github.com/pcru/ecobin-connect/api/internal/service"
	"github.com/pcru/ecobin-connect/api/pkg/httpx"
)

// WasteHandler is the HTTP adapter for waste records (no business formulas here).
type WasteHandler struct {
	svc *service.WasteService
}

func NewWasteHandler(svc *service.WasteService) *WasteHandler {
	return &WasteHandler{svc: svc}
}

// Create handles POST /api/waste (auth required — middleware injects user).
func (h *WasteHandler) Create(w http.ResponseWriter, r *http.Request) {
	me := middleware.UserFromContext(r.Context())
	if me == nil {
		httpx.WriteJSON(w, http.StatusUnauthorized, dto.ErrorResponse{Error: "กรุณาเข้าสู่ระบบ"})
		return
	}
	var req dto.CreateWasteRequest
	if err := httpx.ReadJSON(r, &req); err != nil {
		httpx.WriteJSON(w, http.StatusBadRequest, dto.ErrorResponse{Error: "ข้อมูลไม่ถูกต้อง"})
		return
	}
	out, err := h.svc.CreateFromCamera(r.Context(), me.UserID, req)
	if err != nil {
		status, msg := mapWasteError(err)
		httpx.WriteJSON(w, status, dto.ErrorResponse{Error: msg})
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, out)
}

func mapWasteError(err error) (int, string) {
	switch {
	case errors.Is(err, service.ErrNotFromCamera):
		return http.StatusBadRequest, err.Error()
	case errors.Is(err, service.ErrHashMismatch):
		return http.StatusBadRequest, err.Error()
	case errors.Is(err, service.ErrDuplicateImage):
		return http.StatusConflict, err.Error()
	case errors.Is(err, service.ErrHashCheckFailed):
		return http.StatusInternalServerError, err.Error()
	case errors.Is(err, service.ErrInsertWaste):
		return http.StatusInternalServerError, err.Error()
	case errors.Is(err, service.ErrInvalidBody):
		return http.StatusBadRequest, err.Error()
	default:
		if errors.Is(err, service.ErrSaveImage) {
			return http.StatusBadRequest, err.Error()
		}
		return http.StatusInternalServerError, "เกิดข้อผิดพลาดภายในระบบ"
	}
}
