import usersModel from "../models/users";
import otpModel from "../models/otp";
import usersDetailModel from "../models/usersDetail";
import kycModel from "../models/kyc";
import chooseDevicesModel from "../models/chooseDevices";
import paymentModel from "../models/payment";
import failedPaymentModel from "../models/failedPayment";
import paymentDataModel from "../models/paymentData";
import marqMsgModel from "../models/marqueMessage"
import referralCodeGenerator from 'referral-code-generator';
import Storage from "local-storage";
import fileUpload from 'express-fileupload';
import middleware from '../middleware/helper';
import http from 'http';

import { exit } from "process";
import fs from 'fs';
import path from 'path';
const session = require("express-session");
const bcrypt = require('bcrypt');
const uuid = require('../../public/uuid-random');
const { check, validationResult } = require('express-validator');
const request = require("request");
//const auth = require('../middleware/auth');
const base64 = require('base-64');
const utf8 = require('utf8');
var querystring = require("querystring");
const url = require('url'); 
import pdf from 'html-pdf';
import ejs  from "ejs";
const paymentData = require('../models/paymentData');



class membersController {

  async signup (req, res, next){  
    let mobile = null;
    
    Storage.set('OTP', {"verfied": req.session.verifyMobileStatus, 'mobile': req.session.mobile, otp: req.session.otp});
    res.render('frontend/signup', {'path': '../',  title: 'Create User', status: 1,  "otp": Storage.get('OTP'), message: null });
  }

  async createOTP (req, res, next){ // create OTP asn save in DB
    var data = req.body;
    Storage.clear() // Clear the local storage for fresh local storage
    const otp = referralCodeGenerator.custom('lowercase', 0, 6, 'aa');
    data.mobile_email = data.mobile;
    data.otp = otp;
    data.otp_status = 'send';
    const query = { mobile_email: data.mobile };
    const result = await otpModel.deleteMany(query);
    
    let svOTP = await otpModel.create(data);
    
       // send SMS 
    var sendSMS = middleware.sendSMSFN(data.mobile, otp);
    req.session.mobile = data.mobile;
    req.session.otp = otp;
    Storage.set('OTP', {"otp": otp, mobile : data.mobile}); // Set otp in local storage.
    
    res.send((svOTP)? true : false);
  }
  
  async otpverify(req, res, next){ // on otp verify click check otp from localstorage 
    var data = req.body;
    const enteredOTP = data.otp;
    let savedOTP = Storage.get('OTP') ? Storage.get('OTP').otp :  null; //get the storaged value

    if(data.mobile) {
      
      let findOtpModel = await otpModel.findOne({'mobile_email' : data.mobile});
      if(findOtpModel) {
        savedOTP = findOtpModel.otp;
      } else {
        return res.send(false);  
      }
      
    }
    if(enteredOTP === savedOTP){
      req.session.verifyMobileStatus = true;
      Storage.set('OTP', {"verfied": req.session.verifyMobileStatus, 'mobile': req.session.mobile, otp: req.session.otp});
      return res.send(true);
    }
    else{
      req.session.verifyMobileStatus = false;
      Storage.set('OTP', {"verfied": req.session.verifyMobileStatus, 'mobile': req.session.mobile, otp: req.session.otp});
      return res.send(false);
    }
  }

