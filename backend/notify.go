package main

import (
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/smtp"
	"net/url"
	"os"
	"strings"
	"time"
)

func otpDebug() bool {
	return envTrue("OTP_DEBUG", false)
}

func smtpReady() bool {
	return strings.TrimSpace(os.Getenv("SMTP_HOST")) != "" &&
		strings.TrimSpace(os.Getenv("SMTP_USER")) != "" &&
		strings.TrimSpace(os.Getenv("SMTP_PASS")) != ""
}

func smsReady() bool {
	if strings.TrimSpace(os.Getenv("TWILIO_ACCOUNT_SID")) != "" &&
		strings.TrimSpace(os.Getenv("TWILIO_AUTH_TOKEN")) != "" &&
		strings.TrimSpace(os.Getenv("TWILIO_FROM")) != "" {
		return true
	}
	return strings.TrimSpace(os.Getenv("THAIBULKSMS_API_KEY")) != "" &&
		strings.TrimSpace(os.Getenv("THAIBULKSMS_API_SECRET")) != ""
}

func phoneE164(phone string) string {
	if strings.HasPrefix(phone, "0") && len(phone) == 10 {
		return "+66" + phone[1:]
	}
	if strings.HasPrefix(phone, "+") {
		return phone
	}
	return "+" + phone
}

func phoneMSISDN66(phone string) string {
	if strings.HasPrefix(phone, "0") && len(phone) == 10 {
		return "66" + phone[1:]
	}
	return strings.TrimPrefix(phone, "+")
}

func sendOTPEmail(to, code string) error {
	subject := "รหัส OTP PCRU CFO SAVEPOINT"
	body := fmt.Sprintf("รหัสยืนยัน PCRU CFO SAVEPOINT ของคุณคือ %s\n\nรหัสนี้หมดอายุใน 5 นาที หากไม่ได้ขอรหัสนี้ ให้เพิกเฉยต่ออีเมลฉบับนี้\n", code)
	if err := sendPlainEmail(to, subject, body); err != nil {
		return fmt.Errorf("ส่งอีเมล OTP ไม่สำเร็จ ตรวจสอบ SMTP ใน backend.env")
	}
	return nil
}

func sendPlainEmail(to, subject, body string) error {
	if otpDebug() && !smtpReady() {
		log.Printf("OTP_DEBUG: skip email send to %s subject=%s", to, subject)
		return nil
	}
	if !smtpReady() {
		return fmt.Errorf("ยังไม่ได้ตั้งค่า SMTP ใน backend.env (SMTP_HOST, SMTP_USER, SMTP_PASS)")
	}
	fromHeader, fromAddr, user, auth, addr, useTLS := smtpDialParams()
	msg := strings.Join([]string{
		"From: " + fromHeader,
		"To: " + to,
		"Subject: " + mimeUTF8(subject),
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		body,
	}, "\r\n")
	return smtpSend(addr, auth, fromAddr, user, to, []byte(msg), useTLS)
}

func sendHTMLEmail(to, subject, htmlBody, plainFallback string) error {
	if otpDebug() && !smtpReady() {
		log.Printf("OTP_DEBUG: skip HTML email to %s subject=%s", to, subject)
		return nil
	}
	if !smtpReady() {
		return fmt.Errorf("ยังไม่ได้ตั้งค่า SMTP ใน backend.env (SMTP_HOST, SMTP_USER, SMTP_PASS)")
	}
	fromHeader, fromAddr, user, auth, addr, useTLS := smtpDialParams()
	boundary := "ecobin_cert_" + fmt.Sprintf("%d", time.Now().UnixNano())
	if plainFallback == "" {
		plainFallback = "ดูเกียรติบัตรได้ในอีเมลฉบับนี้ (เปิดในโปรแกรมที่รองรับ HTML)"
	}
	msg := strings.Join([]string{
		"From: " + fromHeader,
		"To: " + to,
		"Subject: " + mimeUTF8(subject),
		"MIME-Version: 1.0",
		"Content-Type: multipart/alternative; boundary=" + boundary,
		"",
		"--" + boundary,
		"Content-Type: text/plain; charset=UTF-8",
		"",
		plainFallback,
		"",
		"--" + boundary,
		"Content-Type: text/html; charset=UTF-8",
		"",
		htmlBody,
		"",
		"--" + boundary + "--",
		"",
	}, "\r\n")
	return smtpSend(addr, auth, fromAddr, user, to, []byte(msg), useTLS)
}

