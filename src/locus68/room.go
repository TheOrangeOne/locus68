package main

import (
	"log"
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
