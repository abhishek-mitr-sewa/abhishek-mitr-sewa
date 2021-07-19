import { Router } from 'express';
import adminController from '../controllers/adminController';
const { check, validationResult } = require('express-validator');
import auth from '../middleware/auth';

export default Router()
    .get('/member-edit/:id',auth.checkAdminAuthentication, adminController.profileView.bind(adminController))
    .post('/profile',auth.checkAdminAuthentication, [
      check('f_name', 'First Name is required').not().isEmpty(),
      check('l_name', 'Last Name is required').not().isEmpty(),
      check('relative_name', 'Relative Name is required').not().isEmpty(),
      check('street', 'Street is required').not().isEmpty(),
      check('village_locality', 'Village Locality is required').not().isEmpty(),
      check('post_office', 'Post Office is required').not().isEmpty(),
      check('pin_code', 'Pin Code is required').not().isEmpty(),
      check('dob', 'Date of birth is required').not().isEmpty()
      ], adminController.profileUpdate.bind(adminController))
    .get('/view-kyc/:id',auth.checkAdminAuthentication, adminController.kyc.bind(adminController))
    .post('/kyc-1',auth.checkAdminAuthentication, [
      check('full_name', 'Full Name is required').not().isEmpty(),
      check('bank_name', 'Bank Name is required').not().isEmpty(),
      check('branch_name', 'Branch Name is required').not().isEmpty(),
      check('ifsc_code', 'IFSC Code is required').not().isEmpty(),
      check('upi_id', 'UPIID is required').not().isEmpty(),
      check('aadhar_number', 'Aadhar Number is required').not().isEmpty(),
      check('pan_number', 'PAN Number is required').not().isEmpty()
      ], adminController.bankDetailUpdate.bind(adminController))
    .get('/kyc-upload/:id',auth.checkAdminAuthentication, adminController.kycDocUplaodView.bind(adminController))
    .post('/kyc-upload',auth.checkAdminAuthentication, [
      // check('aadhar_front', 'Aadhar Front image is required').not().isEmpty(),
      // check('pan_front', 'PAN Front image is required').not().isEmpty(),
      // check('bc_agent_agreement', 'BC Agent Agreement file is required').not().isEmpty()
      ], adminController.uploadKycnew.bind(adminController)
    )
    .post('/update-member-kyc-status',auth.checkAdminAuthentication, adminController.updateMemberKYCStatus.bind(adminController))
    .get('/downloadAll', auth.checkAdminAuthentication, adminController.downloadAll.bind(adminController))
    .get('/download', auth.checkAdminAuthentication, adminController.download.bind(adminController))
    .get('/downloadbc', auth.checkAdminAuthentication, adminController.downloadbc.bind(adminController))
    .get('/downloadews', auth.checkAdminAuthentication, adminController.downloadews.bind(adminController))
    .get('/downloadBoughtDevice', auth.checkAdminAuthentication, adminController.downloadBoughtDevice.bind(adminController))
    .get('/succespaymentcsv', auth.checkAdminAuthentication, adminController.succespaymentcsv.bind(adminController))
    .get('/downloadZE', auth.checkAdminAuthentication, adminController.downloadZE.bind(adminController))
    .get('/downloadzefe/:id', auth.checkAdminAuthentication, adminController.downloadzefe.bind(adminController))
    .get('/downloadfebc/:id', auth.checkAdminAuthentication, adminController.downloadfebc.bind(adminController))





    .get('/success-payment', auth.checkAdminAuthentication, adminController.successPayment.bind(adminController) )
    .get('/failed-payment', auth.checkAdminAuthentication, adminController.failedPayments.bind(adminController) )
    .get('/create-payment', auth.checkAdminAuthentication, adminController.createPayment.bind(adminController) )
    .post('/create-payment', auth.checkAdminAuthentication, adminController.postCreatePayment.bind(adminController) )
    .post('/deleteZe', auth.checkAdminAuthentication, adminController.deleteZe.bind(adminController))
    // .get('/marketing-report',  adminController.marketingreport.bind(adminController))
    // .get('/accounting-report',  adminController.accountingreport.bind(adminController))
    .get('/update-admin-profile', auth.checkAdminAuthentication, adminController.showAdminProfile.bind(adminController))
    .post('/update-admin-profile', auth.checkAdminAuthentication, adminController.postAdminProfile.bind(adminController))


    .get('/login', adminController.index.bind(adminController))
    .post('/login', adminController.login.bind(adminController))
    
    .get('/resetpass', adminController.forgotpass.bind(adminController))
    .post('/resetpass', adminController.forgotpassword.bind(adminController))
    .get('/admin-bima-reports-csv/:state', auth.checkAdminAuthentication, adminController.adminBimaReportsCsv.bind(adminController))
    .get('/admin-dashboard', auth.checkAdminAuthentication, adminController.dashboard.bind(adminController))
    .get('/report-cards', auth.checkAdminAuthentication, adminController.reportcards.bind(adminController))
    .get('/fe-list-view', auth.checkAdminAuthentication, adminController.fe_list_view.bind(adminController))
    .get('/admin-report-cards/:id', auth.checkAdminAuthentication, adminController.adminReportCards.bind(adminController))

    .get('/create-payouts', auth.checkAdminAuthentication, adminController.create_payouts.bind(adminController))
    .post('/create-payouts', auth.checkAdminAuthentication, adminController.upload_payouts.bind(adminController))
    .get('/list-payouts', auth.checkAdminAuthentication, adminController.list_payouts.bind(adminController))
   
    .get('/list-fe-payouts', auth.checkAdminAuthentication, adminController.list_FE_payouts.bind(adminController))
    
    .get('/list-ze-payouts', auth.checkAdminAuthentication, adminController.list_ZE_payouts.bind(adminController))
    // .get('/generate-payouts', auth.checkAdminAuthentication, adminController.generate_payouts.bind(adminController)) 
    .post('/generate-payouts', auth.checkAdminAuthentication, adminController.generate_payouts.bind(adminController))
    .post('/fe-payouts', auth.checkAdminAuthentication, adminController.insert_fePayouts.bind(adminController))
    .get('/fe-own-payouts-list', auth.checkAdminAuthentication, adminController.feOwnPayouts.bind(adminController))
    .get('/fe-full-payouts', auth.checkAdminAuthentication, adminController.feFullPayouts.bind(adminController))
    .get('/ze-payouts-export/:year/:month', auth.checkAdminAuthentication, adminController.ze_payouts_export.bind(adminController))
    .get('/fe-payouts-export/:year/:month', auth.checkAdminAuthentication, adminController.fe_payouts_export.bind(adminController))
    .get('/list-payouts-export/:year/:month', auth.checkAdminAuthentication, adminController.list_payouts_export.bind(adminController))
    .get('/fe-own-payouts-export/:year/:month', auth.checkAdminAuthentication, adminController.feOwnPayout_export.bind(adminController))
    .get('/fe-full-payouts-export/:year/:month', auth.checkAdminAuthentication, adminController.feFullPayoutExport.bind(adminController))

    
    .get('/chooseze', auth.checkAdminAuthentication, adminController.chooseze.bind(adminController))
    .post('/selectFEByLocation', auth.checkAdminAuthentication, adminController.selectFEByLocation.bind(adminController))
    .post('/createMArqMsg', auth.checkAdminAuthentication, adminController.postCreateMArqMsg.bind(adminController))
    .post('/saveselectedfe', auth.checkAdminAuthentication, adminController.saveselectedfe.bind(adminController))
    .get('/list-ze', auth.checkAdminAuthentication, adminController.listze.bind(adminController))
    .get('/zefelist/:id', auth.checkAdminAuthentication, adminController.zefelist.bind(adminController))
    .get('/febclist/:id', auth.checkAdminAuthentication, adminController.febclist.bind(adminController))
    .get('/admin-bima-reports/:state', auth.checkAdminAuthentication, adminController.adminBimaReports.bind(adminController))
    .get('/admin-bima-bc-reports/:state/:referrerCode', auth.checkAdminAuthentication, adminController.adminBimaBCReports.bind(adminController))
    .get('/cron-for-bima/:state', auth.checkAdminAuthentication, adminController.cronForBima.bind(adminController))
    .get('/bc-list-export/:state', auth.checkAdminAuthentication, adminController.bc_list_view_export.bind(adminController))
    .get('/fe-list-export/:state', auth.checkAdminAuthentication, adminController.fe_list_view_export.bind(adminController))
    .get('/bima-state-wise', auth.checkAdminAuthentication, adminController.bimaStateWise.bind(adminController))

    .get('/getEmptyAccountNumber', auth.checkAdminAuthentication,adminController.getEmptyAccountNumber.bind(adminController))
    .get('/bc-list-view/:state', auth.checkAdminAuthentication, adminController.bc_list_view_mis.bind(adminController))
    .get('/fe-list-view/:state', auth.checkAdminAuthentication, adminController.fe_list_view_mis.bind(adminController))
    .get('/fe-bc-sheet', auth.checkAdminAuthentication,adminController.feBcSheet.bind(adminController))
    



    
      
    .get('/create-admin', auth.checkAdminAuthentication,adminController.create.bind(adminController))
    //.get('/view', auth.checkAdminAuthentication, adminController.view.bind(adminController))
    .get('/list', auth.checkAdminAuthentication, adminController.listMember.bind(adminController))
    .get('/list-bca', auth.checkAdminAuthentication, adminController.listBC.bind(adminController))
    .get('/list-ews', auth.checkAdminAuthentication, adminController.listews.bind(adminController))
    .get('/listAgent', auth.checkAdminAuthentication, adminController.listAgent.bind(adminController))
    .get('/boughtdevice', auth.checkAdminAuthentication, adminController.boughtdevice.bind(adminController))
    .post('/memberTypeUpdate', auth.checkAdminAuthentication, [check('member_type', 'Member Type is required').not().isEmpty(),], adminController.memberTypeUpdate.bind(adminController))
    .post('/memberDelete', auth.checkAdminAuthentication, [check('conf_val', 'Please enter Mobile Number is required').not().isEmpty(),], adminController.memberDelete.bind(adminController))
    .get('/bima-state-wise', auth.checkAdminAuthentication, adminController.bimaStateWise.bind(adminController)

    );
