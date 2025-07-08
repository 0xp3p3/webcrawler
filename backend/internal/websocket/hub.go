package websocket

import (
	"encoding/json"
	"log"

	"web-crawler/internal/models"
)

type Hub struct {
	Clients    map[*Client]bool
	Broadcast  chan *models.WebSocketMessage
	Register   chan *Client
	Unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[*Client]bool),
		Broadcast:  make(chan *models.WebSocketMessage),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Clients[client] = true
			log.Printf("Client connected. Total clients: %d", len(h.Clients))

		case client := <-h.Unregister:
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				log.Printf("Client disconnected. Total clients: %d", len(h.Clients))
			}

		case message := <-h.Broadcast:
			messageBytes, err := json.Marshal(message)
			if err != nil {
				log.Printf("Error marshaling message: %v", err)
				continue
			}

			for client := range h.Clients {
				select {
				case client.Send <- messageBytes:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
		}
	}
}

func (h *Hub) BroadcastToUser(userID string, message *models.WebSocketMessage) {
	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	for client := range h.Clients {
		if client.UserID == userID {
			select {
			case client.Send <- messageBytes:
			default:
				close(client.Send)
				delete(h.Clients, client)
			}
		}
	}
}
