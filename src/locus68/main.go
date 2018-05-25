package main

import (
	"flag"
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

func RoomHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "static/room.html")
}

func main() {
	flag.Parse()
	r := mux.NewRouter()
	rooms := make(map[string]*Room)

	r.HandleFunc("/", serveHome).Methods("GET")
	r.HandleFunc("/r/{room}", RoomHandler).Methods("GET")
	r.HandleFunc("/ws/{room}", func(w http.ResponseWriter, r *http.Request) {
		serveRooms(rooms, w, r)
	})
	http.Handle("/", r)

	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
