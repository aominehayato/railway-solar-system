import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { HelioVector, Body } from 'astronomy-engine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 80;

app.use(express.static(path.join(__dirname, 'public')));

const planets = [
    { name: 'Mercury', body: Body.Mercury },
    { name: 'Venus', body: Body.Venus },
    { name: 'Earth', body: Body.Earth },
    { name: 'Mars', body: Body.Mars },
    { name: 'Jupiter', body: Body.Jupiter },
    { name: 'Saturn', body: Body.Saturn },
    { name: 'Uranus', body: Body.Uranus },
    { name: 'Neptune', body: Body.Neptune }
];

function getPlanetPositions() {
    const now = new Date();
    const data = {
        time: now.toISOString(),
        planets: {}
    };

    planets.forEach(p => {
        const vec = HelioVector(p.body, now);
        data.planets[p.name] = {
            x: vec.x,
            y: vec.y,
            z: vec.z
        };
    });

    return data;
}

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send(JSON.stringify(getPlanetPositions()));

    const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(getPlanetPositions()));
        }
    }, 1000);

    ws.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
