import { Router } from 'express';
import amController from '../controllers/amController';

import auth from '../middleware/auth';


export default Router()
.get('/fe-details/',auth.checkAdminAuthentication, amController.feDetails.bind(amController))
.get('/fe-list-export/:state', auth.checkAdminAuthentication, amController.fe_list_view_export.bind(amController))
.get('/bc-list-export/', auth.checkAdminAuthentication, amController.bcDetails.bind(amController))
.get('/inactive-users/', auth.checkAdminAuthentication, amController.inactive_users.bind(amController))
.get('/bc-list-export/:state', auth.checkAdminAuthentication, amController.bc_list_view_export.bind(amController));