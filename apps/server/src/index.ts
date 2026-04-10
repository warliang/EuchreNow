import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
	cors: {
		origin: process.env.CLIENT_URL || 'http://localhost:5173',
		methods: ['GET', 'POST'],
	},
});

app.use(cors());
app.use(express.json());

// basic health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
	console.log('client connected:', socket.id);

	socket.on('disconnect', () => {
		console.log('client disconnected:', socket.id);
	});
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
	console.log(`server running on port ${PORT}`);
});
