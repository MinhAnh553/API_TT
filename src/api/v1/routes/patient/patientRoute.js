import express from 'express';
import {
    createPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient,
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
Router.get('/', getPatients);
Router.get('/:id', getPatientById);
Router.put('/:id', authorize('admin', 'doctor'), updatePatient);
Router.delete('/:id', authorize('admin'), deletePatient);

// Patient medical history
Router.get('/:id/medical-history', getPatientMedicalHistory);

export default Router;
