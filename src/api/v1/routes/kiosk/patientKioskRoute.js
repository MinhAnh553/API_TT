import express from 'express';
import {
    patientCheckIn,
    kioskRegisterPatient,
    kioskUpdatePatient,
    getPatientVisitHistory,
    getPatientPrescriptionHistory,
} from '../../../../controllers/kiosk/patientKioskController.js';

const Router = express.Router();

// Kiosk routes (no authentication required for public access)
Router.post('/check-in', patientCheckIn);
Router.post('/register', kioskRegisterPatient);
Router.put('/patient/:patientId', kioskUpdatePatient);
Router.post('/patient/:patientId/visit-history', getPatientVisitHistory);
Router.post(
    '/patient/:patientId/prescription-history',
    getPatientPrescriptionHistory,
);

export default Router;
