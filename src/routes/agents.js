import { Router } from 'express';
import agentsController from '../controllers/agentsController';
import auth from '../middleware/auth';
import usersModel from "../models/users";

const { check, validationResult } = require('express-validator');

export default Router()
    .get('/dashboard',auth.checkAgentAuthentication, agentsController.dashboard.bind(agentsController))
    .get('/create-ms',auth.checkAgentAuthentication, agentsController.create_ms.bind(agentsController))
    .post('/create-ms',auth.checkAgentAuthentication, [
      check('email', 'Email is required').not().isEmpty().custom((value, {req}) => {
        return new Promise((resolve, reject) => {
          usersModel.findOne({email:req.body.email}, function(err, user){
            if(err) {
              reject(new Error('Server Error'))
            }
            if(Boolean(user)) {
              reject(new Error('Email already in use'))
            }
            resolve(true)
          });
        });
      }),
      check('mobile').not().isEmpty().withMessage('Mobile is required')
      .custom((value, {req}) => {
        return new Promise((resolve, reject) => {
          usersModel.findOne({mobile:req.body.mobile}, function(err, user){
            if(err) {
              reject(new Error('Server Error'))
            }
            if(Boolean(user)) {
              reject(new Error('Mobile already in use'))
            }
            resolve(true)
          });
        });
      }),
    ], agentsController.create_ms_post.bind(agentsController))
    .post('/downloadNotiFile',auth.checkAgentAuthentication, agentsController.downloadNotiFile.bind(agentsController))
    .post('/savebldgroup', auth.checkAgentAuthentication, agentsController.savebldgroup.bind(agentsController))
    .get('/list',auth.checkAgentAuthentication, agentsController.listMember.bind(agentsController))
    .get('/member-edit/:id',auth.checkAgentAuthentication, agentsController.profileView.bind(agentsController))
    // .get('/edit-member/:id ', agentsController.profileView.bind(agentsController))
    .post('/profile',auth.checkAgentAuthentication, [
      check('f_name', 'First Name is required').not().isEmpty(),
      check('l_name', 'Last Name is required').not().isEmpty(),
      check('relative_name', 'Relative Name is required').not().isEmpty(),
      check('street', 'Street is required').not().isEmpty(),
      check('village_locality', 'Village Locality is required').not().isEmpty(),
      check('post_office', 'Post Office is required').not().isEmpty(),
      check('pin_code', 'Pin Code is required').not().isEmpty(),
      check('dob', 'Date of birth is required').not().isEmpty()
      ], agentsController.profileUpdate.bind(agentsController))
    .get('/view-kyc/:id',auth.checkAgentAuthentication, agentsController.kyc.bind(agentsController))
    .post('/kyc-1',auth.checkAgentAuthentication, [
      check('full_name', 'Full Name is required').not().isEmpty(),
      check('bank_name', 'Bank Name is required').not().isEmpty(),
      check('branch_name', 'Branch Name is required').not().isEmpty(),
      check('ifsc_code', 'IFSC Code is required').not().isEmpty(),
      check('upi_id', 'UPIID is required').not().isEmpty(),
      check('aadhar_number', 'Aadhar Number is required').not().isEmpty(),
      check('pan_number', 'PAN Number is required').not().isEmpty()
      ], agentsController.bankDetailUpdate.bind(agentsController))
    .get('/kyc-upload/:id',auth.checkAgentAuthentication, agentsController.kycDocUplaodView.bind(agentsController))
    .post('/kyc-upload',auth.checkAgentAuthentication, [
      check('bc_agent_signature', 'Signature is required').not().isEmpty(),
      // check('aadhar_front', 'Aadhar Front image is required').not().isEmpty(),
      check('pan_front', 'PAN Front image is required').not().isEmpty(),
      check('bc_agent_agreement', 'BC Agent Agreement file is required').not().isEmpty()
      ], agentsController.uploadKycnew.bind(agentsController)
    )
    
    .get('/fe-certificate',auth.checkAgentAuthentication, agentsController.feCertificate.bind(agentsController))
    .get('/fe-letter',auth.checkAgentAuthentication, agentsController.feEngagementLetter.bind(agentsController))


    .post('/update-member-kyc-status',auth.checkAgentAuthentication, agentsController.updateMemberKYCStatus.bind(agentsController));
