import express from 'express';
import authRoute from './authRoute.js';
import patientRoute from './patient/patientRoute.js';
import appointmentRoute from './appointment/appointmentRoute.js';
import examinationRoute from './examination/examinationRoute.js';

const Router = express.Router();

Router.use('/checkAPI', (req, res) => {
    res.status(200).json('Hello World!');
});

// Authentication routes
Router.use('/auth', authRoute);

// Patient management routes (authenticated)
Router.use('/patients', patientRoute);

// Appointment management routes
Router.use('/appointments', appointmentRoute);

// Examination management routes (authenticated)
Router.use('/examinations', examinationRoute);

export default Router;
