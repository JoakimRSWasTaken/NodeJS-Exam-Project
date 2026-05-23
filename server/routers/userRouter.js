import { Router } from 'express';
import { isLoggedIn, isAllowedRole } from '../utils/authMiddleware.js';

const router = Router();


// Tasks - Generelt

router.get('/api/tasks/pending', isLoggedIn, isAllowedRole(['customer', 'assignee']), async (req, res) => {
    const tasks = await db.all(`
        SELECT tasks.*, users.first_name AS customer_name
        FROM tasks
        JOIN users ON tasks.customer_id = users.id
        ORDER BY tasks.creation_date DESC
    `);

    return res.send({ data: tasks });
});

router.get('/api/tasks/my-tasks', isLoggedIn, isAllowedRole(['customer', 'assignee']), async (req, res) => {
    const userId = req.session.user.id;
    const role = req.session.user.role;
    let tasks = [];

    if (role === 'customer') {
        tasks = await db.all(`
            SELECT * FROM tasks
            WHERE customer_id = ?
            ORDER BY tasks.creation_date DESC
        `, [userId]);
    } else if (role === 'assignee') {
        tasks = await db.all(`
            SELECT * FROM tasks
            WHERE assignee_id = ?
            ORDER BY tasks.creation_date DESC
        `, [userId]);
    }

    return res.send({ data: tasks });
});


// Customer

router.post('/api/tasks', isLoggedIn, isAllowedRole(['customer']), async (req, res) => {
    const { title, description } = req.body;
    const customerId = req.session.user.id;
    const nowISO8601 = new Date().toISOString();

    if (!title) {
        title = 'Need title';
    }
    if (!description) {
        description = 'Need description';
    }

    const result = await db.run(`
        INSERT INTO tasks (customer_id, assignee_id, title, description, creation_date, completion_date)
        VALUES (?, null, ?, ?, ?, null)
    `, [customerId, title, description, nowISO8601]);

    return res.status(201).send({ data: result });
});


router.put('/api/tasks/:id', isLoggedIn, isAllowedRole(['customer']), async (req, res) => {

    const taskId = req.params.id;
    const customerId = req.session.user.id;
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).send({ errorMessage: 'Please provide an updated title and description.' });
    }

    const taskToUpdate = await db.all(`SELECT * FROM tasks WHERE id = ?`, [taskId]);
    if (!taskToUpdate) {
        return res.status(404).send({ errorMessage: `Task with id ${taskId} not found.` });
    }

    if (task.customer_id !== customerId) {
        return res.status(403).send({ errorMessage: `User with id ${customerId}, you, does not own task with id ${taskId}.` });
    }

    if (task.status !== 'pending') {
        return res.status(403).send({ errorMessage: `Task with id ${taskId} is not pending and cannot be edited.` });
    }

    const updatedTask = await db.get(`
        UPDATE tasks 
        SET title = ?, description = ? 
        WHERE id = ?
        RETURNING *
        `, [title, description, taskId]);
    return res.send({ data: updatedTask });
});


router.delete('/api/tasks/:id', isLoggedIn, isAllowedRole(['customer']), async (req, res) => {

    const taskId = req.params.id;
    const customerId = req.session.user.id;

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) return res.status(404).send({ errorMessage: `Task with id ${taskId} not found.` });

    if (task.customer_id !== customerId) {
        return res.status(403).send({ errorMessage: `User with id ${customerId}, you, does not own task with id ${taskId}.` });
    }

    await db.run('DELETE FROM tasks WHERE id = ?', [taskId]);
    return res.send({ message: `Task with id ${taskId} deleted successfully.` });
});


// Assignee

router.get('/api/offers/my-bids', isLoggedIn, isAllowedRole(['assignee']), async (req, res) => {

    const assigneeId = req.session.user.id;

    const tasksWithMyOffers = await db.all(`
            SELECT tasks.*, offers.amount AS offer_amount, offers.creation_date AS offer_date
            FROM tasks
            JOIN offers ON tasks.id = offers.task_id
            WHERE offers.assignee_id = ?
            ORDER BY offers.creation_date DESC
        `, [assigneeId]);

    return res.send({ data: tasksWithMyOffers });
});

router.post('/api/tasks/:id/offers', isLoggedIn, isAllowedRole(['assignee']), async (req, res) => {

    const taskId = req.params.id;
    const assigneeId = req.session.user.id;
    const { amount, message } = req.body;

    if (!amount) {
        return res.status(400).send({ errorMessage: 'Please provide an amount.' });
    }

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
        return res.status(404).send({ errorMessage: `Task with id ${taskId} not found.` });
    }

    if (task.status !== 'pending') {
        return res.status(400).send({ errorMessage: `Task with id ${taskId} is not open for receiving offers.` });
    }

    const nowISO8601 = new Date().toISOString();

    const result = await db.run(`
            INSERT INTO offers (task_id, assignee_id, amount, message, creation_date)
            VALUES (?, ?, ?, ?, ?)
        `, [taskId, assigneeId, amount, message || null, nowISO8601]);

    return res.status(201).send({ data: result });
});


// Insurance claims

router.get('/api/insurance-claims/my-insurance-claims', isLoggedIn, isAllowedRole(['customer']), async (req, res) => {
    const customerId = req.session.user.id;

    const claims = await db.all(`
            SELECT insurance_claims.*, tasks.title AS task_title 
            FROM insurance_claims
            JOIN tasks ON insurance_claims.task_id = tasks.id
            WHERE insurance_claims.customer_id = ?
            ORDER BY insurance_claims.creation_date DESC
        `, [customerId]);

    return res.send({ data: claims });
});

router.post('/api/insurance-claims', isLoggedIn, isAllowedRole(['customer']), async (req, res) => {
    const customerId = req.session.user.id;
    const { taskId, description } = req.body;

    if (!taskId || !description) {
        return res.status(400).send({ errorMessage: 'Please provide both a valid task and a description.' });
    }

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);

    if (!task) {
        return res.status(404).send({ errorMessage: `Task with id ${taskId} not found.` });
    }

    if (task.customer_id !== customerId) {
        return res.status(403).send({ errorMessage: 'You are not the owner of this task.' });
    }

    const now = new Date().toISOString();

    const result = await db.run(`
            INSERT INTO insurance_claims (task_id, customer_id, description, creation_date, handled_date)
            VALUES (?, ?, ?, ?, null)
        `, [taskId, customerId, description, now]);

    return res.status(201).send({ data: result });
});


export default router;