  async create (req, res, next){
    var data = req.body;
    const errors = validationResult(req);
    try {
      var obj = {};
      // Find the referal code

      var referrer_code = referralCodeGenerator.custom('uppercase', 6, 6, 'MitrBcss');
      obj["user_type"] = "USER";
     
      if (!errors.isEmpty()) {
          let obj = {userType : 'user'};
          Storage.set('memberDetails', obj);
          Storage.set('OTP', {"verfied": req.session.verifyMobileStatus, 'mobile': req.session.mobile, otp: req.session.otp});

          req.session.verifyMobileStatus = null;
          // req.session.areaManagerNameMobile = null;
          // res.locals.areaManagerNameMobile = req.session.areaManagerNameMobile;
          
          res.render('frontend/signup', {"otp": Storage.get('OTP'), "data": Storage.get('memberDetails'), 'path': '../',  "leftMenuType": middleware.checkLeftMenuFN(req, res), title: 'Create User', status: 0,  message: errors.mapped() });
      }else{
        Storage.clear() // Clear the local storage for fresh local storage
         // Generate a salt
        const salt = await bcrypt.genSalt(10);
      //  const referrer_code = referralCodeGenerator.custom('uppercase', 6, 6, 'MitrSewa');
        data.password = await bcrypt.hash(data.password, salt);
        data.token = uuid();
        data.referrer_code = referrer_code;
        data.referl_code = data.referl_code.toUpperCase();
        data.whatsapp_no = null;
        data.email_status = 'no';
        data.mobile_status = 'yes';
        data.kyc_status = 'no';
        data.payment_status = 'no';
        data.user_type = obj["user_type"];
        data.status = 'active';
        data.profile_image = '/images/avatars/avatar.svg';
        
        let svData = await usersModel.create(data);
        req.session.user = svData; 
        // ye maine comment kar diya hai... 
        res.locals.user = req.session.user;
        let userOtherDetailData = {user_id : svData._id,  f_name: null, m_name: null, l_name: null, relative_name: null, house_number: null, street:null, village_locality: null, post_office: null, city: null, state: null, pin_code: null, status: 'active'}
        let usrdt = await usersDetailModel.create(userOtherDetailData); // Save userid in User Details table on user signup.
        
        let userKYCDetailData = {user_id : svData._id, full_name : null, bank_name : null, branch_name : null, ifsc_code: null, upi_id: null, account_number: null, aadhar_number: null, pan_number: null, bank_detail_status : null,aadhar_front: null, aadhar_back: null, pan_front: null, bc_agent_agreement: null, kyc_status: null, approved_by : null, status : 'active'}
        let usrkycdt = await kycModel.create(userKYCDetailData); // Save token in User Details table on user signup.
        
          if(usrdt && usrkycdt){
            req.session.token = svData.token;
            req.session.mobile = svData.mobile;
            req.session.email = svData.email;
            req.session.userID = svData._id;
            let obj = {userType : svData.user_type, userID: svData._id , token: svData.token, mobile : svData.mobile, fullName: svData.fullname, profileImage: svData.profile_image};
            Storage.set('memberDetails', obj); // set userdata in local storage. 
            req.session.verifyMobileStatus = null;
            // req.session.areaManagerNameMobile = null;
            // res.locals.areaManagerNameMobile = req.session.areaManagerNameMobile;
            res.redirect('/members/profile');
        }
      }
    } catch (error) {
      console.log('Entered in catch error section.'+error.message);
      //res.render('frontend/signup', { title: 'Create User', status: 0,  message: error});
    } 
    
  }

  async savebldgroup (req, res, next){
    var data = req.body;
    try {
        const filter = {user_id: req.session.userID }; 
        const updateuserData = {blood_group : data.blood_group};
        await usersDetailModel.findOneAndUpdate(filter, updateuserData, {new: true});
        res.send(true); 
    } catch (error) {
      console.log('Entered in catch error section.'+error.message);
    } 
  }

