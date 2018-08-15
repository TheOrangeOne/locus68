package main

import (
	"crypto/rand"
	"encoding/base64"
)

func GenRandBytes(n int) ([]byte, error) {
	bytes := make([]byte, n)

	_, err := rand.Read(bytes)
	if err != nil {
		return nil, err
	}

	return bytes, nil
}

func GenRandString(n int) (string, error) {
	// const alpha = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-"
	const alpha = "023456789abcdefghjkmnopqrstvwxyz"
	bytes, err := GenRandBytes(n)

	if err != nil {
		return "", err
	}

	for i, b := range bytes {
		bytes[i] = alpha[b%byte(len(alpha))]
	}

	return string(bytes), nil
}

func GenRandURL(n int) (string, error) {
	bytes, err := GenRandBytes(n)
	return base64.URLEncoding.EncodeToString(bytes), err
}
