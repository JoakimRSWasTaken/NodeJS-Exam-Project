import 'dotenv/config';
// import dotenv from 'dotenv';
// dotenv.config({ path: './.env' });
import express from 'express';

const app = express();

import helmet from 'helmet';
app.use(helmet());

import cors from 'cors';
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

import { rateLimit } from 'express-rate-limit';
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 50, // Limit each IP to 50 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
    // store: ... , // Redis, Memcached, etc. See below.
});
app.use(generalLimiter);

// ------------------------------------------------- FJERN ELLER BRUG ----------------------------------------------------
// const authLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     limit: 5,
//     standardHeaders: 'draft-8',
//     legacyHeaders: false,
//     ipv6Subnet: 56,
// });
// app.use('/auth', authLimiter);

import session from 'express-session';
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'super-secret-development-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
});

app.use(sessionMiddleware);

// Routers

app.use(express.json());

import authRouter from './routers/authRouter.js';
app.use(authRouter);

// import adminRouter from './routers/adminRouter.js';
// app.use(adminRouter);

import userRouter from './routers/userRouter.js';
app.use(userRouter);

// Sockets

import http from 'http';
const server = http.createServer(app);

import { Server } from 'socket.io';
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
});

io.engine.use(sessionMiddleware);

io.on("connection", (socket) => {
    console.log('A new socket connected with id', socket.id);

    socket.on("disconnect", () => {
        console.log("A socket disconnected", socket.id);
    });
});


// Listen

const PORT = process.env.PORT ?? 8080;

server.listen(PORT, () =>  console.log('Server is listening on', PORT));