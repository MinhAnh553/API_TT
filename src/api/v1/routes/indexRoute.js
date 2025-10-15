import express from 'express';
import { userRoute } from './userRoute.js';
import authRoute from './authRoute.js';
import patientRoute from './patient/patientRoute.js';
import patientKioskRoute from './kiosk/patientKioskRoute.js';

const Router = express.Router();

Router.use('/checkAPI', (req, res) => {
    res.status(200).json('Hello World!');
});

// Authentication routes
Router.use('/auth', authRoute);

// User management routes
Router.use('/user', userRoute);

// Patient management routes (authenticated)
Router.use('/patients', patientRoute);

// Kiosk routes (public access)
Router.use('/kiosk/patients', patientKioskRoute);

export default Router;
