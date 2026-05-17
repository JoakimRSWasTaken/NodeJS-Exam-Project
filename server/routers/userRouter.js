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
        return res.status(400).send({ errorMessage: "Please provide an updated title and description." });
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

// route til at afgive bud på en opgave

// Insurance claims

// route til at se sine egne insurance claims
// route til at oprette en insurance claim


export default router;