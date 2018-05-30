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
	log.Println(r.URL)
	if r.URL.Path != "/" {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	http.ServeFile(w, r, "static/home.html")
}

func serveCreate(w http.ResponseWriter, r *http.Request) {
	log.Println("create: %v", r.URL.String)
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	roomName := "j2kj323j32hjhlhj23l"
	http.Redirect(w, r, fmt.Sprintf("/r/%v", roomName), 301)
}

func RoomHandler(w http.ResponseWriter, r *http.Request) {
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
	r.HandleFunc("/create", serveCreate).Methods("GET")
	r.HandleFunc("/r/{room}", RoomHandler).Methods("GET")
	r.HandleFunc("/t/{room}", TestRoomHandler).Methods("GET")
	r.HandleFunc("/ws/{room}", hotel.serveHotel)
	http.Handle("/", r)

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