func smtpDialParams() (fromHeader, fromAddr, user string, auth smtp.Auth, addr string, useTLS bool) {
	host := strings.TrimSpace(os.Getenv("SMTP_HOST"))
	port := getenv("SMTP_PORT", "587")
	user = strings.TrimSpace(os.Getenv("SMTP_USER"))
	pass := strings.TrimSpace(os.Getenv("SMTP_PASS"))
	fromHeader = strings.TrimSpace(os.Getenv("SMTP_FROM"))
	if fromHeader == "" {
		fromHeader = user
	}
	fromAddr = mailFrom(fromHeader, user)
	auth = smtp.PlainAuth("", user, pass, host)
	addr = net.JoinHostPort(host, port)
	useTLS = port == "465"
	return
}

func smtpSend(addr string, auth smtp.Auth, fromAddr, user, to string, msg []byte, useTLS bool) error {
	host := strings.TrimSpace(os.Getenv("SMTP_HOST"))
	var err error
	if useTLS {
		err = sendSMTPS(addr, host, auth, fromAddr, []string{to}, msg)
	} else {
		err = smtp.SendMail(addr, auth, fromAddr, []string{to}, msg)
	}
	if err != nil {
		log.Printf("smtp send failed: %v", err)
		return err
	}
	log.Printf("sent email to %s", to)
	return nil
}

func mailFrom(fromHeader, user string) string {
	if i := strings.Index(fromHeader, "<"); i >= 0 {
		j := strings.Index(fromHeader, ">")
		if j > i {
			return strings.TrimSpace(fromHeader[i+1 : j])
		}
	}
	return user
}

func mimeUTF8(s string) string {
	return "=?UTF-8?B?" + base64.StdEncoding.EncodeToString([]byte(s)) + "?="
}

func sendSMTPS(addr, host string, auth smtp.Auth, from string, to []string, msg []byte) error {
	conn, err := tls.Dial("tcp", addr, &tls.Config{ServerName: host})
	if err != nil {
		return err
	}
	defer conn.Close()
	c, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}
	defer c.Close()
	if auth != nil {
		if err := c.Auth(auth); err != nil {
			return err
		}
	}
	if err := c.Mail(from); err != nil {
		return err
	}
	for _, rcpt := range to {
		if err := c.Rcpt(rcpt); err != nil {
			return err
		}
	}
	w, err := c.Data()
	if err != nil {
		return err
	}
	if _, err := w.Write(msg); err != nil {
		return err
	}
	if err := w.Close(); err != nil {
		return err
	}
	return c.Quit()
}

func sendOTPSMS(phone, code string) error {
	if otpDebug() && !smsReady() {
		log.Printf("OTP_DEBUG: skip SMS send to %s", phone)
		return nil
	}
	if !smsReady() {
		return fmt.Errorf("ยังไม่ได้ตั้งค่า SMS ใน backend.env (Twilio หรือ ThaiBulkSMS)")
	}
	text := fmt.Sprintf("รหัส OTP PCRU CFO SAVEPOINT คือ %s หมดอายุใน 5 นาที", code)
	var err error
	if strings.TrimSpace(os.Getenv("TWILIO_ACCOUNT_SID")) != "" {
		err = sendTwilioSMS(phone, text)
	} else {
		err = sendThaiBulkSMS(phone, text)
	}
	if err != nil {
		log.Printf("sms send failed: %v", err)
		return fmt.Errorf("ส่ง SMS OTP ไม่สำเร็จ ตรวจสอบเกตเวย์ใน backend.env")
	}
	log.Printf("sent SMS OTP to %s", phone)
	return nil
}

func sendTwilioSMS(phone, text string) error {
	sid := strings.TrimSpace(os.Getenv("TWILIO_ACCOUNT_SID"))
	token := strings.TrimSpace(os.Getenv("TWILIO_AUTH_TOKEN"))
	from := strings.TrimSpace(os.Getenv("TWILIO_FROM"))
	endpoint := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", sid)
	form := url.Values{}
	form.Set("To", phoneE164(phone))
	form.Set("From", from)
	form.Set("Body", text)
	req, err := http.NewRequest(http.MethodPost, endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.SetBasicAuth(sid, token)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	return doNotifyRequest(req)
}

func sendThaiBulkSMS(phone, text string) error {
	key := strings.TrimSpace(os.Getenv("THAIBULKSMS_API_KEY"))
	secret := strings.TrimSpace(os.Getenv("THAIBULKSMS_API_SECRET"))
	sender := getenv("THAIBULKSMS_SENDER", "SMSOTP")
	form := url.Values{}
	form.Set("msisdn", phoneMSISDN66(phone))
	form.Set("message", text)
	form.Set("sender", sender)
	req, err := http.NewRequest(http.MethodPost, "https://api-v2.thaibulksms.com/sms", strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.SetBasicAuth(key, secret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	return doNotifyRequest(req)
}

func doNotifyRequest(req *http.Request) error {
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	if resp.StatusCode >= 300 {
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	return nil
}
