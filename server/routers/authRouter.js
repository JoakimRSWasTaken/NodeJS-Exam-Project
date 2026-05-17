import { Router } from 'express';
import { hashPassword, comparePasswords } from '../utils/passwordHashing.js';
import { sendWelcomeMail } from '../utils/mailSender.js';
import db from '../database/connection.js';

const router = Router();

router.post('/auth/signup', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        res.status(400).send({ errorMessage: "Please provide both email, password and desired goal with the platform." });
    }

    if (role !== 'customer' && role !== 'assignee') {
        return res.status(400).send({ errorMessage: "Invalid role selected. Please select 'customer' or 'assignee'.", role });
    }

    const hashedPassword = await hashPassword(password);
    await db.run(`INSERT INTO users (email, hashed_password, role) VALUES (?, ?, ?)`, [email, hashedPassword, role]);

    try {
        await sendWelcomeMail(email)
    } catch (error) {
        console.error({ errorMessage: 'Error sending welcome mail', error });
    }

    res.status(201).send({ message: `User with email ${email} created.` });
});

router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send({ errorMessage: "Please provide both email and password." });
        }

        const user = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);
        if (!user) {
            // No matching email is found in the database
            return res.status(401).send({ errorMessage: "Wrong email or password." });
        }

        const userHashedPassword = user.hashed_password;
        const isSamePassword = await comparePasswords(password, userHashedPassword);
        if (!isSamePassword) {
            // The input password does not match the password in the database
            return res.status(401).send({ errorMessage: "Wrong email or password." });
        }

        let isAdmin = false;
        if (user.is_admin === 1) {
            isAdmin = true;
        }

        req.session.user = {
            email: user.email,
            isAdmin: isAdmin
        }

        return res.send({ message: 'Logged in as user: ', user: req.session.user });
    } catch (error) {
        console.error('FEJL FEJL, JEG GÅR AMOK', error);
        res.status(500).send({ errorMessage: 'Pis mig i munden' });
    }
});

router.post('/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.send({ data: "User logged out." });
    });
});

export default router;