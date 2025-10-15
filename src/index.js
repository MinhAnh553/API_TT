import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';

import * as database from './config/database.js';
import apiRoute from './api/v1/routes/indexRoute.js';

// env
dotenv.config();

// App, port
const app = express();
const port = process.env.PORT || 3001;

//config req.body
app.use(express.json()); // for json
app.use(express.urlencoded({ extended: true }));

// Config static file
app.use(express.static(path.join(process.cwd(), 'public')));

// Database
database.connect();

// Cors
app.use(cors());

// Route
app.use('/api/v1', apiRoute);

app.listen(port, () => {
    console.log(`Project back-end running at http://localhost:${port}...`);
});
