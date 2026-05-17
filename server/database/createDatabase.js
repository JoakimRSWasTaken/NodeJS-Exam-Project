import db from './connection.js';
import { hashPassword } from '../utils/passwordHashing.js';

const deleteMode = process.argv.includes('--delete');
const testMode = process.argv.includes('--test');

if (deleteMode) {
    await db.exec('DROP TABLE IF EXISTS insurance_claims');
    await db.exec('DROP TABLE IF EXISTS offers');
    await db.exec('DROP TABLE IF EXISTS tasks');
    await db.exec('DROP TABLE IF EXISTS users');
}

await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name VARCHAR(25) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(50) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer' -- Der skelnes mellem 'customer', 'assignee' og 'admin'
    );
`);

await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        assignee_id INTEGER,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending', -- Der skelnes mellem 'pending', 'accepted', 'completed' og 'cancelled'
        creation_date TEXT NOT NULL, -- TEXT as ISO8601 strings ("YYYY-MM-DD HH:MM:SS.SSS") siger https://www.sqlite.org/datatype3.html
        completion_date TEXT,
        FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (assignee_id) REFERENCES users (id) ON DELETE CASCADE
    );
`);

await db.exec(`
    CREATE TABLE IF NOT EXISTS offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        assignee_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        message TEXT,
        creation_date TEXT NOT NULL, -- TEXT as ISO8601 strings ("YYYY-MM-DD HH:MM:SS.SSS") siger https://www.sqlite.org/datatype3.html
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE CASCADE
    );  
`);

await db.exec(`
    CREATE TABLE IF NOT EXISTS insurance_claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending', -- Der skelnes mellem 'pending', 'approved' og 'denied'
        creation_date TEXT NOT NULL, -- TEXT as ISO8601 strings ("YYYY-MM-DD HH:MM:SS.SSS") siger https://www.sqlite.org/datatype3.html
        handled_date TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
    );
`);

if (deleteMode) {
    const customerPassword = await hashPassword('customer123');
    const assigneePassword = await hashPassword('assignee123');
    const adminPassword = await hashPassword('admin123');

    await db.run(`INSERT INTO users (id, first_name, last_name, email, hashed_password, role) VALUES (?, ?, ?, ?, ?, ?)`, [2, 'Customer', 'Test', 'customer@test.com', customerPassword, 'customer']);
    await db.run(`INSERT INTO users (id, first_name, last_name, email, hashed_password, role) VALUES (?, ?, ?, ?, ?, ?)`, [3, 'Assignee', 'Test', 'assignee@test.com', assigneePassword, 'assignee']);
    await db.run(`INSERT INTO users (id, first_name, last_name, email, hashed_password, role) VALUES (?, ?, ?, ?, ?, ?)`, [1, 'Admin', 'Test', 'admin@test.com', adminPassword, 'admin']);

    const nowISO8601 = new Date().toISOString();
    await db.run(`
        INSERT INTO tasks (id, customer_id, assignee_id, title, description, status, creation_date, completion_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
        [1, 2, null, 'Afkalkning af brusekarbine', 'Den har brug for en omgang.', 'pending', nowISO8601, null]
    );
}

if (testMode) {
    const users = await db.all(`SELECT * FROM users`);
    const tasks = await db.all(`SELECT * FROM tasks`);

    console.log('TEST MODE INITIATED');
    console.log('Brugere:', users);
    console.log('Tasks:', tasks);
}