  async dashboard (req, res, next){
    try{
      
      const getUserData = await usersModel.findById(req.session.userID);
      const getuserDetailsData = await usersDetailModel.findOne({"user_id": req.session.userID});

      const marqMsg = await marqMsgModel.findOne({status: 'active', type:'moving'});
      const notificationMsg = await marqMsgModel.findOne({status: 'active', type:'notification'});
      var options = { method: 'POST',
      url: 'https://mitrsewa.pos.coverfox.com/sso/request-token/',
      headers:
      {
          authorization: 'Basic Z28yNnVzZ3BzZ3ZybzQxazp6bW9qYzRjNG16dGMxOWlhd2Zic2t2aGtwczV2MXg4OWlrNjZlbXpl',
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' 
      },
      formData: { mobile: req.session.user.mobile } };
      var usrToken = '';
      
      request(options, function (error, response, body) {
        if (error) throw new Error(error);

        
        if(body !== 'Unauthorized'){
          
          usrToken = JSON.parse(body).access_token;
        }else{
          usrToken = 'notRegisteredOnCoverfox';
        }
        
        res.render('frontend/user-dashboard', {'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), getUserData: getUserData, "status": 1, "message": null, title: "Dashboard", "usrToken": usrToken, mobile:req.session.user.mobile, "marqMsg" : marqMsg, "notificationMsg": notificationMsg, "getuserDetailsData": getuserDetailsData, areaManagerNameMobile:req.session.areaManagerNameMobile});
      });
    } catch (error) {
      //console.log('Entered in catch error section.'+error);
      //res.render('frontend/user-dashboard', {'path': '../', "getUserData": getUserData, "status": 1, "message": null, title: "Dashboard"});
    }
  }

  async profile (req, res, next){
    try{
      if(req.session.userID){
        let getUserData = await usersModel.findById(req.session.userID); // req.session.userID elect logedin User record
        let getKYCData = await kycModel.findOne({'user_id' : req.session.userID});
        let getUserDetailsData = await usersDetailModel.findOne({'user_id' : req.session.userID}); 
        
          res.render('frontend/user-profile', {"errors": req.flash('error'),'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), "getUserData": getUserData, "getUserDetailsData": getUserDetailsData, status: 1, "message": null, title: "Profile", getKYCData: getKYCData, areaManagerNameMobile:req.session.areaManagerNameMobile});
      res.end();
      }else{
        req.redirect('/logout');
      }
     
    }catch (error) {
      //console.log('Entered in catch error section.--++--'+error);
      //res.render('frontend/user-profile', {"getUserData": getUserData, "getUserDetailsData": getUserDetailsData, "status": 0, "message": error.message, title: "Profile"});
    }
    
  }

  async profileUpdate (req, res, next){
    try{
      var data = req.body;
      const errors = validationResult(req);
      
      let getUserData = await usersModel.findById(req.session.userID); //  select logedin User record
      if (!errors.isEmpty()) {
          let getUserDetailsData = await usersDetailModel.findOne({'user_id' : req.session.userID}); // req.session.userID Select logedin user details record
         //console.log(errors.mapped());
         let getKYCData = await kycModel.findOne({'user_id' : req.session.userID});


          res.render('frontend/user-profile', {'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), "getUserData": getUserData, "getUserDetailsData": getUserDetailsData, status: 0, "message": errors.mapped() , title: "Profile", 'getKYCData': getKYCData, areaManagerNameMobile:req.session.areaManagerNameMobile});

        }else{
          let dir = "./public/upload/profile_image/"+req.session.mobile;
          // create dynamic folder if not exist.
          let uploadFile = req.files.profile_image;
          var doUploadFile = middleware.fileUploadsFN(req.files, uploadFile, dir);
          
          if(doUploadFile.status == 'success'){
            // get uploaded file name = doUploadFile.message
            const filter = { user_id: req.session.userID }; //req.session.userID
            const updateuserData = {email : data.email, profile_image : 'upload/profile_image/'+req.session.mobile+'/'+doUploadFile.message, fullname : data.f_name+' '+ data.l_name, dob: data.dob};
            const updateuserDetailData = {f_name : data.f_name, m_name : data.m_name, l_name : data.l_name, relative_name: data.relative_name, house_number: data.house_number, street: data.street, village_locality: data.village_locality, post_office: data.post_office, post_office: data.post_office, pin_code: data.pin_code, city : data.city, gender:data.gender, state: data.state};

            var updtdd = await usersModel.findOneAndUpdate({_id: req.session.userID}, updateuserData, {new: true});
            await usersDetailModel.findOneAndUpdate(filter, updateuserDetailData, {new: true});
            res.redirect('/members/kyc-1');

          }else{
            //console.log('comes in upload fail - ' + doUploadFile.message);
            
            req.flash('error', 'Image is not Valid');
            res.redirect('/members/profile');
          }
        }
    }catch (error) {
      console.log('Entered in catch error section.---++-'+error);
      //res.render('frontend/user-profile', {"data": error.message, "status": 0, "message": error.message, title: "Profile"});
    }
  }

  async kyc (req, res, next){
    try{
      let getUserData = await usersModel.findById(req.session.user._id); // select logedin User record
      let getKYCData = await kycModel.findOne({'user_id' : req.session.user._id}); // select logedin User record

     // console.log('id- '+ req.session.userID +'---- '+getKYCData)
      res.render('frontend/kyc', {'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), "data": Storage.get('memberDetails'), getKYCData : getKYCData, status:1, title: 'kyc', 'getUserData':getUserData, areaManagerNameMobile:req.session.areaManagerNameMobile });
    } catch (error) {
      console.log('Entered in catch error section.'+error.message);
    } 
  }

  async bankDetailUpdate (req, res, next){
    var data = req.body;
    let getKYCData = await kycModel.findOne({'user_id' : req.session.userID});
    let getUserData = await usersModel.findById(req.session.userID); //  select logedin User record
    const errors = validationResult(req);
    try {
      if (!errors.isEmpty()) {
          res.render('frontend/kyc', {'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), getKYCData: getKYCData, title: 'User KYC', status: 0, 'getUserData': getUserData, getKYCData : getKYCData, message: errors.mapped() });
      }else{
        const filter = { user_id: req.session.userID };
        const updateBank_details_DetailData = {full_name : data.full_name, bank_name : data.bank_name, branch_name : data.branch_name, ifsc_code: data.ifsc_code, upi_id: data.upi_id, account_number: data.account_number, aadhar_number: data.aadhar_number, pan_number: data.pan_number, bank_detail_status : 'submitted', kyc_status: null, approved_by : null, status : 'active'};

        await kycModel.findOneAndUpdate(filter, updateBank_details_DetailData, {new: true
        });
        res.redirect('/members/kyc-upload');
      }
    } catch (error) {
      console.log('Entered in catch error section.-- '+error.message);
      //res.render('frontend/signup', { title: 'Create User', status: 0,  message: error});
    } 
  }

  async kycDocUplaodView (req, res, next){
    try{
        let getUserData = await usersModel.findById(req.session.user._id);
        let getKYCData = await kycModel.findOne({'user_id' : req.session.user._id});

        res.render('frontend/kyc-upload', {'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), 'getUserData': getUserData, 'getKYCData' : getKYCData, status: 1, title: 'kyc', message: null, areaManagerNameMobile:req.session.areaManagerNameMobile});
      } catch (error) {
        console.log('Entered in catch error section.'+error.message);
      } 
  }

  async kycDocUplaod (req, res, next){
    var data = req.body;
    data["_id"] = req.session.user._id;
    let getUserData = await usersModel.findById(data._id);
    let userDetails = await usersDetailModel.findOne({user_id: data._id});

    // Check if user is not from assam and he uploaded the file or not
    if(userDetails.state != "ASSAM") {
      if(!req.files.aadhar_front && !req.files.aadhar_back) {
        req.flash("message", "Adhar Card Is Mandotary for non Assam Users");
         res.redirect('/members/kyc-upload');
      }
    }

    try{
        let dir = "./public/upload/kyc_image/"+getUserData.mobile;
        var updateKYC_DetailData = {kyc_status: 'submitted', approved_by : null};
        let uploadAadharFile = req.files && req.files.aadhar_front ? req.files.aadhar_front : null;
        var doUploAdaadhar_FrontFile;
        if(uploadAadharFile) {
          var doUploAdaadhar_FrontFile = middleware.fileUploadsFN(req.files, uploadAadharFile, dir);
          if(doUploAdaadhar_FrontFile.status == "success") {
             updateKYC_DetailData["aadhar_front"] = doUploAdaadhar_FrontFile.message;
          }else{ 
            req.flash("message", "Adhar Front image is JPEG, PNG or PDF Fromate allowed");
            res.redirect('/members/kyc-upload');
          }
        }
    
        let uploadAadharBackFile = req.files && req.files.aadhar_back ? req.files.aadhar_back : null;
        var doUploAdaadhar_BackFile;
        if(uploadAadharBackFile) {
          doUploAdaadhar_BackFile = middleware.fileUploadsFN(req.files, uploadAadharBackFile, dir);
          if(doUploAdaadhar_BackFile.status == "success") {
            updateKYC_DetailData["aadhar_back"] = doUploAdaadhar_BackFile.message;
          }else{ 
            req.flash("message", "Adhar Back image is JPEG, PNG or PDF Fromate allowed");
            res.redirect('/members/kyc-upload');
          }
        }
        // if(uploadSignatureFile) {
        //   var doUploadSignature = middleware.fileUploadsFN(req.files, uploadSignatureFile, dir);
        //   if(doUploadSignature.status == "success") {
        //      updateKYC_DetailData["bc_agent_signature"] = doUploadSignature.message;
        //   }
        // }
        let uploadPanFile = req.files && req.files.pan_front ? req.files.pan_front : null;
        var doUplodPan_FrontFile;
        if(uploadPanFile) {
          doUplodPan_FrontFile = middleware.fileUploadsFN(req.files, uploadPanFile, dir);
          if(doUplodPan_FrontFile.status == "success") {
            updateKYC_DetailData["pan_front"] = doUplodPan_FrontFile.message;
          }else{ 
            req.flash("message", "PAN Front image is JPEG, PNG or PDF Fromate allowed");
            res.redirect('/members/kyc-upload');
          }
        }
        
        let uploadBCAgreeFile = req.files && req.files.bc_agent_agreement ? req.files.bc_agent_agreement : null;
        var doUplodBC_Agent_AgreementFile;
        if(uploadBCAgreeFile) {
          doUplodBC_Agent_AgreementFile = middleware.fileUploadsFN(req.files, uploadBCAgreeFile, dir);
          if(doUplodBC_Agent_AgreementFile.status == "success") {
            updateKYC_DetailData["bc_agent_agreement"] = doUplodBC_Agent_AgreementFile.message;
          }else{ 
            req.flash("message", "MS Agent Agreement is JPEG, PNG or PDF Fromate allowed");
            res.redirect('/members/kyc-upload');
          }
        }

        let updtData = await kycModel.findOneAndUpdate({user_id: data._id}, updateKYC_DetailData, {new: true});
    
        if(updtData){
          res.redirect('/members/choose-bank');
        } else{
          console.log('Else section - updtData- '+ updtData);
          res.render('/members/choose-bank');
        }
      }catch (error) {
        console.log('Entered in catch error section.----'+error);
      }
  }

  async chooseBank (req, res, next){
    try {
      const getUserData = await usersModel.findById(req.session.userID);
      const getKYCData = await kycModel.findOne({'user_id' : req.session.userID});

      res.render('frontend/choose-bank', {'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), "data": Storage.get('memberDetails'), status: 1, title: 'kyc', message: null, getUserData: getUserData, getKYCData :   getKYCData, areaManagerNameMobile:req.session.areaManagerNameMobile 
    });
      
    } catch (error) {
      console.log('Entered in catch error section.----'+error);
    }
  }
  

  async makePayment (req, res, next){
    var data = req.body;
    let userID = req.session.user._id;
    let getUserData = await usersModel.findById(req.session.user._id); // req.session.userID elect logedin User record
    
    let getSelectedDeviceData = await chooseDevicesModel.findOne({'user_id' : userID});

    //var totalRegFee = 2000;  // On boarding/secquerty Fee Static placed.
    var totalRegFee = (getUserData.user_type == 'newews') ? 500 : 2000;
    var actualDeviceAmount = {"0" : 2000, "1" : 5000, "2" : 10000, "3" : 20000, "fino_device" : 3300};
    var gst = 18;
    let deviceAmount = 0;

    if(getSelectedDeviceData){
      var deviceType = getSelectedDeviceData.device_id;
      if(deviceType === 'fino_device'){
        var deviceQuantity = getSelectedDeviceData.device_quantity;
        var deviceFee = actualDeviceAmount[deviceType];
        deviceAmount = parseFloat(deviceFee) * parseFloat(deviceQuantity);
        totalRegFee = parseFloat(totalRegFee) + parseFloat(deviceAmount);
      }else{
        var packageNumber = getSelectedDeviceData.device_quantity;
        totalRegFee = actualDeviceAmount[packageNumber];
      }
      
    }
    
      
     
      var spURL = null;
      // Testing
        // var spDomain = 'https://uatsp.sabpaisa.in/SabPaisa/sabPaisaInit'; // test environment / test server
        // var username = 'sdfggdsg_1210';
        // var password = 'ABN_SP1210';
        // var clientCode = 'ABN01';
        // var authKey = 'wRAKcWb8WjGSU8Z2';
        // var authIV = "9oaIkb7SCYunVDYg";
        // const BASE_URL = 'http://localhost:3000';

      // Live
        var spDomain = 'https://securepay.sabpaisa.in/SabPaisa/sabPaisaInit'; // production environment 
        var username = 'bhabesh.jha_3403';
        var password = 'MTSPL_SP3403';
        var clientCode = 'MTSPL';
        var authKey = 'Vbb6cxvsfet3qapq';
        var authIV = "4WjOCGDx71JPBWHC";
        const BASE_URL = 'https://mitrsewa.in';
        var programID = "5666";
      
     
      var txnId = Math.floor(Math.random() * 1000000000);
      var URLsuccess = BASE_URL + '/members/response';
      var URLfailure = BASE_URL + '/members/response';
      var payerFirstName = getUserData.fullname;
      var payerLastName = '.';
      var payerContact = getUserData.mobile;
      var payerEmail = getUserData.email;
      var channelId = 'm';
      var payerAddress = 'na';      

    var gstCost = (parseFloat(totalRegFee) * parseInt(gst)) /100; 
    var totalPayAmount = parseFloat(totalRegFee) + parseFloat(gstCost);  

    var user_id = req.session.user._id;

    var tnxAmt = totalPayAmount;
    

    var udf13 = gstCost;
    var udf12 = deviceAmount;
    var udf11 = totalPayAmount;
    var udf10 = user_id;


  var forChecksumString = utf8.encode(`Add`+payerAddress+`Email`+payerEmail+`amountTypechannelIdcontactNo`+payerContact+`failureURL`+URLfailure+`firstName`+payerFirstName+`grNumberlstName`+payerLastName+`midNameparam1param2param3param4pass`+password+`programIdru`+URLsuccess+`semstudentUintxnId`+txnId+`udf10`+udf10+`udf11`+udf11+`udf12`+udf12+`udf13`+udf13+`udf14udf15udf16udf17udf18udf19udf20udf5udf6udf7udf8udf9usern`+username);
  while (forChecksumString.includes('â')) { // replace + with â
    forChecksumString = forChecksumString.replace('â', "")
  } 
  //console.log("for checksumstring -------" + encodeURI(forChecksumString))
  var checksumString = middleware.underScoreChecksum(authKey, forChecksumString);

  // save the data in DB before send to the server.
  let paymentData = {user_id: user_id, mobile_email: payerContact, server_data: spURL, payment_status: 'Sending', transcation_id: txnId, request_type: 'SendReqData'}
  let svPaymentData = await paymentDataModel.create(paymentData); 

  //if(payerFirstName == undefined) {
    
  // }
  payerFirstName = "" + payerFirstName;
  spURL = Buffer.concat([
    Buffer.from("?clientName="),
    Buffer.from(clientCode.toString()),
    Buffer.from("&prodCode=&usern="),
    Buffer.from(username.toString()),
    Buffer.from("​&pass="),
    Buffer.from(password.toString()),
    Buffer.from("&amt=​"),
    Buffer.from(tnxAmt.toString()),
    Buffer.from("​&txnId="),
    Buffer.from(txnId.toString()),
    Buffer.from("​&firstName="),
    Buffer.from(payerFirstName.toString()),
    Buffer.from("​&lstName="),
    Buffer.from(payerLastName.toString()),
    Buffer.from("&contactNo="),
    Buffer.from(payerContact.toString()),
    Buffer.from("​&Email="),
    Buffer.from(payerEmail.toString()),
    Buffer.from("​&Add="),
    Buffer.from(payerAddress.toString()),
    Buffer.from("​&ru="),
    Buffer.from(URLsuccess.toString()),
    Buffer.from("​&failureURL="),
    Buffer.from(URLfailure.toString()),
    // Buffer.from("​&udf14="),
    // Buffer.from(totalRegFee.toString()), 
    Buffer.from("​&udf13="),
    Buffer.from(udf13.toString()),
    Buffer.from("​&udf12="),
    Buffer.from(udf12.toString()),
    Buffer.from("​&udf11="),
    Buffer.from(udf11.toString()),
    Buffer.from("​&udf10="),
    Buffer.from(udf10.toString()),
    Buffer.from("&checkSum="),
    Buffer.from(checksumString.toString()),
  ]);
  
  spURL = Buffer.concat([Buffer.from(spDomain), Buffer.from(spURL)]);
  spURL = encodeURI(spURL);
  //console.log('this is url encoded :::: ' + encodeURI(spURL));
  
  while (spURL.includes('%E2%80%8B')) { // replace %E2%80%8B with ""
    spURL = spURL.replace('%E2%80%8B', "")
  }
  
  while (spURL.includes('%252B')) { // replace %252B with %2B
    spURL = spURL.replace('%252B', "%2B")
  }
  
  while (spURL.includes('+')) { // replace + with %2B
    spURL = spURL.replace('+', "%2B")
  }
  
  res.redirect(spURL);
//    open(spURL);
  //console.log('this is url :::: ' + spURL);
    
  }


  async addTempPackage (req, res, next){
    var data = req.body;
    var actualDeviceAmount = {"1" : 2000, "2" : 5000, "3" : 10000, "4" : 20000}; 
    let dvAmount = actualDeviceAmount[data.device_id];
    let totalAmount = parseFloat(dvAmount) * parseFloat(data.quantity);

    let userID = req.session.userID;
    
    data.user_id = userID;
    data.device_id = data.device_id;
    data.device_quantity = data.quantity;
    data.device_actual_amount = null;
    data.device_total_amount = null;

    const query = { user_id: userID };
    const result = await chooseDevicesModel.deleteMany(query);

    let svData = await chooseDevicesModel.create(data);
    res.send(true);
  }

  async remTempPackage (req, res, next){
    const query = { user_id: req.session.userID };
    const result = await chooseDevicesModel.deleteMany(query);

    res.send(true);
  }

  async response (req, res, next){
    var data = req.url;
    var qrstr = querystring.parse(data);

   let userOtherDetailData = {
     actualAmount: (parseFloat(qrstr.orgTxnAmount) - parseFloat(qrstr.udf13)), 
     user_id : qrstr.udf10,  
     total_amount: qrstr.amount, 
     devivce_amount: qrstr.udf12, 
     gstCost: qrstr.udf13, 
     payment_mode: qrstr.payMode, 
     transcation_id: qrstr.SabPaisaTxId, 
     trans_Status:qrstr.spRespStatus, 
     full_name: qrstr.firstName, 
     trans_date: qrstr.transDate, 
     email: qrstr.email
    };
    var chktransIDExist = await paymentModel.find({"transcation_id": qrstr.SabPaisaTxId}).count();
    if(chktransIDExist == 0){
      if(qrstr.mobileNo){
        userOtherDetailData["mobile"] = qrstr.mobileNo;
      }
      if(qrstr.spRespStatus == "FAILED") {
       let paymentSvData = await failedPaymentModel.create(userOtherDetailData); 
      } else {
       let paymentSvData = await paymentModel.create(userOtherDetailData); 
      }
    }
  
   
   

    let paymentData = {  
      actualAmount: (parseFloat(qrstr.orgTxnAmount) - parseFloat(qrstr.udf13)), 
      user_id: qrstr.udf10, 
      mobile_email: qrstr.mobileNo, 
      server_data: JSON.stringify(qrstr), 
      payment_status: 'Receved', 
      transcation_id: qrstr.SabPaisaTxId, 
      request_type: 'RecevedData'
    }
    let svPaymentData = await paymentDataModel.create(paymentData);
    if(qrstr.spRespStatus === 'SUCCESS'){
      // Update payment status in user table.
      const updateuserData = {payment_status : 'paid'};
      var updtdd = await usersModel.findOneAndUpdate({_id:qrstr.udf10}, updateuserData, {new: true});
      req.session.user = updtdd;
      res.redirect('/members/paymentsuccess?userid='+qrstr.udf10);
    }else{
      res.redirect('/members/paymentfail?userid='+qrstr.udf10);
    }

   
    //console.log(data);
  }

  async paymentSuccess (req, res, next){
    try{
        let getUserData = await usersModel.findById(req.url.split('=')[1]);
        let getKYCData = await kycModel.findOne({'user_id' : req.url.split('=')[1]});
        
        res.render('frontend/payment-success', {'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), 'getUserData': getUserData, 'getKYCData' : getKYCData, status: 1, title: 'kyc', message: null, areaManagerNameMobile:req.session.areaManagerNameMobile});
      } catch (error) {
        console.log('Entered in catch error section.'+error.message);
      }
  }

  async paymentFails (req, res, next){
    try{
        let getUserData = await usersModel.findById(req.url.split('=')[1]);    
        let getKYCData = await kycModel.findOne({'user_id' : req.url.split('=')[1]});    
        res.render('frontend/payment-fail', {
          'path': '../', 
          "leftMenuType": middleware.checkLeftMenuFN(req, res), 
          'getUserData': getUserData, 
          'getKYCData' : getKYCData, 
          status: 1, 
          title: 'kyc', 
          message: null, areaManagerNameMobile:req.session.areaManagerNameMobile
      });
      } catch (error) {
        console.log('Entered in catch error section.'+error.message);
      }
  }


  async checkValidReferal (req, res, next){
    var data = req.body;
    let referalCode = await usersModel.findOne({'referrer_code' : data.referredcode});
    if(referalCode){
      res.send(true); // given referal code is valid or correct or found
    }else{
      res.send(false); // not matched or found or wrong.. 
    }
  }

  async checkValidMobile (req, res, next){
    var data = req.body;
    //console.log(data.mobile);
    let mobile = await usersModel.findOne({'mobile' : data.mobile});
    if(mobile){
      res.send(true); // given mobile no is valid or correct or found
    }else{
      res.send(false); // not matched or found or wrong.. 
    }
  }

  async checkValidMobileNumber (req, res, next){
    var data = req.body;
    //console.log(data.mobile);
    let mobile = await usersModel.findOne({'mobile' : data.mobile});
    if(mobile){
      res.send('true'); // given mobile no is valid or correct or found
    }else{
      res.send('false'); // not matched or found or wrong.. 
    }
  }

  async downloadNotiFile(req, res, next) {
    const data = req.body;
    const file = "./public/upload/notification/"+data.name;
    res.download(file); // Set disposition and send it.
  }

  async add_amazon_details (req, res, next){
    var data = req.body;
    
    let userID = req.session.userID;
    if(data.amazon_email.length > 0){
      const updatedata = {amazon_email : data.amazon_email, amazon_mobile: data.amazon_mobile};
      let updtData = await usersModel.findOneAndUpdate({_id: userID}, updatedata, {new: true});
      if(updtData){
        res.send(true);
      }
    }else{
      res.send("Email or Mobile is missing.");
    }
      
    
  }

  async add_fino_details (req, res, next){
    var data = req.body;
    
    let userID = req.session.userID;
    if(data.fino_pool_ac.length > 0){
      const updatedata = {fino_pool_ac : data.fino_pool_ac, fino_cif: data.fino_cif};
      let updtData = await usersDetailModel.findOneAndUpdate({user_id: userID}, updatedata, {new: true});
      if(updtData){
        res.send(true);
      }
    }else{
      res.send("Please enter Fino Pool account number.");
    }
      
    
  }

  //  ----------------------   ABHISHIK CODE -----------------

  async msEngagementCertificate(req, res, next) {

    try {
      //console.log(req.session.user._id);
      var userid = req.session.user._id;
      var userDetails = await usersDetailModel.findOne({ 'user_id': userid });
      var userKyc = await kycModel.findOne({ 'user_id': userid });

      /* var useDta = await usersDetailModel.aggregate([
        {
          '$match': {
            'user_id': userid
          }
        }, {
          '$lookup': {
            'from': 'kyc_details', 
            'localField': 'user_id', 
            'foreignField': 'user_id', 
            'as': 'kycData'
          }
        }, {
          '$unwind': {
            'path': '$kycData'
          }
        }, {
          '$project': {
            'f_name': 1, 
            'm_name': 1, 
            'l_name': 1, 
            'post_office': 1, 
            'city': 1, 
            'state': 1, 
            'street': 1, 
            'relative_name': 1, 
            'village_locality': 1, 
            'house_number': 1, 
            'pin_code': 1, 
            'pan': '$kycData.pan_number'
          }
        }
      ]); */


      res.render('certificate/engagement', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), userdetail: userDetails, userkyc: userKyc, status: 1, title: 'kyc', message: null });
    } catch (error) {
      console.log(error);
    }
  }

  

  async generate_engagement_certificate(req, res,next){
    
    try{
      var userid = req.session.user._id;
      var userDetails = await usersDetailModel.findOne({ 'user_id': userid });
      var userKyc = await kycModel.findOne({ 'user_id': userid });

      // res.render('certificate/engagement-certificate-pdf', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), userdetail: userDetails, userkyc: userKyc, status: 1, title: 'kyc', message: null }); /


        ejs.renderFile(path.join(__dirname, '../views/certificate','engagement-certificate-pdf.ejs'), { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), userdetail: userDetails, userkyc: userKyc, status: 1, title: 'kyc', message: null }, (err, data) => {
        if (err) {
              res.send(err);
        } else {
          //console.log("sffsf");
            let options = {
                "height": "11.25in",
                "width": "8.5in",
                "header": {
                    "height": "20mm"
                },
                "footer": {
                    "height": "20mm",
                },
                "base": 'file://'+ path.join(__dirname, `../../public/images/`)
            };
            
            console.log(options);
            var stream = require('stream');
            let filepath = path.join(__dirname, `../../public/downloads/${userid}/engagementletter.pdf`);
            let foderpath = path.join(__dirname, `../../public/downloads/${userid}`);

            if (fs.existsSync(filepath)) {  // File  exist 
              //fs.unlinkSync(filepath);
              //console.log("file exist"); return;
              return res.download(filepath);
            }else{                          // File Not  exist 
                console.log("file not exist"); 

                if(fs.existsSync(foderpath)){  // Folder Exist
                  // Create File and download
                    /* pdf.create(data, options).toStream(function (err, stream) {
                      //console.log(userid); return;
                      stream.pipe(fs.createWriteStream(`./public/downloads/${userid}/engagementletter.pdf`));
                        if(err){
                            console.log(`file making error`); 
                            return;
                        }else{
                          return res.download(path.join(__dirname, `../../public/downloads/${userid}/engagementletter.pdf`));
                        }
                    }); */

                    /* const createPDF = (data, options) => new Promise(((resolve, reject) => {
                      pdf.create(data, options).toBuffer((err, buffer) => {
                          if (err !== null) {reject(err);}
                          else {resolve(buffer);}
                        });
                    })); */
              
                    //const PDF = await createPDF(data, options);


                    pdf.create(data, options).toFile(filepath, function(err, res) {
                      if (err){
                        return console.log(err);
                      }else{
                        return true;
                      }
                    });
                  
                }else{  // Folder Not Exist
                  console.log("folder not Exist"); 
                  fs.mkdir(foderpath,
                      (err) => {  
                        pdf.create(data, options).toFile(filepath, function(err, res) {
                          if (err){
                            return console.log(err);
                          }else{
                            return true;
                          }
                        });
                    });
                }
                
            }
            
        }
    });

    }catch (error) {
      console.log(error);
    }
    
  }
  
  async msEngagementLetter(req, res, next) {
    try{
      var userid = req.session.user._id;
      var userDetails = await usersDetailModel.findOne({ 'user_id': userid });
      var userKyc = await kycModel.findOne({ 'user_id': userid });

      /* console.log("----------------------------------");
      console.log(userDetails); */
      let stateData;
      let amImage;
      if(userDetails.state !=""){

          if(userDetails.state == "UTTAR PRADESH"){
            stateData = "UTTAR PRADESH EAST1";
          }else{
            stateData = userDetails.state;
          }
         amImage = middleware.getAreaManagerImageByState(stateData);
        /* console.log('+++++++++++++++++++++++++++++++++++++++');
        console.log(amImage); */
      }else{
        return res.redirect('/');
      }

      res.render('certificate/bc-engagementletter', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), status: 1, userdetail: userDetails, userkyc: userKyc, usersess: req.session, title: 'kyc', message: null, amImage:amImage });
    
    }catch (error){
      console.log(error);
    }
  }
}


export default new membersController();