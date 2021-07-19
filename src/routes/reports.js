import { Router } from 'express';
import reportController from '../controllers/reportsController';
import auth from '../middleware/auth';

export default Router()
    .get('/report-auth', auth.checkAdminAuthentication, reportController.reportview.bind(reportController))
    .get('/testreport', auth.checkAdminAuthentication, reportController.testreport.bind(reportController))
    .get('/rexport-master-reports', auth.checkAdminAuthentication, reportController.exportmasterData.bind(reportController))
    .get('/rexport-master-reports2', auth.checkAdminAuthentication, reportController.exportFEnoMSwithZEmasterData.bind(reportController))
    .get('/rexport-master-reports3', auth.checkAdminAuthentication, reportController.exportFEnoMSnoZEmasterData.bind(reportController))
    .get('/reportview', auth.checkAdminAuthentication, reportController.reportGen.bind(reportController)
    );
