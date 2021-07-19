import { Router } from 'express';
import membersController from '../controllers/membersController';
import usersModel from "../models/users";

import auth from '../middleware/auth';

const { check, validationResult } = require('express-validator');

export default Router()
    .get('/signup', membersController.signup.bind(membersController))
    .post('/createOTP', membersController.createOTP.bind(membersController))
    .post('/otpverify', membersController.otpverify.bind(membersController))
    .get('/create-user', membersController.signup.bind(membersController))
    .post('/create-user', [
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
      check('otpVal').not().isEmpty().withMessage('OTP filed is required'),
      check('referl_code').not().isEmpty().withMessage('Referal Code is required'),
      check('password', 'Password is required').not().isEmpty()
      ], membersController.create.bind(membersController))
    .get('/dashboard', auth.checkUserAuthentication, membersController.dashboard.bind(membersController))
    .get('/profile', auth.checkUserAuthentication, membersController.profile.bind(membersController))
    .post('/profile', [
      check('f_name', 'First Name is required').not().isEmpty(),
      check('l_name', 'Last Name is required').not().isEmpty(),
      check('relative_name', 'Relative Name is required').not().isEmpty(),
      check('street', 'Street is required').not().isEmpty(),
      check('village_locality', 'Village Locality is required').not().isEmpty(),
      check('post_office', 'Post Office is required').not().isEmpty(),
      check('pin_code', 'Pin Code is required').not().isEmpty(),
      check('dob', 'Date of birth is required').not().isEmpty(),
      check('gender', 'Gender is required').not().isEmpty(),

      ], auth.checkUserAuthentication, membersController.profileUpdate.bind(membersController))
    .get('/kyc-1', auth.checkUserAuthentication, membersController.kyc.bind(membersController))
    .post('/kyc-1', [
      check('full_name', 'Full Name is required').not().isEmpty(),
      check('bank_name', 'Bank Name is required').not().isEmpty(),
      check('branch_name', 'Branch Name is required').not().isEmpty(),
      check('ifsc_code', 'IFSC Code is required').not().isEmpty(),
      check('aadhar_number', 'Aadhar Number is required').not().isEmpty(),
      check('pan_number', 'PAN Number is required').not().isEmpty()
      ], auth.checkUserAuthentication, membersController.bankDetailUpdate.bind(membersController))
    .get('/kyc-upload', auth.checkUserAuthentication, membersController.kycDocUplaodView.bind(membersController))
    .post('/kyc-upload', [
      // check('bc_agent_signature', 'Signature is required').not().isEmpty(),
      check('pan_front', 'PAN Front image is required').not().isEmpty(),
      check('bc_agent_agreement', 'BC Agent Agreement file is required').not().isEmpty()
      ], auth.checkUserAuthentication, membersController.kycDocUplaod.bind(membersController))
    .get('/choose-bank', auth.checkUserAuthentication, membersController.chooseBank.bind(membersController))
    .post('/downloadNotiFile', auth.checkUserAuthentication, membersController.downloadNotiFile.bind(membersController))
    .post('/savebldgroup', auth.checkUserAuthentication, membersController.savebldgroup.bind(membersController))
    .post('/addTempPackage', auth.checkUserAuthentication, membersController.addTempPackage.bind(membersController))
    .post('/remTempPackage', auth.checkUserAuthentication, membersController.remTempPackage.bind(membersController))
    .get('/paymentsuccess', membersController.paymentSuccess.bind(membersController))
    .get('/paymentfail', membersController.paymentFails.bind(membersController))
    .post('/makePayment', auth.checkUserAuthentication, membersController.makePayment.bind(membersController))
    .post('/checkValidReferal', membersController.checkValidReferal.bind(membersController))
    .post('/checkValidMobile', membersController.checkValidMobile.bind(membersController))
    .post('/checkValidMobileNumber', membersController.checkValidMobileNumber.bind(membersController))
    
    .get('/ms-engagement-certificate',auth.checkUserAuthentication, membersController.msEngagementCertificate.bind(membersController))
    .get('/engagement-letter-pdf',auth.checkUserAuthentication, membersController.generate_engagement_certificate.bind(membersController))
    .get('/ms-engagement-letter',auth.checkUserAuthentication, membersController.msEngagementLetter.bind(membersController))
    


    .post('/add_amazon_details', auth.checkUserAuthentication, membersController.add_amazon_details.bind(membersController))
    .post('/add_fino_details', auth.checkUserAuthentication, membersController.add_fino_details.bind(membersController))
    .get('/response', membersController.response.bind(membersController))
    .post('/response', membersController.response.bind(membersController)
    );
