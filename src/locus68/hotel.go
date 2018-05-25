package main

import (
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

type Hotel struct {
	rooms map[string]*Room
	// users map[string]*User
}

func newHotel() *Hotel {
	return &Hotel{
		rooms: make(map[string]*Room),
		// users: make(map[string]*User),
	}
}

// check a user in to a room
func (h *Hotel) checkinUser(id string, room *Room, conn *websocket.Conn) {
	user := &User{
		id:   id,
		room: room,
		conn: conn,
		send: make(chan []byte, 256),
	}
	user.room.register <- user

	go user.writeSocket()
	go user.readSocket()
}

func (h *Hotel) prepareRoom(roomName string) *Room {
	log.Printf("prepared new room %s", roomName)
	room := newRoom(roomName)
	h.rooms[roomName] = room
	go room.run()
	return room
}

func (h *Hotel) serveHotel(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		log.Printf("user id not given, user will be anonymous")
	}

	roomName := r.URL.Path
	room, ok := h.rooms[roomName]
	if !ok {
		room = h.prepareRoom(roomName)
	}

	h.checkinUser(id, room, conn)
}
