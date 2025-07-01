# WebRTC Signaling Server for Robots

This project provides a WebRTC signaling server built with Node.js and WebSocket. It allows robots to register themselves with their SDP offers via WebSocket connections. Clients can retrieve the list of registered robots, update SDP offers, send SDP answers, and exchange ICE candidates to facilitate WebRTC connections.

## Features

- **Robot Registration:** Robots can register themselves by submitting their name and optionally their SDP offer.
- **Retrieve Robots:** Clients can fetch the list of all registered robots along with their SDP offers.
- **Update SDP Offers:** Allows modifying an existing robot’s SDP offer.
- **Send SDP Answers:** Clients can send SDP answers to robots.
- **Exchange ICE Candidates:** Both robots and clients can send lists of ICE candidates to each other in real-time.
- **Robot De-registration:** Robots can de-register themselves, and they are automatically removed if the WebSocket connection closes.

## Installation

1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install Dependencies:**
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

## Usage

Start the server with the following command:
```bash
npm start
```
By default, the server listens on port **3001** for robots and port **3002** for clients.

### Build and Run Docker

To build and start the Docker container, use the provided script:

```bash
./run.sh
```

This script takes care of:
- Building the Docker image of the signaling server
- Starting the container with the appropriate exposed ports (3001 for robots and 3002 for clients)
- Configuring the network to allow WebSocket connections


## WebSocket Communication

### Robot Registration

Robots connect to the WebSocket server on port **3001** and send a registration message with their name and optionally their SDP offer.

**Message from Robot:**
```json
{
  "type": "register",
  "name": "Robot A",
  "sdpOffer": "v=0\r\no=- 12345 67890 IN IP4 0.0.0.0\r\n..."
}
```

**Response from Server:**
```json
{
  "type": "registered",
  "robotId": 1
}
```

**Notification to Client:**
```json
{
  "type": "register",
  "robot": {
    "id": 1,
    "name": "Robot A",
    "sdpOffer": "v=0\r\no=- 12345 67890 IN IP4 0.0.0.0\r\n...",
    "sdpAnswer": null,
    "robotCandidates": [],
    "clientCandidates": []
  }
}
```

### Retrieve Robots

Clients connect to the WebSocket server on port **3002** and send a message to retrieve all registered robots.

**Message from Client:**
```json
{
  "type": "getRobots"
}
```

**Response from Server:**
```json
{
  "type": "robots",
  "robots": [
    {
      "id": 1,
      "name": "Robot A",
      "sdpOffer": "v=0\r\no=- 12345 67890 IN IP4 0.0.0.0\r\n...",
      "sdpAnswer": null,
      "robotCandidates": [],
      "clientCandidates": []
    }
  ]
}
```

### Update SDP Offers

Robots can update their SDP offers by sending a message with the new SDP offer.

**Message from Robot:**
```json
{
  "type": "offer",
  "robotId": 1,
  "sdpOffer": "v=0\r\no=- 54321 09876 IN IP4 0.0.0.0\r\n..."
}
```

**Notification to Client:**
```json
{
  "type": "offer",
  "robotId": 1,
  "sdpOffer": "v=0\r\no=- 54321 09876 IN IP4 0.0.0.0\r\n..."
}
```

### Send SDP Answers

Clients can send SDP answers to robots by specifying the robot ID and the SDP answer.

**Message from Client:**
```json
{
  "type": "answer",
  "robotId": 1,
  "sdpAnswer": "v=0\r\no=- 98765 43210 IN IP4 0.0.0.0\r\n..."
}
```

**Notification to Robot:**
```json
{
  "type": "sdpAnswer",
  "sdpAnswer": "v=0\r\no=- 98765 43210 IN IP4 0.0.0.0\r\n..."
}
```

**Notification to Client:**
```json
{
  "type": "answer",
  "robotId": 1,
  "sdpAnswer": "v=0\r\no=- 98765 43210 IN IP4 0.0.0.0\r\n..."
}
```

### Exchange ICE Candidates

Both robots and clients can send lists of ICE candidates to each other.

**Message from Robot:**
```json
{
  "type": "candidates",
  "robotId": 1,
  "candidates": [
    "candidate:1 1 UDP 2122252543 192.168.1.2 54321 typ host",
    "candidate:2 1 UDP 2122252543 192.168.1.3 54322 typ host"
  ]
}
```

**Message from Client:**
```json
{
  "type": "candidates",
  "robotId": 1,
  "candidates": [
    "candidate:3 1 UDP 2122252543 192.168.1.4 54323 typ host",
    "candidate:4 1 UDP 2122252543 192.168.1.5 54324 typ host"
  ]
}
```

**Notification to Robot:**
```json
{
  "type": "candidates",
  "candidates": [
    "candidate:3 1 UDP 2122252543 192.168.1.4 54323 typ host",
    "candidate:4 1 UDP 2122252543 192.168.1.5 54324 typ host"
  ]
}
```

**Notification to Client:**
```json
{
  "type": "candidates",
  "robotId": 1,
  "candidates": [
    "candidate:1 1 UDP 2122252543 192.168.1.2 54321 typ host",
    "candidate:2 1 UDP 2122252543 192.168.1.3 54322 typ host"
  ]
}
```

### Robot De-registration

Robots can de-register themselves by sending a message with their robot ID.

**Message from Robot:**
```json
{
  "type": "deregister",
  "robotId": 1
}
```

**Notification to Client:**
```json
{
  "type": "deregister",
  "robotId": 1
}
```

Robots are also automatically removed if the WebSocket connection closes.

## API Endpoints Documentation

### WebSocket Endpoints

- **Robots:** `ws://<server-ip>:3001`
- **Clients:** `ws://<server-ip>:3002`

### Message Types

- **register:** Register a new robot with its name and optionally its SDP offer.
- **getRobots:** Retrieve the list of all registered robots.
- **offer:** Update the SDP offer for an existing robot.
- **answer:** Send the SDP answer to a specific robot.
- **candidates:** Exchange lists of ICE candidates between robots and clients.
- **deregister:** De-register an existing robot.

---

## Cite us
If you use this code in your work, please cite the DIANE project as follows:

```
@inproceedings{10.1145/3712676.3719263,
  author = {Barone, Nunzio and Brescia, Walter and Santangelo, Gabriele and Maggio, Antonio Pio and Cisternino, Ivan and De Cicco, Luca and Mascolo, Saverio},
  title = {Real-time Point Cloud Transmission for Immersive Teleoperation of Autonomous Mobile Robots},
  year = {2025},
  isbn = {9798400714672},
  publisher = {Association for Computing Machinery},
  address = {New York, NY, USA},
  url = {https://doi.org/10.1145/3712676.3719263},
  doi = {10.1145/3712676.3719263},
  booktitle = {Proceedings of the 16th ACM Multimedia Systems Conference},
  pages = {311–316},
  numpages = {6},
  keywords = {teleoperation, mobile robots, VR, point clouds, WebRTC},
  location = {Stellenbosch, South Africa},
  series = {MMSys '25}
}
```

or: 

DIANE: Distributed Immersive Platform for Robot Teleoperation. https://github.com/Diane-Spirit