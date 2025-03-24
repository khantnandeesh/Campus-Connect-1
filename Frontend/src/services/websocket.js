import { onlineStatusState } from "../atoms/onlineStatusAtom";

class WebSocketService {
  constructor() {
    this.ws = null;
    this.setOnlineStatus = null;
  }

  connect(token) {
    this.ws = new WebSocket("ws://localhost:3001");

    this.ws.onopen = () => {
      console.log("WebSocket Connected");
      // Send authentication
      this.ws.send(
        JSON.stringify({
          type: "auth",
          token
        })
      );
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "auth_success":
          console.log("Authentication successful");
          break;

        case "online_status":
          if (this.setOnlineStatus) {
            this.setOnlineStatus({
              users: data.users,
              mentors: data.mentors
            });
          }
          break;

        case "auth_error":
          console.error("Authentication failed:", data.message);
          break;

        default:
          console.log("Received message:", data);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket Disconnected");
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connect(token), 5000);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };
  }

  setOnlineStatusSetter(setter) {
    this.setOnlineStatus = setter;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService;
