import { Router } from 'express';
import apisController from '../controllers/apisController';
import auth from '../middleware/auth';

export default Router()
    .post('/getUserDetailsByPAN', apisController.getUserDetailsByPAN.bind(apisController))
    .post('/getZEFEDetails', apisController.getZEFEDetails.bind(apisController))
    .post('/getAllUserDetails', apisController.getAllUserDetails.bind(apisController)
    );
