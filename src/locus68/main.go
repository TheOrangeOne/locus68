package main

import (
	"flag"
	"fmt"
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

var addr = flag.String("addr", ":8080", "http service address")

func serveHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	http.ServeFile(w, r, "static/index.html")
}

func serveCreate(w http.ResponseWriter, r *http.Request, hotel *Hotel) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	room, err := hotel.createRoom()
	if err != nil {
		log.Println("create failed!")
		http.Redirect(w, r, "/todo", 301)
		return
	}

	roomName := room.name
	http.Redirect(w, r, fmt.Sprintf("/r/%v", roomName), 301)
}

func roomHandler(w http.ResponseWriter, r *http.Request, hotel *Hotel) {
	// TODO
	// if hotel.hasRoom() {}
	http.ServeFile(w, r, "static/map.html")
}

func TestRoomHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "static/room.html")
}

func main() {
	flag.Parse()
	r := mux.NewRouter()
	hotel := newHotel()

	r.HandleFunc("/", serveHome).Methods("GET")
	r.HandleFunc("/create", func(w http.ResponseWriter, r *http.Request) {
		serveCreate(w, r, hotel)
	}).Methods("POST")
	r.HandleFunc("/r/{room}", func(w http.ResponseWriter, r *http.Request) {
		roomHandler(w, r, hotel)
	}).Methods("GET")
	// r.HandleFunc("/r/{room}", RoomHandler).Methods("GET")
	r.HandleFunc("/t/{room}", TestRoomHandler).Methods("GET")
	r.HandleFunc("/ws/{room}", hotel.serveHotel)
	http.Handle("/", r)

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
