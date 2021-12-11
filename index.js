const fs = require("fs");
const WebSocketServer = require("ws").WebSocketServer;
const http = require("http");
const express = require("express");
const app = express();
const port = 3000;

const config = require("./config.js");
const plugins = ["smartcielo", "ewelink"];

let devices = [];
let connection;
const platforms = {};

// Register plugins and sign in!
plugins.forEach(name => {
    platforms[name] = require(`./plugins/${name}`);
    platforms[name].auth(onUpdate);
});

// Update device list
async function onUpdate(_devices) {
    const ids = devices.map(d => d.id);
    _devices.forEach(d => {
        const index = ids.indexOf(d.id);
        if (index !== -1) devices[index] = d;
        else devices.push(d);
    });
    broadcastDevices(devices);
}

function broadcastDevices(devices) {
    // Since we can't send whole functions via websocket, we'll just send the function names
    const data = JSON.parse(JSON.stringify(devices));
    devices.forEach((d, i) => {
        if (d.abilities) data[i].abilities = Object.keys(d.abilities);
    });

    if (wss) wss.broadcast({name: "update", data});
}

// Create server
const server = http.createServer(app, port);

// Set up sockets
const wss = new WebSocketServer({server});
wss.on("connection", ws => {
    send(ws, "connected", devices);
    ws.on("message", data => {
        try {
            const obj = JSON.parse(data.toString());
            const device = devices.find(d => d.id === obj.data);

            if (device && typeof device.abilities[obj.name] === "function") {
                device.abilities[obj.name](obj.data);
            }
        } catch (e) {
            console.error("Malformed response from client: " + e);
        }
    });
});

wss.broadcast = obj => {
    wss.clients.forEach(client => {
        const str = JSON.stringify(obj);
        client.send(str);
    });
};

function send(ws, name, obj) {
    ws.send(JSON.stringify({name, data: obj}));
}

app.get("/", (req, res) => res.sendFile(__dirname + "/client.html"));
app.get("/api", (req, res) => res.send(JSON.stringify(devices)));
server.listen(port, () => console.log(`Server listening at http://localhost:${port}`));
