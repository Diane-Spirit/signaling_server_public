const WebSocket = require('ws');

// In-memory storage for registered robots
let robots = [];
let robotIdCounter = 0;
let robotConnections = {}; // Store WebSocket connections by robot ID
let clientConnection = null; // Store the single WebSocket connection for the client

const robotWss = new WebSocket.Server({ port: 3001 }); // WebSocket server for robots on port 3001
const clientWss = new WebSocket.Server({ port: 3002 }); // WebSocket server for client on port 3002

console.log('WebSocket servers running on ports 3001 (robots) and 3002 (client).');

// Handle robot WebSocket connections
robotWss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'register':
                // Register a new robot
                const robotId = robotIdCounter++;
                robotConnections[robotId] = ws;
                const robot = {
                    id: robotId,
                    name: data.name,
                    sdpOffer: data.sdpOffer || null,
                    sdpAnswer: null,
                    robotCandidates: [],
                    clientCandidates: []
                };
                robots.push(robot);
                ws.send(JSON.stringify({ type: 'registered', robotId }));
                notifyClient({ type: 'register', robot });
                console.log(`Robot ${robotId} registered and connected via WebSocket.`);
                break;
            case 'offer':
                // Update the SDP offer for an existing robot
                if (data.robotId && data.sdpOffer) {
                    const robot = robots.find(robot => robot.id === data.robotId);
                    if (robot) {
                        robot.sdpOffer = data.sdpOffer;
                        notifyClient({ type: 'offer', robotId: data.robotId, sdpOffer: data.sdpOffer });
                        console.log(`Robot ${data.robotId} modified its SDP offer.`);
                    }
                }
                break;
            case 'candidate':
                // Add an ICE candidate for an existing robot
                if (data.robotId && data.candidate) {
                    const robot = robots.find(robot => robot.id === data.robotId);
                    if (robot) {
                        robot.robotCandidates.push(data.candidate);
                        notifyClient({ type: 'candidate', robotId: data.robotId, candidate: data.candidate });
                        console.log(`Received robot ${data.robotId} ICE candidate for client`);
                    }
                }
                break;
            case 'deregister':
                // De-register an existing robot
                if (data.robotId) {
                    const robotIndex = robots.findIndex(robot => robot.id === data.robotId);
                    if (robotIndex !== -1) {
                        const [removedRobot] = robots.splice(robotIndex, 1);
                        delete robotConnections[data.robotId];
                        notifyClient({ type: 'deregister', robotId: data.robotId });
                        console.log(`Robot ${data.robotId} de-registered and disconnected.`);
                    }
                }
                break;
            default:
                console.log(`Received non-compliant message type ${data.type}`);
        }
    });


    // Handle robot WebSocket disconnection
    ws.on('close', () => {
        const robotId = Object.keys(robotConnections).find(id => robotConnections[id] === ws);
        if (robotId !== undefined) {
            const robotIndex = robots.findIndex(robot => robot.id === parseInt(robotId));
            if (robotIndex !== -1) {
                const [removedRobot] = robots.splice(robotIndex, 1);
                delete robotConnections[robotId];
                notifyClient({ type: 'deregistered', robotId: parseInt(robotId) });
                console.log(`Robot ${robotId} disconnected and removed.`);
                console.log(robots);
            }
        }
    });
});

// Handle client WebSocket connections
clientWss.on('connection', (ws) => {
    clientConnection = ws;
    console.log(`Client connected via WebSocket.`);

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'getRobots':
                // Send all registered robots to the client
                ws.send(JSON.stringify({ type: 'robots', robots }));
                console.log(`Client requested all robots.`);
                break;
            case 'answer':
                // Set the SDP answer for a specific robot
                if (data.hasOwnProperty('robotId') && data.hasOwnProperty('sdpAnswer')){
                    const robot = robots.find(robot => robot.id === data.robotId);
                    if (robot) {
                        robot.sdpAnswer = data.sdpAnswer;
                        notifyRobot(data.robotId, { type: 'sdpAnswer', sdpAnswer: data.sdpAnswer });
                        console.log(`Received SDP answer for robot ${data.robotId}`);
                    }
                }
                break;
            case 'candidate':
                // Add an ICE candidate for an existing robot
                if (data.hasOwnProperty('robotId') && data.hasOwnProperty('candidate')) {
                    const robot = robots.find(robot => robot.id === data.robotId);
                    if (robot) {
                        robot.clientCandidates.push(data.candidate);
                        notifyRobot(data.robotId, { type: 'candidate', candidate: data.candidate });
                        console.log(`Received client ICE candidate for robot ${data.robotId}`);
                    }
                }
                break;
            default:
                console.log(`Received non-compliant message type ${data.type}`);
        }
    });

    // Handle client WebSocket disconnection
    ws.on('close', () => {
        // Trova l'ID del robot associato a questa connessione WebSocket
        const robotId = Object.keys(robotConnections).find(id => robotConnections[id] === ws);
        if (robotId !== undefined) {
            // Trova l'indice del robot nell'array 'robots'
            const robotIndex = robots.findIndex(robot => robot.id === parseInt(robotId));
            if (robotIndex !== -1) {
                // Rimuove il robot dall'array 'robots'
                const [removedRobot] = robots.splice(robotIndex, 1);
                // Rimuove la connessione dall'oggetto 'robotConnections'
                delete robotConnections[robotId];
            }
        }
    });
});

// Notify a specific robot with a message
function notifyRobot(robotId, message) {
    if (robotConnections[robotId]) {
        robotConnections[robotId].send(JSON.stringify(message));
        console.log(`Notified robot ${robotId} with message type ${message.type}`);
    }
}

// Notify the client with a message
function notifyClient(message) {
    if (clientConnection) {
        clientConnection.send(JSON.stringify(message));
        console.log(`Notified client with message type ${message.type}`);
    }
}