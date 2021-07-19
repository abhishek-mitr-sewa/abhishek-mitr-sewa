import usersModel from "../models/users";
import usersDetailModel from "../models/usersDetail";
import kycModel from "../models/kyc";
import marqMsgModel from "../models/marqueMessage"
import Storage from "local-storage";
import fileUpload from 'express-fileupload';
import middleware from '../middleware/helper';
import referralCodeGenerator from 'referral-code-generator';
var fs = require('fs');
var path = require ('path');
const bcrypt = require('bcrypt');
const session = require("express-session");
var request = require("request");
const { check, validationResult } = require('express-validator');
const uuid = require('../../public/uuid-random');


class agentsController {

  async create_ms (req, res, next){
    let getUserData = await usersModel.findById(req.session.userID);
    res.render('agent_bc/create-ms', {status: '2', "getUserData": getUserData, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: 'Create MS', 'path': '../', message:'' });
  }

  async create_ms_post (req, res, next){
    var data = req.body;
    let getUserData = await usersModel.findById(req.session.userID);
    const errors = validationResult(req);
    try {

      var referrer_code = referralCodeGenerator.custom('uppercase', 6, 6, 'MitrMsss');
      
     
      if (!errors.isEmpty()) {
          res.render('agent_bc/create-ms', {'path': '../',  "leftMenuType": middleware.checkLeftMenuFN(req, res), title: 'Create User', status: 0,  message: errors.mapped() });
      }else{
        const salt = await bcrypt.genSalt(10);
        var utyp = (data.user_type == 'ews') ? 'newews' : data.user_type;
        data.password = await bcrypt.hash(data.password, salt);
        data.token = uuid();
        data.email  = data.email;
        data.mobile = data.mobile;
        data.referrer_code = referrer_code;
        data.referl_code = req.session.user.referrer_code;
        data.whatsapp_no = null;
        data.email_status = 'yes';
        data.mobile_status = 'yes';
        data.kyc_status = 'no';
        data.payment_status = 'no';
        data.user_type =  utyp;
        data.status = 'active';
        data.profile_image = '/images/avatars/avatar.svg';
        
        let svData = await usersModel.create(data);
        
        let userOtherDetailData = {user_id : svData._id,  f_name: null, m_name: null, l_name: null, relative_name: null, house_number: null, street:null, village_locality: null, post_office: null, city: null, state: null, pin_code: null, status: 'active'}
        let usrdt = await usersDetailModel.create(userOtherDetailData); // Save userid in User Details table on user signup.
        
        let userKYCDetailData = {user_id : svData._id, full_name : null, bank_name : null, branch_name : null, ifsc_code: null, upi_id: null, account_number: null, aadhar_number: null, pan_number: null, bank_detail_status : null,aadhar_front: null, aadhar_back: null, pan_front: null, bc_agent_agreement: null, kyc_status: null, approved_by : null, status : 'active'}
        let usrkycdt = await kycModel.create(userKYCDetailData); // Save token in User Details table on user signup.
        
          if(usrdt && usrkycdt){
            // success message
            res.render('agent_bc/create-ms', {status: 1, "getUserData": getUserData, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: 'Create MS', 'path': '../', message: "MS is created successfully, Please share the Username and Password for login." });
        }
      }
    } catch (error) {
      console.log('Entered in catch error section.'+error.message);
      //res.render('frontend/signup', { title: 'Create User', status: 0,  message: error});
    } 
    
  }

