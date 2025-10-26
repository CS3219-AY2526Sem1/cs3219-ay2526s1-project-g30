FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY *.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -a -ldflags '-w -s' -o /app/server .

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/server /app/server

EXPOSE 8080

CMD ["/app/server"]