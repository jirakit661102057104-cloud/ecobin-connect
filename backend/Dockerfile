FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /ecobin-api .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=build /ecobin-api /app/ecobin-api
RUN mkdir -p /app/uploads
EXPOSE 8080
CMD ["/app/ecobin-api"]
