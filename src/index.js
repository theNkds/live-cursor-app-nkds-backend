const http = require("http");
const { WebSocketServer } = require("ws");
const url = require("url");

(async () => {
    const { v4: uuidv4 } = await import("uuid");

    const server = http.createServer();
    const wsServer = new WebSocketServer({ server });

    const PORT = process.env.PORT || 8000;
    
    const connections = {};
    const users = {};

    const broadcast = () => {
        Object.keys(connections).forEach(uuid => {
            const connection = connections[uuid];
            const message = JSON.stringify(users);
            connection.send(message)
        });
    }

    const handleMessage = (bytes, uuid) => {
        // client message = { x: 0, y: 27 }

        const message = JSON.parse(bytes.toString());
        const user = users[uuid];
        user.state = message;

        broadcast();

        console.log(`${user.username} updated thier state: ${JSON.stringify(user.state)}`);
    }

    const handleColse = (uuid) => {

        console.log(`${users[uuid].username} disconnected`);
        delete connections[uuid];
        delete users[uuid];

        broadcast();
    }

    wsServer.on("connection", (connection, request) => {
        // ws://localhost:8000?username=Darren
        
        const { username } = url.parse(request.url, true).query;
        const uuid = uuidv4();
        console.log(username);
        console.log(uuid);

        // broadcast or fan out
        connections[uuid] = connection;
        users[uuid] = {
            username: username,
            state: { }
        }

        connection.on("message", message => handleMessage(message, uuid))
        connection.on("close", () => handleColse(uuid))

    });

    server.listen(PORT, () => {
        console.log(`Websocket server is running on port : ${PORT}`)
    })
})();