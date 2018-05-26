package main

import (
	"bytes"
	"fmt"
	"github.com/gorilla/websocket"
	"log"
	"time"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Guest struct {
	id   string
	room *Room

	conn *websocket.Conn

	send chan []byte
}

func (g *Guest) readSocket() {
	defer func() {
		g.room.unregister <- g
		g.conn.Close()
	}()

	g.conn.SetReadLimit(maxMessageSize)
	g.conn.SetReadDeadline(time.Now().Add(pongWait))
	g.conn.SetPongHandler(func(string) error {
		g.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := g.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))
		log.Printf("%s sent %s", g.id, message)
		g.room.broadcast <- []byte(fmt.Sprintf("%s: %s", g.id, message))
	}
}

func (g *Guest) writeSocket() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		g.conn.Close()
	}()
	for {
		select {
		case message, ok := <-g.send:
			g.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// room closed the channel
				g.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := g.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// add queued messages to the current websocket message
			n := len(g.send)
			for i := 0; i < n; i++ {
				w.Write(newline)
				w.Write(<-g.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			g.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := g.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
