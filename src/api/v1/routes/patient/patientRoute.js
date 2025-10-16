import express from 'express';
import {
    createPatient,
    updatePatient,
    deletePatient,
    getPatients,
    getPatientById,
    searchPatients,
    getPatientMedicalHistory,
} from '../../../../controllers/patient/patientController.js';
import {
    authenticateToken,
    authorize,
} from '../../../../middlewares/authMiddleware.js';

const Router = express.Router();

// All routes require authentication
Router.use(authenticateToken);

// Patient CRUD operations
Router.post('/', authorize('admin', 'doctor'), createPatient);
Router.get('/search', searchPatients); // Search patients with multiple criteria
Router.get('/', getPatients); // Get all patients with optional filtering
Router.get('/:id', getPatientById); // Get patient by ID
Router.put('/:id', authorize('admin', 'doctor'), updatePatient);
Router.delete('/:id', authorize('admin'), deletePatient);

// Patient medical history
Router.get('/:id/medical-history', getPatientMedicalHistory);

export default Router;
