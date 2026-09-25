package middleware

import "context"

type ctxKey int

const userKey ctxKey = 1

// AuthUser is the minimal identity placed on the request context by requireUser.
type AuthUser struct {
	UserID   string
	UserRole string
}

func WithUser(ctx context.Context, u *AuthUser) context.Context {
	return context.WithValue(ctx, userKey, u)
}

func UserFromContext(ctx context.Context) *AuthUser {
	u, _ := ctx.Value(userKey).(*AuthUser)
	return u
}
