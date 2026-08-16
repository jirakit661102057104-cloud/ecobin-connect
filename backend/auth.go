package main

import (
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type claims struct {
	UserID string `json:"uid"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func jwtSecret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "ecobin-dev-secret-change-me"
	}
	return []byte(s)
}

func requireSecureSecrets() {
	if !isProd() {
		return
	}
	secret := os.Getenv("JWT_SECRET")
	if secret == "" || secret == "ecobin-dev-secret-change-me" {
		log.Fatal("production requires a strong JWT_SECRET in backend.env")
	}
}

func signToken(userID, role string) (string, error) {
	c := claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, c).SignedString(jwtSecret())
}

func parseToken(token string) (*claims, error) {
	parsed, err := jwt.ParseWithClaims(token, &claims{}, func(t *jwt.Token) (interface{}, error) {
		return jwtSecret(), nil
	})
	if err != nil {
		return nil, err
	}
	c, ok := parsed.Claims.(*claims)
	if !ok || !parsed.Valid {
		return nil, jwt.ErrTokenInvalidClaims
	}
	return c, nil
}