  async dashboard (req, res, next){
    let getUserData = await usersModel.findById(req.session.userID); // req.session.
    try{
      const marqMsg = await marqMsgModel.findOne({status: 'active', type:'moving'});
      const notificationMsg = await marqMsgModel.findOne({status: 'active', type:'notification'});
      let getuserDetailsData = await usersDetailModel.findOne({"user_id": req.session.userID});
      var options = { method: 'POST',
      url: 'https://mitrsewa.pos.coverfox.com/sso/request-token/',
      headers:
      {
          authorization: 'Basic Z28yNnVzZ3BzZ3ZybzQxazp6bW9qYzRjNG16dGMxOWlhd2Zic2t2aGtwczV2MXg4OWlrNjZlbXpl',
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
          formData: { mobile: req.session.user.mobile } };
          var usrToken = '';
          
          request(options, function (error, response, body) {
            if (error) throw new Error(error);

            if(body !== 'Unauthorized'){
              //console.log(req.session.user.mobile+'----------- '+body);
              usrToken = JSON.parse(body).access_token;
            }else{
              usrToken = 'notRegisteredOnCoverfox';
            }
            //console.log('--------USER  MOBILE --------'+req.session.user.mobile);
            //console.log(body);
            res.render('agent_bc/dashboard', {'path': '../', "getUserData": getUserData, "status": 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Dashboard", mobile:req.session.user.mobile, usrToken:usrToken, "marqMsg": marqMsg, "notificationMsg":notificationMsg, "getuserDetailsData": getuserDetailsData});
          });
     
    } catch (error) {
      console.log('Entered in catch error section.'+error);
      res.render('agent_bc/dashboard', {'path': '../', "getUserData": getUserData, "leftMenuType": middleware.checkLeftMenuFN(req, res),  "status": 1, "message": null, title: "Dashboard"});
    }
  }

  async listMember (req, res, next){
    let getUserData = await usersModel.findById(req.session.user._id); // req.session.userID elect logedin User record "getUserData": getUserData,
    try {
      //console.log(req.session.referrerCode);
      // req.session.referrerCode = "MITRFE685970";
      var getAllUserData = await usersModel.aggregate([
        {
           $lookup: {
              from: "users_details",
              localField: "_id",    // field in the orders collection
              foreignField: "user_id",  // field in the items collection
              as: "userDetails"
           }
        },
        {$match: {"referl_code": req.session.referrerCode, status:'active'}},
        
        {
           $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$userDetails", 0 ] }, "$$ROOT" ] } }
        }
  
        ]);
        
        res.render('agent_bc/list', {"getUserData": getUserData, "leftMenuType": middleware.checkLeftMenuFN(req, res), 'data': getAllUserData, title: 'List', 'path': '../' });
    } catch (error) {
       console.log('Entered in catch error listMember section.'+error);
    }
    
  }

  async updateMemberKYCStatus (req, res, next){
    try {
          var data = req.body;
          const filter = {_id: data._id }; 
          const updateuserData = {kyc_status : 'approved', payment_status : 'paid'}
          const updateKYCData = {bank_detail_status : 'approved', kyc_status : 'approved', approved_by : req.session.userID}
          let updt = await usersModel.findOneAndUpdate(filter, updateuserData, {new: true});
          await kycModel.findOneAndUpdate(filter, updateKYCData, {new: true});
          if(updt){
            res.redirect('/agents/list');
          } 
    } catch (error) {
      console.log('catch error updateMemberKYCStatus section- '+ error);
    }
    
  }

  async profileView (req, res, next){
    try{
      const userRecID = req.params.id;
    let getUserData = await usersModel.findById(userRecID);
    let getKYCData = await kycModel.findOne({'user_id' : userRecID}); // select logedin User record
    let getUserDetailsData = await usersDetailModel.findOne({'user_id' : userRecID}); 
    
      res.render('agent_bc/user-profile', {getKYCData: getKYCData, "getUserData": getUserData, "getUserDetailsData": getUserDetailsData, status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Profile", 'path': '../../'});
    }catch (error) {
      console.log('Entered in catch error section.----'+error);
    }
    
  }

  async profileUpdate (req, res, next){
    try{
      var data = req.body;
     
      const userRecID = req.query.id;
      const errors = validationResult(req);
      
      let getUserData = await usersModel.findById(userRecID); //  select logedin User record
      let getKYCData = await kycModel.findOne({'user_id' : req.session.userID});
      let getUserDetailsData = await usersDetailModel.findOne({'user_id' : userRecID}); // Select logedin user details record
      
      // Find the Referal Code
      const findUserReferredCode = await usersModel.findOne({referrer_code: data.referl_code}).exec();
      if(!findUserReferredCode) {
        req.flash("message", "Please check the referred code.");
        return res.redirect(`/agents/member-edit/${userRecID}`);
      }

      if (!errors.isEmpty()) {
          res.render('agent_bc/user-profile', {'path': '../', "getUserData": getUserData, "getUserDetailsData": getUserDetailsData, status: 0, "message": errors.mapped(), "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Profile", 'getKYCData': getKYCData});
      } else {
          let dir = "./public/upload/profile_image/"+getUserData.mobile;
          // create dynamic folder if not exist.
          let uploadFile = req.files && req.files.profile_image ? req.files.profile_image : null;
          var updateuserData = {
            email : data.email, 
            fullname : data.f_name+' '+ data.l_name, 
            dob: data.dob,
            referl_code: data.referl_code
          };
          if(uploadFile) {
            var doUploadFile = middleware.fileUploadsFN(req.files, uploadFile, dir);
            if(doUploadFile.status == 'success') {
              updateuserData["profile_image"] = 'upload/profile_image/' + getUserData.mobile  + '/' + doUploadFile.message;
            } else {
              let getKYCData = await kycModel.findOne({'user_id' : userRecID}); // select logedin User record
              req.flash("message", doUploadFile.message);
              return res.redirect(`/agents/member-edit/${userRecID}`);
            }
          }
           // get uploaded file name = doUploadFile.message
           const filter = { user_id: userRecID}; 
           const updateuserDetailData = {f_name : data.f_name, m_name : data.m_name, l_name : data.l_name, relative_name: data.relative_name, house_number: data.house_number, street: data.street, village_locality: data.village_locality, post_office: data.post_office, post_office: data.post_office, pin_code: data.pin_code, city : data.city, state: data.state};

           const updateUser = await usersModel.findOneAndUpdate({_id: userRecID}, updateuserData);
           await usersDetailModel.findOneAndUpdate(filter, updateuserDetailData);

           res.redirect('/agents/view-kyc/' + userRecID);
        }
    }catch (error) {
      console.log('Entered in catch error section.---++-'+error);
    }
  }

  async kyc (req, res, next){
    try{
      const userRecID = req.params.id;
      let getUserData = await usersModel.findById(userRecID); // select logedin User record
      let getKYCData = await kycModel.findOne({'user_id' : userRecID}); // select logedin User record
      //console.log('id- '+ userRecID+'---- '+getUserData+'----kyc '+getKYCData);
      res.render('agent_bc/kyc', {'path': '../../', getKYCData : getKYCData, status:1, title: 'kyc', "leftMenuType": middleware.checkLeftMenuFN(req, res), 'getUserData':getUserData });
    } catch (error) {
      console.log('Entered in catch error section.'+error.message);
    } 
  }

  async bankDetailUpdate (req, res, next){
    var data = req.body;
    let getKYCData = await kycModel.findOne({'user_id' : data._id});
    let getUserData = await usersModel.findById(data._id); // req.session.userID elect logedin User record "getUserData": getUserData,
    const errors = validationResult(req);
    try {
      if (!errors.isEmpty()) {
          res.render('agent_bc/kyc', {'path': '../../', getKYCData: getKYCData, title: 'User KYC', status: 0, "getUserData": getUserData, "leftMenuType": middleware.checkLeftMenuFN(req, res), message: errors.mapped() });
      }else{
        const filter = { user_id: data._id };
        const updateBank_details_DetailData = {
          full_name : data.full_name, bank_name : data.bank_name, branch_name : data.branch_name, ifsc_code: data.ifsc_code, upi_id: data.upi_id, account_number: data.account_number, aadhar_number: data.aadhar_number, pan_number: data.pan_number, bank_detail_status : 'submitted', kyc_status: null, approved_by : null, status : 'active'};

        await kycModel.findOneAndUpdate(filter, updateBank_details_DetailData, {new: true
        });
        res.redirect('/agents/kyc-upload/' + data._id);
      }
    } catch (error) {
      console.log('Entered in catch error section.-- '+error.message);
    } 
  }


  async kycDocUplaodView (req, res, next){
    try{
      const userRecID = req.params.id;
        let getUserData = await usersModel.findById(userRecID);
        let getKYCData = await kycModel.findOne({'user_id' : userRecID});

        res.render('agent_bc/kyc-upload', {'path': '../../', 'getUserData': getUserData, 'getKYCData' : getKYCData, status: 1, title: 'kyc', "leftMenuType": middleware.checkLeftMenuFN(req, res), message: null, success: null, error: null});
      } catch (error) {
        console.log('Entered in catch error section.'+error.message);
      } 
  }
  

  // async kycDocUplaod (req, res, next){
  //   var data = req.body;
  //   let getUserData = await usersModel.findById(data._id);
  //   let userDetails = await usersDetailModel.findOne({user_id: data._id});

  //   // Check if user is not from assam and he uploaded the file or not
  //   if(userDetails.state != "ASSAM") {
  //     if(req.files.aadhar_front && req.files.aadhar_back) {
  //       req.flash("message", "Adhar Card Is Mandotary for non Assam Users");
  //       return res.redirect('/members/kyc-upload');
  //     }
  //   }
  //   try{
  //       let dir = "./public/upload/kyc_image/"+getUserData.mobile;
  //       var updateKYC_DetailData = {kyc_status: 'submitted', approved_by : null};
  //       let uploadAadharFile = req.files && req.files.aadhar_front ? req.files.aadhar_front : null;
  //       var doUploAdaadhar_FrontFile;
  //       if(uploadAadharFile) {
  //         var doUploAdaadhar_FrontFile = middleware.fileUploadsFN(req.files, uploadAadharFile, dir);
  //         if(doUploAdaadhar_FrontFile.status == "success") {
  //            updateKYC_DetailData["aadhar_front"] = doUploAdaadhar_FrontFile.message;
  //         }
  //       }
    
  //       // if(uploadSignatureFile) {
  //       //   var doUploadSignature = middleware.fileUploadsFN(req.files, uploadSignatureFile, dir);
  //       //   if(doUploadSignature.status == "success") {
  //       //      updateKYC_DetailData["bc_agent_signature"] = doUploadSignature.message;
  //       //   }
  //       // }
        
  //       let uploadAadharBackFile = req.files && req.files.aadhar_back ? req.files.aadhar_back : null;
  //       var doUploAdaadhar_BackFile;
  //       if(uploadAadharBackFile) {
  //         doUploAdaadhar_BackFile = middleware.fileUploadsFN(req.files, uploadAadharBackFile, dir);
  //         if(doUploAdaadhar_BackFile.status == "success") {
  //           updateKYC_DetailData["aadhar_back"] = doUploAdaadhar_BackFile.message;
  //        }
  //       }

  //       let uploadPanFile = req.files && req.files.pan_front ? req.files.pan_front : null;
  //       var doUplodPan_FrontFile;
  //       if(uploadPanFile) {
  //         doUplodPan_FrontFile = middleware.fileUploadsFN(req.files, uploadPanFile, dir);
  //         if(doUplodPan_FrontFile.status == "success") {
  //           updateKYC_DetailData["pan_front"] = doUplodPan_FrontFile.message;
  //        }
  //       }
      
  //       let uploadBCAgreeFile = req.files && req.files.bc_admin_agreement ? req.files.bc_admin_agreement : null;
  //       var doUplodBC_Agent_AgreementFile;
  //       if(uploadBCAgreeFile) {
  //         doUplodBC_Agent_AgreementFile = middleware.fileUploadsFN(req.files, uploadBCAgreeFile, dir);
  //         if(doUplodBC_Agent_AgreementFile.status == "success") {
  //           //console.log("updated", doUplodBC_Agent_AgreementFile.message);
  //           updateKYC_DetailData["bc_agent_agreement"] = doUplodBC_Agent_AgreementFile.message;
  //        }
  //       }

  //       let updtData = await kycModel.findOneAndUpdate({user_id: data._id}, updateKYC_DetailData, {new: true});
    
  //       if(updtData){
  //         res.redirect('/agents/dashboard');
  //       } else{
  //         //console.log('Else section - updtData- '+ updtData);
  //         res.render('/agents/choose-bank');
  //       }
  //     }catch (error) {
  //       console.log('Entered in catch error section.----'+error);
  //     }
  // }

  async uploadKycnew(req, res, next){
    try{

      var data = req.body;
      let getUserData = await usersModel.findById(data._id);
      //let userDetails = await userDetailsModel.findOne({ user_id: data._id });
      let dir = "./public/upload/kyc_image/" + getUserData.mobile;
      var updateKYC_DetailData = { kyc_status: 'submitted', approved_by: null };
        
        if(req.files){
          if(typeof req.files.aadhar_front != "undefined" ){
            // Uplaod Aadhar front image /
            let uploadAadharFile = req.files && req.files.aadhar_front ? req.files.aadhar_front : null;
            var doUploAdaadhar_FrontFile = middleware.newFileUploadsFN(uploadAadharFile, dir);
            
              if (doUploAdaadhar_FrontFile.status == "success") {
                updateKYC_DetailData["aadhar_front"] = doUploAdaadhar_FrontFile.message;
              }
          }
          if(typeof req.files.aadhar_back != "undefined"){
            let uploadAadharBackFile = req.files && req.files.aadhar_back ? req.files.aadhar_back : null;
            let doUploAdaadhar_BackFile = middleware.newFileUploadsFN(uploadAadharBackFile, dir);
              if (doUploAdaadhar_BackFile.status == "success") {
                updateKYC_DetailData["aadhar_back"] = doUploAdaadhar_BackFile.message;
              }
          }
          if(typeof req.files.pan_front != "undefined"){
            let uploadPanFile = req.files && req.files.pan_front ? req.files.pan_front : null;
            let doUplodPan_FrontFile = middleware.newFileUploadsFN( uploadPanFile, dir);
              if (doUplodPan_FrontFile.status == "success") {
                updateKYC_DetailData["pan_front"] = doUplodPan_FrontFile.message;
              }
            
          }
          if(typeof req.files.bc_admin_agreement != "undefined"){
            let uploadBCAgreeFile = req.files && req.files.bc_admin_agreement ? req.files.bc_admin_agreement : null;
              let doUplodBC_Agent_AgreementFile = middleware.newFileUploadsFN(uploadBCAgreeFile, dir);
              if (doUplodBC_Agent_AgreementFile.status == "success") {
                updateKYC_DetailData["bc_agent_agreement"] = doUplodBC_Agent_AgreementFile.message;
              }
            
          }
        }else{
           req.flash('error', 'No file avaliable for Upload');
           res.redirect(req.header('Referer'));
           return;
        }
        
        let updtData = await kycModel.findOneAndUpdate({ user_id: data._id }, updateKYC_DetailData, { new: true });

        if (updtData) {
          req.flash('success', 'Images Uploaded Successfully');
        } else {
          req.flash('error', 'Some error Occured. Please try again.');
        }
        res.redirect(req.header('Referer'));
        return;

    }catch(error){
      console.log(error);
    }
  }

  async downloadNotiFile(req, res, next) {
    const data = req.body;
    const file = "./public/upload/notification/"+data.name;
    res.download(file); // Set disposition and send it.
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

    // --------------------   ABHISHEK CODE HERE --------------------

    // async feCertificate(req, res, next){
    //   try {
    //     //console.log(req.session.user._id);
    //     var userid = req.session.user._id;
    //     var userDetails = await usersDetailModel.findOne({ 'user_id': userid });
    //     var userKyc = await kycModel.findOne({ 'user_id': userid });
    //     //console.log(userKyc); return;
    //     res.render('agent_bc/fe-certificate', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), userdetail: userDetails,"leftMenuType": middleware.checkLeftMenuFN(req, res), userkyc: userKyc, status: 1, title: 'kyc', message: null });
    //   } catch (error) {
    //     console.log(error);
    //   }
    // }
  
    async feCertificate(req, res, next){
      try {
        //console.log(req.session.user._id);
        var userid = req.session.user._id;
        var userDetails = await usersDetailModel.findOne({ 'user_id': userid });
        var userKyc = await kycModel.findOne({ 'user_id': userid });
        //console.log(userKyc); return;
        res.render('agent_bc/fe-certificate', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), userdetail: userDetails,"leftMenuType": middleware.checkLeftMenuFN(req, res), userkyc: userKyc, status: 1, title: 'kyc', message: null });
      } catch (error) {
        console.log(error);
      }
    }

    async feEngagementLetter(req, res, next) {

      try{
        var userid = req.session.user._id;
        var userDetails = await usersDetailModel.findOne({ 'user_id': userid });
        var userKyc = await kycModel.findOne({ 'user_id': userid });
        var zeData =  await zeModel.findOne({'ze_user_id': userid }).count();
        if(zeData>0){
          res.render('agent_bc/ze-letter', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), userdetail: userDetails,usersess:req.session, "leftMenuType": middleware.checkLeftMenuFN(req, res), userkyc: userKyc, status: 1, title: 'kyc', message: null });
        }else{
          res.render('agent_bc/fe-letter', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), userdetail: userDetails,usersess:req.session, "leftMenuType": middleware.checkLeftMenuFN(req, res), userkyc: userKyc, status: 1, title: 'kyc', message: null });
        }
        
  
      }catch (error){
        console.log(error);
      }
    }
    // async feEngagementLetter(req, res, next) {
  
    //   try{
    //     var userid = req.session.user._id;
    //     var userDetails = await usersDetailModel.findOne({ 'user_id': userid });
    //     var userKyc = await kycModel.findOne({ 'user_id': userid });
    //     var zeData =  await zeModel.findOne({'ze_user_id': userid }).count();
    //     if(zeData>0){
    //       res.render('agent_bc/ze-letter', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), userdetail: userDetails,usersess:req.session, "leftMenuType": middleware.checkLeftMenuFN(req, res), userkyc: userKyc, status: 1, title: 'kyc', message: null });
    //     }else{
    //       res.render('agent_bc/fe-letter', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), userdetail: userDetails,usersess:req.session, "leftMenuType": middleware.checkLeftMenuFN(req, res), userkyc: userKyc, status: 1, title: 'kyc', message: null });
    //     }
        
  
    //   }catch (error){
    //     console.log(error);
    //   }
    // }

}

export default new agentsController();