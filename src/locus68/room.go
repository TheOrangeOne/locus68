package main

import (
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

type Room struct {
	name string

	users map[*User]bool

	broadcast chan []byte

	register chan *User

	unregister chan *User
}

func newRoom(name string) *Room {
	return &Room{
		name:       name,
		broadcast:  make(chan []byte),
		register:   make(chan *User),
		unregister: make(chan *User),
		users:      make(map[*User]bool),
	}
}

func (r *Room) run() {
	for {
		select {
		case user := <-r.register:
			log.Printf("user %s registered to room %s", user.id, r.name)
			r.users[user] = true
		case user := <-r.unregister:
			if _, ok := r.users[user]; ok {
				delete(r.users, user)
				close(user.send)
			}
		case message := <-r.broadcast:
			for user := range r.users {
				select {
				case user.send <- message:
				default:
					close(user.send)
					delete(r.users, user)
				}
			}
		}
	}
}

func registerUser(id string, room *Room, conn *websocket.Conn) {
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

func parseUserId() {
}

func serveRooms(rooms map[string]*Room, w http.ResponseWriter, r *http.Request) {
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
	room, ok := rooms[roomName]
	if ok {
		log.Printf("user %s added to room %s", id, roomName)
	} else {
		log.Printf("user %s created new room %s", id, roomName)
		room = newRoom(roomName)
		rooms[roomName] = room
		go room.run()
	}

	registerUser(id, room, conn)
}
