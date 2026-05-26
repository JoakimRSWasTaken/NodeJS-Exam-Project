# NodeJS-Exam-Project

## Running the project
1. Clone the project
   - https://github.com/JoakimRSWasTaken/NodeJS-Exam-Project.git
   - git@github.com:JoakimRSWasTaken/NodeJS-Exam-Project.git
1. Open two terminal windows
2. In terminal 1, stay in the root folder, in terminal 2, `$ cd client`
3. In terminal 1, run `$ node server/database/connection.js`
4. In terminal 1, run `$ node server/database/createDatabase.js`.
   - You can run `createDatabase.js` with either the `--delete` flag or the `--test` flag
   - `--delete` deletes existing data and seeds again
   - `--test` prints the existing data to the console
6. In terminal 1, run `$ node server/app.js` or `$ nodemon server/app.js`
7. In terminal 2, run `$ npm run dev`
8. Open `https://localhost:5173`

## Backend modules:
- express
- express-rate-limit
- express-session
- cors
- bcrypt
- dotenv
- helmet
- nodemailer

- pg
- sqlite3
- sqlite
