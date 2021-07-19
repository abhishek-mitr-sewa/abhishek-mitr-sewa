import usersModel from "../models/users";
import userDetailsModel from "../models/usersDetail";
import kycModel from "../models/kyc";
import zeModel from "../models/ze_team";
import generatedPayoutsModel from "../models/generatedPayouts";
import marqMsgModel from "../models/marqueMessage"
import successPaymentModel from "../models/payment";
import payoutUploadModel from "../models/payoutUpload";
import otpModel from "../models/otp"
import referralCodeGenerator from 'referral-code-generator';
import Storage from "local-storage";
import middleware from '../middleware/helper';
import bimaModel from "../models/bimaModel";
import fePayoutModel from "../models/fePayoutUpload";
import userAPIErrorModel from "../models/userAPIError";

//import { request, response } from "express";
var request = require("request");
import flash from "express-flash";
const parser = require('csv-parser');
import csv from "csvtojson";
import failedPayment from '../models/failedPayment';
import { LengthRequired } from "http-errors";
import fs from 'fs';
const paths = require('path');
const bcrypt = require('bcrypt');
const CsvParser = require("json2csv").Parser;

const { check, validationResult, body } = require('express-validator');
const session = require("express-session");



class adminController {

  async index(req, res, next) {
    res.render('index', { 'path': '../', title: 'Create User', status: 1, message: null });
  }

  async login(req, res, next) {
    const data = req.body;
    try {
      if (!data.username || !data.password) {
        res.render('index', { 'path': '../', title: 'Login', status: 0, message: 'Please enter mobile and password' });
      } else {
        var results = await usersModel.findOne({ mobile: data.username, status: 'active' });

        if (results) {
          const getuserDetailsData = await userDetailsModel.findOne({ "user_id": results._id });
          const getPassword = results.password;
          bcrypt.compare(data.password, getPassword, (err, data) => {
            //if error than throw error
            if (err) throw err

            if (data) {
              req.session.errors = null;
              req.session.success = true;
              req.session.token = results.token;
              req.session.email = results.email;
              req.session.mobile = results.mobile;
              req.session.userID = results._id;
              req.session.userType = results.user_type;
              req.session.referrerCode = results.referrer_code;
              req.session.name = results.fullname;
              req.session.user = results;
              res.locals.user = req.session.user;
              let obj = { userID: results._id, userType: results.user_type, token: results.token, mobile: results.mobile, fullName: results.fullname, profileImage: results.profile_image };
              Storage.set('memberDetails', obj); // set userdata in local storage. 

              if (results.user_type.toUpperCase() === 'AM' || results.user_type.toUpperCase() === 'ADMIN' || results.user_type.toUpperCase() === 'COMPANY') {
                return res.redirect('/admin/admin-dashboard');
              } else if (results.user_type.toUpperCase() === 'AGENT') {
                res.redirect('/agents/dashboard');
              } else if (results.user_type.toUpperCase() === 'USER' || results.user_type.toUpperCase() === 'BC' || results.user_type.toUpperCase() === 'EWS' || results.user_type.toUpperCase() === 'NEWEWS') {
                //console.log(results.user_type);

                if (getuserDetailsData.state) {
                  var ff = middleware.checkAreaManagerFN(getuserDetailsData.state);
                  //console.log(ff);
                  req.session.areaManagerNameMobile = middleware.checkAreaManagerFN(getuserDetailsData.state);
                  res.locals.areaManagerNameMobile = req.session.areaManagerNameMobile;
                } else {
                  res.locals.areaManagerNameMobile = null;
                }

                if (results.payment_status == 'paid') {
                  res.redirect('/members/dashboard');
                } else {

                  return res.redirect('/members/profile');
                }
              }
            } else {
              //console.log('invalid input');
              res.render('index', { 'path': '../', title: 'Login', "leftMenuType": middleware.checkLeftMenuFN(req, res), status: 0, message: "Incorrect mobile or password." });
            }
          });
        } else {
          res.render('index', { 'path': '../', title: 'Login', "leftMenuType": middleware.checkLeftMenuFN(req, res), status: 0, message: "You don't have account please create account." });
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  async forgotpass(req, res, next) {
    try {

      res.render('forgot', { 'path': '../', title: 'Create User', status: 1, message: null });

    } catch (error) {
      //console.log('Entered in catch error section.' + error.message);
    }
  }

  async forgotpassword(req, res, next) {
    try {
      const data = req.body;

      const enteredOTP = data.otp;
      var savedOTPData = await otpModel.findOne({mobile_email: data.mobile});
      //let savedOTP = Storage.get('OTP').otp //get the storaged value

       console.log('enteredOTP' + enteredOTP + ' savedOTP ' + savedOTPData.otp);


      if (enteredOTP === savedOTPData.otp) {
        const salt = await bcrypt.genSalt(10);
        let password = await bcrypt.hash(data.password, salt);

        const updateuserData = { password: password };

        var updtdd = await usersModel.findOneAndUpdate({ mobile: data.mobile }, updateuserData, { new: true });

        res.redirect('/login')
      } else {
        res.render('forgot', { 'path': '../', title: 'Create User', status: 0, message: 'OTP does not match!!' });
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  async dashboard(req, res, next) {
    const membersCount = await usersModel.find({ "user_type": { $regex: /user/i } }).count();
    const ewsMemberCount = await usersModel.find({ "user_type": 'ews' }).count();

    const agentsCount = await usersModel.find({ "user_type": 'agent' }).count();

    var bcaCount = await usersModel.find({ "user_type": 'bc' }).count();
    var getAllBCgstCost = parseFloat(bcaCount) * 360;
    var getAllBCPaymentData = parseFloat(bcaCount) * 2000;

    var options = {
      method: 'POST',
      url: 'https://mitrsewa.pos.coverfox.com/sso/request-token/',
      headers:
      {
        authorization: 'Basic Z28yNnVzZ3BzZ3ZybzQxazp6bW9qYzRjNG16dGMxOWlhd2Zic2t2aGtwczV2MXg4OWlrNjZlbXpl',
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
      },
      formData: { mobile: "9369031789" }
    };
    var usrToken = '';

    request(options, function (error, response, body) {
      if (error) throw new Error(error);

      if (body !== 'Unauthorized') {

        usrToken = JSON.parse(body).access_token;
      } else {
        usrToken = 'notRegisteredOnCoverfox';
      }
    });

    var getAllFEPaymentData = await usersModel.aggregate([

      // Join with user_info table
      {
        $lookup: {
          from: "payment_successes",       // other table name
          localField: "_id",   // name of users table field
          foreignField: "user_id", // name of userinfo table field
          as: "payment_info"         // alias for userinfo table
        }
      },
      { $unwind: "$payment_info" },     // $unwind used for getting data in object or for one record only

      // define some conditions here 
      { $match: { status: 'active', user_type: /^agent$/i, payment_status: 'paid' } },
      {
        "$group": {
          "_id": null,
          totalAmount: {
            $sum: {
              $toDouble: "$payment_info.actualAmount"
            }
          }
        }
      }

    ]);

    var getAllFEgstCost = await usersModel.aggregate([

      // Join with user_info table
      {
        $lookup: {
          from: "payment_successes",       // other table name
          localField: "_id",   // name of users table field
          foreignField: "user_id", // name of userinfo table field
          as: "payment_info"         // alias for userinfo table
        }
      },
      { $unwind: "$payment_info" },     // $unwind used for getting data in object or for one record only

      // define some conditions here 
      { $match: { status: 'active', user_type: 'agent', payment_status: 'paid' } },
      {
        "$group": {
          "_id": null,
          totalAmount: {
            $sum: {
              $toDouble: "$payment_info.gstCost"
            }
          }
        }
      }

    ]);

    // Sum of all amount- 
    const totalTransactionAmount = await successPaymentModel.aggregate([
      {
        "$group": {
          "_id": null,
          totalAmount: {
            $sum: {
              $toDouble: "$actualAmount"
            }
          }
        }
      }
    ]);

    const totalGSTAmount = await successPaymentModel.aggregate([
      {
        "$group": {
          "_id": null,
          totalAmount: {
            $sum: {
              $toDouble: "$gstCost"
            }
          }
        }
      }
    ]);


    //console.log(getAllBCData);
    // return;
    res.render('admin/admin-dashboard', {
      'path': '../',
      "leftMenuType": middleware.checkLeftMenuFN(req, res),
      "title": 'Dashboard',
      'membersCount': membersCount,
      'agentsCount': agentsCount,
      'bcaCount': bcaCount,
      'ewsMemberCount': ewsMemberCount,
      'getAllFEgstCost': getAllFEgstCost,
      'getAllBCgstCost': getAllBCgstCost,
      'getAllFEPaymentData': getAllFEPaymentData,
      'getAllBCPaymentData': getAllBCPaymentData,
      'totalTransactionAmount': totalTransactionAmount,
      'totalGSTAmount': totalGSTAmount,
      "usrToken": usrToken,
      'usrType': req.session.userType
    });
  }

  async create(req, res, next) {
    res.render('admin/create-admin', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), title: 'Create Admin', usrType: req.session.userType });
  }

  async listMember(req, res, next) {
    //let mobile = req.session.mobile;
    // -------  For list data ----------
    var getAllUserData = await usersModel.aggregate([
      {
        $lookup: {
          from: "users_details",
          localField: "_id",    // field in the orders collection
          foreignField: "user_id",  // field in the items collection
          as: "userDetails"
        }
      },
      // { $unwind: "$userDetails" },
      {
        $match: {
          $or: [
            { user_type: /^user$/i, },
            { user_type: /^newews$/i, }
          ],
          status: 'active',
          mobile: { // this is for not equals to.
            $nin: [req.session.mobile],
          }
        }
      },

      {
        $lookup: {
          from: "payment_successes",
          localField: "_id",    // field in the orders collection
          foreignField: "user_id",  // field in the items collection
          as: "userPaymentDetails"
        }
      },
      // { $unwind: "$userPaymentDetails" },
      { $sort: { payment_status: -1 } },

      {
        $project: {
          _id: 1,
          mobile: 1,
          payment_status: 1,
          fullname: 1,
          user_type: 1,
          f_name: "$userDetails.f_name",
          m_name: "$userDetails.m_name",
          l_name: "$userDetails.l_name",
          city: "$userDetails.city",
          trans_date: "$userPaymentDetails.created_at",
          total_amount: "$userPaymentDetails.total_amount"

        }
      }

    ]);
    // console.log(getAllUserData);
    // return;

    res.render('admin/list', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), 'data': getAllUserData, title: 'List', usrType: req.session.userType });
  }

  async listBC(req, res, next) {
    try {
      var getAllUserData = await usersModel.aggregate([
        {
          $lookup: {
            from: "users_details",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userDetails"
          }
        },
        { $match: { status: 'active', user_type: /^bc$/i } },
        {
          $lookup: {
            from: "payment_successes",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userPaymentDetails"
          }
        },

        { $sort: { payment_status: -1 } },

        {
          $project: {
            _id: 1,
            mobile: 1,
            payment_status: 1,
            fullname: 1,
            user_type: 1,
            f_name: "$userDetails.f_name",
            m_name: "$userDetails.m_name",
            l_name: "$userDetails.l_name",
            city: "$userDetails.city",
            trans_date: "$userPaymentDetails.created_at"

          }
        }
      ]);

      res.render('admin/list-bc', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(), 'data': getAllUserData, title: 'List', usrType: req.session.userType });
    } catch (error) {

    }



  }

  async listews(req, res, next) {
    try {
      var getAllUserData = await usersModel.aggregate([
        {
          $lookup: {
            from: "users_details",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userDetails"
          }
        },
        { $match: { status: 'active', payment_status: 'paid', user_type: /^ews$/i } },
        {
          $lookup: {
            from: "payment_successes",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userPaymentDetails"
          }
        },
        { $sort: { payment_status: -1 } },

        {
          $project: {
            _id: 1,
            mobile: 1,
            payment_status: 1,
            fullname: 1,
            user_type: 1,
            f_name: "$userDetails.f_name",
            m_name: "$userDetails.m_name",
            l_name: "$userDetails.l_name",
            city: "$userDetails.city",
            trans_date: "$userPaymentDetails.trans_date"

          }
        }
      ]);

      res.render('admin/list-ews', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(), 'data': getAllUserData, title: 'List EWS', usrType: req.session.userType });
    } catch (error) {

    }



  }

  async listAgent(req, res, next) {

    var getAllUserData = await usersModel.aggregate([
      {
        $lookup: {
          from: "users_details",
          localField: "_id",    // field in the orders collection
          foreignField: "user_id",  // field in the items collection
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      { $match: { status: 'active', user_type: /^agent$/i } },
      {
        $lookup: {
          from: "payment_successes",
          localField: "_id",    // field in the orders collection
          foreignField: "user_id",  // field in the items collection
          as: "userPaymentDetails"
        }
      },
      { $unwind: "$userPaymentDetails" },
      { $sort: { 'userPaymentDetails.created_at': -1, 'userPaymentDetails._id': -1 } },

      {
        $project: {
          _id: 1,
          fullname: 1,
          mobile: 1,
          payment_status: 1,
          referl_code: 1,
          referrer_code: 1,
          user_type: 1,
          f_name: "$userDetails.f_name",
          m_name: "$userDetails.m_name",
          l_name: "$userDetails.l_name",
          city: "$userDetails.city",
          trans_date: "$userPaymentDetails.trans_date"
        }
      }

    ]);

    //console.log(getAllUserData);
    // return;
    res.render('admin/list-agent', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), 'data': getAllUserData, title: 'List', usrType: req.session.userType });
  }

  async memberTypeUpdate(req, res, next) {
    try {
      var data = req.body;
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        var getAllUserData = await usersModel.aggregate([
          {
            $lookup: {
              from: "users_details",
              localField: "_id",    // field in the orders collection
              foreignField: "user_id",  // field in the items collection
              as: "userDetails"
            }
          },
          { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$userDetails", 0] }, "$$ROOT"] } } },
          { $sort: { created_at: -1 } }, { $project: { userDetails: 0 } }
        ]);
        res.render('admin/list', { 'path': '../', 'data': getAllUserData, title: 'List', "message": errors.mapped(), usrType: req.session.userType });
      } else {
        const filter = { _id: data._id };
        var updateuserData;
        if (data.member_type == "agent") {
          var referrer_code = referralCodeGenerator.custom('uppercase', 6, 6, 'MitrFeeee');
          // Check if same referrer code doesn't exist

          updateuserData = { user_type: data.member_type, referrer_code: referrer_code };
        } else {
          updateuserData = { user_type: data.member_type }
        }
        let getKYCData = await kycModel.findOne({ 'user_id': data._id });
        let usersDetail = await userDetailsModel.findOne({ 'user_id': data._id });
        let getUserData = await usersModel.findById(data._id);
        var fullname = (usersDetail.f_name + ' ' + usersDetail.m_name + ' ' + usersDetail.l_name).replace(/[^a-zA-Z ]/g, "");

        //console.log(fullname);
        let updt = await usersModel.findOneAndUpdate(filter, updateuserData, { new: true });

        //console.log(updt);
        if (updt) {
          // try {

          //   var coverFoxOptions = {
          //     method: 'POST',
          //     url: 'https://mitrsewa.pos.coverfox.com/partners/register-partner-pos/',
          //     headers:
          //     {
          //       authorization: 'Basic Z28yNnVzZ3BzZ3ZybzQxazp6bW9qYzRjNG16dGMxOWlhd2Zic2t2aGtwczV2MXg4OWlrNjZlbXpl',
          //       'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
          //     },
          //     formData: {
          //       "mobile": getUserData.mobile,
          //       "email": getUserData.email,
          //       "pincode": usersDetail.pin_code,
          //       "name": fullname,
          //       "aadhar": getKYCData.aadhar_number,
          //       "gender": usersDetail.gender,
          //       "pan": getKYCData.pan_number,
          //       "parent": "CF/POS/242342"
          //     }
          //   };


          //   request(coverFoxOptions, function (error, response, body) {
          //     if (error) throw new Error(error);
          //     //console.log(error);

          //     //console.log(body);

          //   });
          // } catch (error) {
          //   console.log('coverFoxOptions error second--- '+error);
          // }

          try {
            var MitrBimaOptions = {
              method: 'POST',
              url: 'https://www.mitrbima.com/api/policyagent',
              headers:
              {
                authorization: 'Basic bWl0cmJpbWE6bWl0cnNld2FAbWl0cmJpbWE=',
                'content-type': 'type:application/json'
              },
              formData: {
                name: fullname,
                mobile_number: getUserData.mobile,
                state: usersDetail.state
              }

            };

            request(MitrBimaOptions, function (error, response, body) {
              if (error) throw new Error(error);

              if (JSON.parse(body).status) {
                // console.log('MitrBimaOptions');
                // console.log(body);
                //console.log('ready for redirect...');
                res.redirect('/admin/list');
              }
            });
          } catch (error) {
            //console.log('MitrBimaOptions error second--- '+error);
          }

        }
      }
    } catch (error) {
      //console.log(error.message);
    }
  }

  async memberDelete(req, res, next) {
    try {
      var data = req.body;
      if (data.conf_val.toUpperCase() != "DELETE") {
        req.flash("message", "User deletion failed. Try again later.");
        return res.redirect('back');
      }
      const errors = validationResult(req);
      var getAllUserData = await usersModel.aggregate([
        {
          $lookup: {
            from: "users_details",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userDetails"
          }
        },
        { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$userDetails", 0] }, "$$ROOT"] } } },
        { $sort: { created_at: -1 } }, { $project: { userDetails: 0 } }
      ]);

      if (!errors.isEmpty()) {
        res.render('admin/list', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), 'data': getAllUserData, title: 'List', "message": errors.mapped(), usrType: req.session.userType });
      } else {
        const updt = await usersModel.findOneAndUpdate({ _id: data._id }, { status: 'deleted' });
        await userDetailsModel.findOneAndUpdate({ user_id: data._id }, { status: 'deleted' });
        await kycModel.findOneAndUpdate({ user_id: data._id }, { status: 'deleted' });

        if (updt.user_type.toUpperCase() == "AGENT") {
          req.flash("message", "Agent deletion successfully.");
          res.redirect('/admin/listAgent');
        } else {
          req.flash("message", "User deletion successfully.");
          res.redirect('/admin/list');
        }
      }
    } catch (error) {
      //console.log(error);
    }
  }

  async showAdminProfile(request, resonse, next) {
    const admin = await usersModel.findOne({ token: request.session.token }).exec();
    resonse.render('admin/admin-user-profile', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(request, response), title: 'List', admin: admin, usrType: req.session.userType });
  }

  async postAdminProfile(request, response, next) {

    var update = {
      fullname: request.body.f_name
    };

    if (request.body.password) {
      if ("".request.body.password.length < 6) {
        request.flash('message', "Password Should be more than 6 or 6 charcters.");
      } else {
        if (request.body.password == request.body.confirmpassword) {
          const salt = await bcrypt.genSalt(10);
          let password = await bcrypt.hash(request.body.password, salt);
          update["password"] = password;
        } else {
          request.flash('message', "Password and confirm password doesn't match.");
          response.redirect("/admin/update-admin-profile");
        }
      }
    }

    if (request.files && request.files.image) {
      let dir = "./public/upload/profile_image/" + request.session.mobile;
      // create dynamic folder if not exist.
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      let uploadFile = request.files.image;
      var doUploadFile = middleware.fileUploadsFN(request.files, uploadFile, dir);

      if (doUploadFile.status == 'success') {
        // get uploaded file name = doUploadFile.message
        const filter = { user_id: request.session.userID }; //req.session.userID
        update["profile_image"] = 'upload/profile_image/' + request.session.mobile + '/' + doUploadFile.message;
      }
    }
    const uodate = await usersModel.updateOne({ token: request.session.token }, update);
    if (!uodate) {
      request.flash("message", "Something went wrong. Try again later");
    } else {
      request.flash("message_r", "User updated successfully.");
    }
    const updatedUser = await usersModel.findOne({ token: request.session.token });
    request.session.user = updatedUser;
    response.redirect("/admin/update-admin-profile");
  }

  async successPayment(req, res, next) {
    const payments = await successPaymentModel.find({}).exec();
    res.render("admin/payment", { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), title: 'Success Payments', payments: payments, usrType: req.session.userType });
  }

  async failedPayments(req, res, next) {
    const payments = await failedPayment.find({}).exec();
    res.render("admin/payment", { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), title: 'Failed Payments', payments: payments, usrType: req.session.userType });
  }

  async createPayment(req, res, next) {
    const users = await usersModel.find({ user_type: "USER" }).exec();
    res.render("admin/add-payment", { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), title: 'Create Payment', users: users, usrType: req.session.userType });
  }

  async postCreatePayment(req, res, next) {
    const data = req.body;
    const user = await usersModel.findOne({ mobile: data.mobile }).exec();
    if (!user) {
      req.flash("error", "Please check the mobile number you enterd");
      return res.redirect("/admin/create-payment");
    } else {
      if (user.payment_status.toUpperCase() != "PAID") {
        await successPaymentModel.create({
          user_id: user._id,
          transcation_id: data.transcation_id,
          total_amount: data.total_amount,
          devivce_amount: data.devivce_amount,
          gstCost: data.gstCost,
          trans_Status: "SUCCESS",
          payment_mode: data.payment_mode,
          full_name: data.full_name,
          trans_date: data.trans_date + " " + data.trans_time,
          email: user.email,
          mobile: user.mobile,
          doneByAdmin: true,
          actualAmount: data.actualAmount
        });
        // Update the user has paid
        await usersModel.findOneAndUpdate({ mobile: data.mobile }, { payment_status: "paid" });
        req.flash("message", "Payment created successfully");
        return res.redirect("/admin/success-payment");
      } else {
        req.flash("error", "This user has already paid the amount.");
        return res.redirect("/admin/create-payment");
      }

    }


  }

  async kyc(req, res, next) {
    try {
      const userRecID = req.params.id;
      let getUserData = await usersModel.findById(userRecID); // select logedin User record
      let getKYCData = await kycModel.findOne({ 'user_id': userRecID }); // select logedin User record
      //console.log('id- '+ userRecID+'---- '+getUserData+'----kyc '+getKYCData);
      res.render('admin/kyc', { 'path': '../../', getKYCData: getKYCData, status: 1, title: 'kyc', "leftMenuType": middleware.checkLeftMenuFN(req, res), 'getUserData': getUserData, usrType: req.session.userType });
    } catch (error) {
      //console.log('Entered in catch error section.' + error.message);
    }
  }

  async bankDetailUpdate(req, res, next) {
    var data = req.body;
    let getKYCData = await kycModel.findOne({ 'user_id': data._id });
    let getUserData = await usersModel.findById(req.session.userID); // req.session.userID elect logedin User record "getUserData": getUserData,
    const errors = validationResult(req);
    try {
      if (!errors.isEmpty()) {
        res.render('admin/kyc', { 'path': '../../', getKYCData: getKYCData, title: 'User KYC', status: 0, "getUserData": getUserData, "leftMenuType": middleware.checkLeftMenuFN(req, res), message: errors.mapped(), usrType: req.session.userType });
      } else {
        const filter = { user_id: data._id };
        const updateBank_details_DetailData = { full_name: data.full_name, bank_name: data.bank_name, branch_name: data.branch_name, ifsc_code: data.ifsc_code, upi_id: data.upi_id, account_number: data.account_number, aadhar_number: data.aadhar_number, pan_number: data.pan_number, bank_detail_status: 'submitted', kyc_status: null, approved_by: null, status: 'active' };

        await kycModel.findOneAndUpdate(filter, updateBank_details_DetailData, {
          new: true
        });
        res.redirect('/admin/kyc-upload/' + data._id);
      }
    } catch (error) {
      //console.log('Entered in catch error section.-- ' + error.message);
    }
  }

  async kycDocUplaodView(req, res, next) {
    try {
      const userRecID = req.params.id;
      let getUserData = await usersModel.findById(userRecID);
      let getKYCData = await kycModel.findOne({ 'user_id': userRecID });

      res.render('admin/kyc-upload', { 'path': '../../', 'getUserData': getUserData, 'getKYCData': getKYCData, status: 1, title: 'kyc', "leftMenuType": middleware.checkLeftMenuFN(req, res), message: null, usrType: req.session.userType, error:req.flash('error'), success:req.flash('success') });
    } catch (error) {
      //console.log('Entered in catch error section.' + error.message);
    }
  }

  // async kycDocUplaod(req, res, next) {
  //   try {
      
  //   var data = req.body;
  //   let getUserData = await usersModel.findById(data._id);
  //   let userDetails = await userDetailsModel.findOne({ user_id: data._id });
  //   // Check if user is not from assam and he uploaded the file or not
  //   if (userDetails.state != "ASSAM") {
  //     if (req.files.aadhar_front && req.files.aadhar_back) {
  //       req.flash("message", "Adhar Card Is Mandotary for non Assam Users");
  //       return res.redirect('/members/kyc-upload');
  //     }
  //   }
  //   try {
  //     let dir = "./public/upload/kyc_image/" + getUserData.mobile;
  //     var updateKYC_DetailData = { kyc_status: 'submitted', approved_by: null };
  //     let uploadAadharFile = (req.files && req.files.aadhar_front) ? req.files.aadhar_front : null;
  //     var doUploAdaadhar_FrontFile;
  //     try {
  //       if (uploadAadharFile) {
  //         var doUploAdaadhar_FrontFile = middleware.fileUploadsFN(req.files, uploadAadharFile, dir);
  //         if (doUploAdaadhar_FrontFile.status == "success") {
  //           updateKYC_DetailData["aadhar_front"] = doUploAdaadhar_FrontFile.message;
  //         }else{
  //           console.log(doUploAdaadhar_BackFile.status);
  //         }
  //       }
  //     } catch (error) {
  //       console.log(error.message);
  //     }

      
  //     return;
  //     let uploadAadharBackFile = req.files && req.files.aadhar_back ? req.files.aadhar_back : null;
  //     var doUploAdaadhar_BackFile;
  //     if (uploadAadharBackFile) {
  //       doUploAdaadhar_BackFile = middleware.fileUploadsFN(req.files, uploadAadharBackFile, dir);
  //       if (doUploAdaadhar_BackFile.status == "success") {
  //         updateKYC_DetailData["aadhar_back"] = doUploAdaadhar_BackFile.message;
  //       }else{
  //         console.log(doUploAdaadhar_BackFile.status);
  //       }
  //     }
  //     // if(uploadSignatureFile) {
  //     //   var doUploadSignature = middleware.fileUploadsFN(req.files, uploadSignatureFile, dir);
  //     //   if(doUploadSignature.status == "success") {
  //     //      updateKYC_DetailData["bc_agent_signature"] = doUploadSignature.message;
  //     //   }
  //     // }
  //     let uploadPanFile = req.files && req.files.pan_front ? req.files.pan_front : null;
  //     var doUplodPan_FrontFile;
  //     if (uploadPanFile) {
  //       doUplodPan_FrontFile = middleware.fileUploadsFN(req.files, uploadPanFile, dir);
  //       if (doUplodPan_FrontFile.status == "success") {
  //         updateKYC_DetailData["pan_front"] = doUplodPan_FrontFile.message;
  //       }else{
  //         console.log(doUplodPan_FrontFile.status);
  //       }
  //     }
  //     //console.log("mydatabase", req.files.bc_admin_agreement);
  //     let uploadBCAgreeFile = req.files && req.files.bc_admin_agreement ? req.files.bc_admin_agreement : null;
  //     var doUplodBC_Agent_AgreementFile;
  //     if (uploadBCAgreeFile) {
  //       doUplodBC_Agent_AgreementFile = middleware.fileUploadsFN(req.files, uploadBCAgreeFile, dir);
  //       if (doUplodBC_Agent_AgreementFile.status == "success") {
  //         updateKYC_DetailData["bc_agent_agreement"] = doUplodBC_Agent_AgreementFile.message;
  //       }else{
  //         console.log(doUplodBC_Agent_AgreementFile.status);
  //       }
  //     }

  //     let updtData = await kycModel.findOneAndUpdate({ user_id: data._id }, updateKYC_DetailData, { new: true });

  //     if (updtData) {
  //       //res.redirect('/admin/admin-dashboard');
  //     } else {
  //       console.log('Else section - updtData- '+ updtData);
  //       //res.render('/admin/choose-bank');
  //     }
  //   } catch (error) {
  //     console.log('Entered in catch error section.----' + error);
  //   }
  // } catch (error) {
  //   console.log('Entered in catch error section.--++++++--' + error);
  // }
  // }

  async uploadKycnew(req, res, next){
    try{

      var data = req.body;
      let getUserData = await usersModel.findById(data._id);
      
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
  async profileView(req, res, next) {
    try {
      const userRecID = req.params.id;
      let getUserData = await usersModel.findById(userRecID);
      let getKYCData = await kycModel.findOne({ 'user_id': userRecID }); // select logedin User record
      let getUserDetailsData = await userDetailsModel.findOne({ 'user_id': userRecID });

      res.render('admin/user-profile', { getKYCData: getKYCData, "getUserData": getUserData, "getUserDetailsData": getUserDetailsData, status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Profile", 'path': '../../', usrType: req.session.userType, errors: null });
    } catch (error) {
      //console.log('Entered in catch error section.----' + error);
    }

  }

  async updateMemberKYCStatus(req, res, next) {
    try {
      var data = req.body;
      const filter = { _id: data._id };
      const updateuserData = { kyc_status: 'approved', payment_status: 'paid' }
      const updateKYCData = { bank_detail_status: 'approved', kyc_status: 'approved', approved_by: req.session.userID }
      let updt = await usersModel.findOneAndUpdate(filter, updateuserData, { new: true });
      await kycModel.findOneAndUpdate(filter, updateKYCData, { new: true });
      if (updt) {
        res.redirect('/admin/list');
      }
    } catch (error) {
      //console.log('catch error updateMemberKYCStatus section- ' + error);
    }

  }

  async profileUpdate(req, res, next) {
    try {
      var data = req.body;

      const userRecID = req.query.id;
      const errors = validationResult(req);
      let getUserData = await usersModel.findById(userRecID); //  select logedin User record
      let getKYCData = await kycModel.findOne({ 'user_id': req.session.userID });
      let getUserDetailsData = await userDetailsModel.findOne({ 'user_id': userRecID }); // Select logedin user details record

      // Find the Referal Code
      const findUserReferredCode = await usersModel.findOne({ referrer_code: data.referl_code }).exec();
      if (!findUserReferredCode) {
        req.flash("message", "Please check the referred code.");
        return res.redirect(`/admin/member-edit/${userRecID}`);
      }


      if (!errors.isEmpty()) {
        res.render('admin/user-profile', {
          'path': '../',
          "getUserData": getUserData,
          "getUserDetailsData": getUserDetailsData,
          status: 0, "message": errors.mapped(),
          "leftMenuType": middleware.checkLeftMenuFN(req, res),
          title: "Profile", 'getKYCData': getKYCData
        });

      } else {
        let dir = "./public/upload/profile_image/" + getUserData.mobile;
        // create dynamic folder if not exist.
        let uploadFile = req.files && req.files.profile_image ? req.files.profile_image : null;
        var updateuserData = {
          email: data.email,
          fullname: data.f_name + ' ' + data.l_name,
          dob: data.dob,
          referl_code: data.referl_code
        };
        if (uploadFile) {
          var doUploadFile = middleware.fileUploadsFN(req.files, uploadFile, dir);
          if (doUploadFile.status == 'success') {
            updateuserData["profile_image"] = 'upload/profile_image/' + getUserData.mobile + '/' + doUploadFile.message;
          } else {
            let getKYCData = await kycModel.findOne({ 'user_id': userRecID }); // select logedin User record
            req.flash("message", doUploadFile.message);
            return res.redirect(`/admin/member-edit/${userRecID}`);
            // res.render('admin/user-profile', {'path': '../',getKYCData: getKYCData, "getUserData": getUserData, "getUserDetailsData": getUserDetailsData, status: 0, "message": doUploadFile , "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Profile"});
          }
        }
        // get uploaded file name = doUploadFile.message
        const filter = { user_id: userRecID };
        const updateuserDetailData = {
          f_name: data.f_name,
          m_name: data.m_name,
          l_name: data.l_name,
          relative_name: data.relative_name,
          house_number: data.house_number,
          street: data.street,
          village_locality: data.village_locality,
          post_office: data.post_office,
          post_office: data.post_office,
          pin_code: data.pin_code,
          city: data.city,
          state: data.state,

        };

        const updateUser = await usersModel.findOneAndUpdate({ _id: userRecID }, updateuserData);
        await userDetailsModel.findOneAndUpdate(filter, updateuserDetailData);

        res.redirect('/admin/view-kyc/' + userRecID);
      }
    } catch (error) {
      //console.log('Entered in catch error section.---++-' + error);
    }
  }

  async accountingreport(req, res, next) {
    //console.log(todayTransaction);
    res.render('admin/accounting-report', {
      'path': '../',
      "leftMenuType": middleware.checkLeftMenuFN(req, res),
      "title": 'Accounting Report',
      'usrType': req.session.userType
    });
  }

  async marketingreport(req, res, next) {
    //console.log(todayTransaction);
    res.render('admin/marketing-report', {
      'path': '../',
      "leftMenuType": middleware.checkLeftMenuFN(req, res),
      "title": 'Marketing Report',
      'usrType': req.session.userType
    });
  }

  async chooseze(req, res, next) {
    try {
      var getAllUserData = await usersModel.aggregate([
        {
          $lookup: {
            from: "ze_teams",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "ze_info"         // alias for userinfo table
          }
        },
        // {$unwind:"$ze_info"},
        { $sort: { fullname: 1 } },
        { '$match': { status: 'active', user_type: 'agent', 'ze_info': { '$size': 0 } } },
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },
        {
          $project: {
            _id: 1,
            fullname: 1,
            mobile: 1,
            referrer_code: 1,
            city: "$user_info.city",
            state: "$user_info.state"
          }
        }

      ]);

      res.render('admin/choose-ze', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), 'data': getAllUserData, title: 'Add ZE', usrType: req.session.userType });
    } catch (error) {
      //console.log(error);
    }
  }

  async selectFEByLocation(req, res, next) {
    try {
      var data = req.body;

      // let userDetails = await userDetailsModel.findOne({user_id: data.id});
      // var zeCity = userDetails.city;
      // var zeState = userDetails.state;

      var getAllUserData = await usersModel.aggregate([
        {
          $lookup: {
            from: "ze_teams",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "ze_info"         // alias for userinfo table
          }
        },
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },
        { $unwind: "$user_info" },     // $unwind used for getting data in object or for one record only
        { $match: { status: 'active', user_type: /^agent$/i, 'ze_info': { '$size': 0 } } },
        {
          $project: {
            _id: 1,
            fullname: 1,
            mobile: 1,
            referrer_code: 1,
            city: "$user_info.city",
            state: "$user_info.state"
          }
        },
        // {$match : { city: new RegExp('^' +zeCity + '$', 'i')}}, // like query working here
        //{$match : { state: zeState}},
        { $sort: { fullName: 1 } },
      ]);
      var htmlData = '';
      getAllUserData.forEach((obj) => {
        if (obj._id != data.id) {
          htmlData += '<div class="feSearch"><li class="list-group-item d-flex row px-0"><div class="col-lg-8 col-md-8 col-sm-8 col-6"><h6 class="go-stats__label mb-1">' + obj.fullname + '</h6><div class="go-stats__meta"><span class="mr-2">Mobile: <label class="text-light">' + obj.mobile + '</label></span><span class="d-block d-sm-inline">FE Code: <strong class="text-success">' + obj.referrer_code + '</strong></span><br><span class="mr-2">City: <label class="text-light">' + obj.city + '</label> </span><span class="mr-2">State: <label class="text-light">' + obj.state + '</label> </span></div></div><div class="col-lg-4 col-md-4 col-sm-4 col-6 d-flex"><div class="btn-group d-table ml-auto" role="group" aria-label="Basic example"><button type="button" class="btn btn-sm btn btn-sm ml-auto btn-white add_fe_btn" accesskey="' + obj._id + '"  style="margin-top: 25px;">Add</button></div></div></li></div>';
        }
      });
      res.send(htmlData);
    } catch (error) {
      //console.log('Entered in catch error section.' + error.message);
    }
  }

  async saveselectedfe(req, res, next) {
    try {
      var data = req.body;
      // console.log(data); 

      var k = 0;
      var insrtData = [];
      var usrtyps = '';
      var zeID = '';
      var ze_referrer_code = referralCodeGenerator.custom('uppercase', 6, 6, 'MitrZEss');
      data.forEach((obj) => {
        if (k == 0) { // because in coming array 1st record is the ze choosen ID
          zeID = obj;
          usrtyps = 'ze';
        } else {
          usrtyps = 'agent';
        }
        insrtData[k] = { user_id: obj, ze_referrer_code: ze_referrer_code, ze_user_id: zeID, type: usrtyps, status: 'active' };
        k++;
      });
      //console.log(insrtData);
      let zmsv = zeModel.insertMany(insrtData);
      //console.log(zmsv);
      if (zmsv) {
        res.send('true');
      }

    } catch (error) {
      //console.log('Entered in catch error section.' + error.message);
    }
  }

  async listze(req, res, next) {
    try {
      var getAllUserData = await usersModel.aggregate([
        {
          $lookup: {
            from: "ze_teams",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "ze_info"         // alias for userinfo table
          }
        },
        //{$unwind:"$ze_info"},
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },
        //{$unwind:"$user_info"},

        { '$match': { status: 'active', 'ze_info.type': 'ze', 'ze_info': { '$size': 1 } } },
        { $sort: { "ze_info.created_at": -1 } },

        {
          $project: {
            _id: 1,
            fullname: 1,
            mobile: 1,
            email: 1,
            f_name: "$userDetails.f_name",
            m_name: "$userDetails.m_name",
            l_name: "$userDetails.l_name",
            city: "$user_info.city",
            state: "$user_info.state",
            ze_referrer_code: "$ze_info.ze_referrer_code",
            type: "$ze_info.type"
          }
        }

      ]);

      //console.log(getAllUserData);
      res.render('admin/list-ze', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(), 'data': getAllUserData, title: 'ZE List', usrType: req.session.userType });
    } catch (error) {
      console.log(error);
    }

  }

  async zefelist(req, res, next) {
    try {
      const userID = req.params.id;
      const zeDetails = await usersModel.findById(userID);
      const feData = await zeModel.find({ "ze_user_id": userID, type: { $ne: 'ze' } });

      var allFEID = [];
      var o = 0;
      feData.forEach((obj) => {
        allFEID[o] = obj.user_id;
        o++;
      });


      //console.log(allFEID);
      var getAllUserData = await usersModel.aggregate([
        { $sort: { fullname: 1 } },
        { '$match': { status: 'active', user_type: /^agent$/i, "_id": { "$in": allFEID }, } },
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },
        {
          $project: {
            _id: 1,
            fullname: 1,
            mobile: 1,
            referrer_code: 1,
            f_name: "$userDetails.f_name",
            m_name: "$userDetails.m_name",
            l_name: "$userDetails.l_name",
            city: "$user_info.city",
            state: "$user_info.state"

          }
        }

      ]);


      res.render('admin/list-ze-fe', { 'path': '../../', "leftMenuType": middleware.checkLeftMenuFN(), 'data': getAllUserData, zeDetails: zeDetails, title: 'ZE-FE List', usrType: req.session.userType });
    } catch (error) {
      console.log(error);
    }

  }

  async febclist(req, res, next) {
    try {
      const userReferrerCode = req.params.id;
      //const zeDetails = await usersModel.findById(userID); 
      const feDetails = await usersModel.find({ "referrer_code": userReferrerCode });


      var getAllUserData = await usersModel.aggregate([
        { $sort: { fullname: 1 } },
        { '$match': { status: 'active', user_type: 'bc', "referl_code": userReferrerCode } },
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },
        {
          $project: {
            _id: 1,
            fullname: 1,
            mobile: 1,
            referrer_code: 1,
            f_name: "$userDetails.f_name",
            m_name: "$userDetails.m_name",
            l_name: "$userDetails.l_name",
            city: "$user_info.city",
            state: "$user_info.state"

          }
        }

      ]);

      //console.log(feDetails[0].fullname);

      res.render('admin/list-fe-bc', { 'path': '../../', "leftMenuType": middleware.checkLeftMenuFN(), 'data': getAllUserData, feDetails: feDetails, title: 'FE-BC List', usrType: req.session.userType });
    } catch (error) {
      console.log(error);
    }

  }

  async boughtdevice(req, res, next) {

    var getAllUserData = await usersModel.aggregate([
      {
        $lookup: {
          from: "users_details",
          localField: "_id",    // field in the orders collection
          foreignField: "user_id",  // field in the items collection
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },

      {
        $lookup: {
          from: "payment_successes",
          localField: "_id",    // field in the orders collection
          foreignField: "user_id",  // field in the items collection
          as: "userPaymentDetails"
        }
      },
      { $unwind: "$userPaymentDetails" },
      { $match: { status: 'active', user_type: 'bc', "userPaymentDetails.devivce_amount": { $ne: '0' } } },
      { $sort: { fullname: 1 } },

      {
        $project: {
          _id: 1,
          fullname: 1,
          mobile: 1,
          payment_status: 1,
          user_type: 1,
          city: "$userDetails.city",
          devivce_amount: "$userPaymentDetails.devivce_amount",
          trans_date: "$userPaymentDetails.trans_date"
        }
      }

    ]);

    var getDeviceSum = await usersModel.aggregate([
      // Join with user_info table
      {
        $lookup: {
          from: "payment_successes",       // other table name
          localField: "_id",   // name of users table field
          foreignField: "user_id", // name of userinfo table field
          as: "payment_info"         // alias for userinfo table
        }
      },
      { $unwind: "$payment_info" },     // $unwind used for getting data in object or for one record only

      // define some conditions here 
      { $match: { status: 'active', user_type: 'bc', "payment_info.devivce_amount": { "$ne": "0" } } },
      {
        "$group": {
          "_id": null,
          totalAmount: {
            $sum: {
              $toDouble: "$payment_info.devivce_amount"
            }
          }
        }
      }

    ]);

    //console.log(getDeviceSum);
    // return;
    res.render('admin/device_list', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(req, res), 'data': getAllUserData, getDeviceSum: getDeviceSum[0].totalAmount, title: 'Bought Device', usrType: req.session.userType });
  }

  async deleteZe(req, res, next) {
    const data = req.body;
    try {
      //console.log(data._id);
      //Delete all ze and its fe ------------
      const query = { ze_user_id: data._id };
      const result = await zeModel.deleteMany(query);
      // // ------------- END ------------- 
      //console.log(result);
      if (result) {
        res.send(true);
      }

    } catch (error) {
      console.log('Entered in catch error section.----' + error);
    }
  }

  async postCreateMArqMsg(req, res, next) {
    const data = req.body;
    // Update the user has paid

    await marqMsgModel.updateMany({ type: data.type }, { $set: { status: 'inactive' } });
    let dir = "./public/upload/notification/";
    let uploadNotificationFile = req.files && req.files.notification_file ? req.files.notification_file : null;
    var doUplodNotiFile;
    if (uploadNotificationFile) {
      doUplodNotiFile = middleware.allFileTypeUploadsFN(req.files, uploadNotificationFile, dir);
      //console.log(doUplodNotiFile);
      if (doUplodNotiFile.status == "success") {
        await marqMsgModel.create({
          title: data.title,
          message: data.message,
          notification_file: doUplodNotiFile.message,
          type: data.type,
          status: "active"
        });
        return res.redirect("/admin/admin-dashboard");
      }
    } else {
      await marqMsgModel.create({
        title: data.title,
        message: data.message,
        notification_file: null,
        type: data.type,
        status: "active"
      });
      return res.redirect("/admin/admin-dashboard");
    }




  }

  // Download CSV code start here --------------------

  // Download Agents CSV
  async download(req, res) {
    try {
      var getAllUserData = await usersModel.aggregate([
        // Join with user_info table
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },
        { $unwind: "$user_info" },  // $unwind used for getting data in object or for one record only
        // Join with user_role table
        {
          $lookup: {
            from: "kyc_details",
            localField: "_id",
            foreignField: "user_id",
            as: "user_kyc"
          }
        },
        { $unwind: "$user_kyc" },
        {
          $lookup: {
            from: "payment_successes",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userPaymentDetails"
          }
        },
        { $unwind: "$userPaymentDetails" },

        // define some conditions here 
        // {$match: { status: 'active', user_type : /^agent$/i }},
        { $match: { status: 'active', user_type: 'agent' } },
        { $sort: { 'userPaymentDetails._id': 1 } },

        // define which fields are you want to fetch
        {
          $project: {
            _id: 1,
            fullname: { $concat: ["$user_info.f_name", " ", "$user_info.m_name", " ", "$user_info.l_name"] },
            email: 1,
            mobile: 1,
            created_at: 1,
            referrer_code: 1,
            amazon_email: 1,
            amazon_mobile: 1,
            pan_number: "$user_kyc.pan_number",
            aadhar_number: "$user_kyc.aadhar_number",
            city: "$user_info.city",
            state: "$user_info.state",
            pin_code: "$user_info.pin_code",
            trans_date: "$userPaymentDetails.trans_date",
            fino_cif: "$user_info.fino_cif",
            fino_pool_ac: "$user_info.fino_pool_ac",
          }
        }
      ]);

      let tutorials = [];

      getAllUserData.forEach((obj) => {
        let createdDt = middleware.getFormattedDateFN(obj.created_at);

        var d = new Date(obj.trans_date.toString());
        var paymentDT = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();

        const { fullname, email, mobile, referrer_code, city, state, pan_number, aadhar_number, pin_code, amazon_email, amazon_mobile, fino_cif, fino_pool_ac } = obj;

        tutorials.push({ fullname, email, mobile, referrer_code, city, state, pan_number, aadhar_number, pin_code, amazon_email, amazon_mobile, fino_cif, fino_pool_ac, createdDt, paymentDT });
      });

      const csvFields = ["Full Name", "Email", "Mobile", "PAN Number", "Pin Code"];

      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(tutorials);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=feildExcutive.csv");
      res.status(200).end(csvData);
    } catch (error) {
      //console.log('Entered in catch error section.' + error.message);
    }
  }

  async downloadbc(req, res) {
    try {

      var getAllUserData = await usersModel.aggregate([

        // Join with user_info table
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },
        { $unwind: "$user_info" },     // $unwind used for getting data in object or for one record only

        // Join with user_role table
        {
          $lookup: {
            from: "kyc_details",
            localField: "_id",
            foreignField: "user_id",
            as: "user_kyc"
          }
        },
        { $unwind: "$user_kyc" },

        {
          $lookup: {
            from: "payment_successes",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userPaymentDetails"
          }
        },
        { $unwind: "$userPaymentDetails" },


        // define some conditions here 
        { $match: { status: 'active', user_type: 'bc', payment_status: 'paid' } },
        { $sort: { 'userPaymentDetails.created_at': 1, 'userPaymentDetails._id': 1 } },
        // define which fields are you want to fetch
        {
          $project: {
            _id: 1,
            email: 1,
            mobile: 1,
            referrer_code: 1,
            referl_code: 1,
            created_at: 1,
            amazon_email: 1,
            amazon_mobile: 1,
            pan_number: "$user_kyc.pan_number",
            aadhar_number: "$user_kyc.aadhar_number",
            city: "$user_info.city",
            state: "$user_info.state",
            pin_code: "$user_info.pin_code",
            f_name: "$user_info.f_name",
            m_name: "$user_info.m_name",
            l_name: "$user_info.l_name",
            trans_date: "$userPaymentDetails.trans_date",
            fino_cif: "$user_info.fino_cif",
            fino_pool_ac: "$user_info.fino_pool_ac",
          }
        }
      ]);

      let tutorials = [];

      await Promise.all(getAllUserData.map(async (obj) => {

        const feDtls = await usersModel.findOne({ 'referrer_code': obj.referl_code });

        let createdDt = middleware.getFormattedDateFN(obj.created_at);

        var d = new Date(obj.trans_date.toString());
        var paymentDT = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();

        var fullName = obj.f_name + ' ' + obj.m_name + ' ' + obj.l_name;
        var FEName = feDtls.fullname;
        var FEMobile = feDtls.mobile;
        const { email, mobile, referrer_code, city, state, referl_code, pan_number, aadhar_number, pin_code, amazon_email, amazon_mobile, fino_cif, fino_pool_ac } = obj;
        tutorials.push({ fullName, email, mobile, referrer_code, city, state, referl_code, pan_number, aadhar_number, pin_code, FEName, FEMobile, amazon_email, amazon_mobile, fino_cif, fino_pool_ac, createdDt, paymentDT });
      }));

      const csvFields = ["Full Name", "Email", "Mobile", "PAN Number", "Pin Code"];

      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(tutorials);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=BCA-csv.csv");
      res.status(200).end(csvData);
    } catch (error) {
      //console.log('Entered in catch error section.' + error.message);
    }
  }
  async downloadews(req, res) {
    try {

      var getAllUserData = await usersModel.aggregate([
        // Join with user_info table
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },
        { $unwind: "$user_info" },     // $unwind used for getting data in object or for one record only

        // Join with user_role table
        {
          $lookup: {
            from: "kyc_details",
            localField: "_id",
            foreignField: "user_id",
            as: "user_kyc"
          }
        },
        { $unwind: "$user_kyc" },

        {
          $lookup: {
            from: "payment_successes",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userPaymentDetails"
          }
        },
        { $unwind: "$userPaymentDetails" },


        // define some conditions here 
        { $match: { status: 'active', user_type: 'ews', payment_status: 'paid' } },
        { $sort: { 'userPaymentDetails.created_at': 1, 'userPaymentDetails._id': 1 } },
        // define which fields are you want to fetch
        {
          $project: {
            _id: 1,
            email: 1,
            mobile: 1,
            referrer_code: 1,
            referl_code: 1,
            created_at: 1,
            amazon_email: 1,
            amazon_mobile: 1,
            pan_number: "$user_kyc.pan_number",
            aadhar_number: "$user_kyc.aadhar_number",
            city: "$user_info.city",
            state: "$user_info.state",
            pin_code: "$user_info.pin_code",
            f_name: "$user_info.f_name",
            m_name: "$user_info.m_name",
            l_name: "$user_info.l_name",
            trans_date: "$userPaymentDetails.trans_date",
            fino_cif: "$user_info.fino_cif",
            fino_pool_ac: "$user_info.fino_pool_ac",
          }
        }
      ]);

      let tutorials = [];
      //console.log(getAllUserData);

      await Promise.all(getAllUserData.map(async (obj) => {

        const feDtls = await usersModel.findOne({ 'referrer_code': obj.referl_code });

        let createdDt = middleware.getFormattedDateFN(obj.created_at);

        var d = new Date(obj.trans_date.toString());
        var paymentDT = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();

        var fullName = obj.f_name + ' ' + obj.m_name + ' ' + obj.l_name;
        var FEName = feDtls.fullname;
        var FEMobile = feDtls.mobile;
        const { email, mobile, referrer_code, city, state, referl_code, pan_number, aadhar_number, pin_code, amazon_email, amazon_mobile, fino_cif, fino_pool_ac } = obj;
        tutorials.push({ fullName, email, mobile, referrer_code, city, state, referl_code, pan_number, aadhar_number, pin_code, FEName, FEMobile, amazon_email, amazon_mobile, fino_cif, fino_pool_ac, createdDt, paymentDT });
      }));

      const csvFields = ["Full Name", "Email", "Mobile", "PAN Number", "Pin Code"];

      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(tutorials);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=ews-csv.csv");
      res.status(200).end(csvData);
    } catch (error) {
      console.log('Entered in catch error section.' + error.message);
    }
  }

  async downloadAll(req, res) {
    try {

      var getAllUserData = await usersModel.aggregate([
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },
        { $unwind: "$user_info" },     // $unwind used for getting data in object or for one record only
        // Join with user_role table
        {
          $lookup: {
            from: "kyc_details",
            localField: "_id",
            foreignField: "user_id",
            as: "user_kyc"
          }
        },
        { $unwind: "$user_kyc" },
        // define some conditions here 
        { $match: { status: 'active' } },
        {
          $lookup: {
            from: "payment_successes",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userPaymentDetails"
          }
        },
        { $sort: { payment_status: 1 } },
        // define which fields are you want to fetch
        {
          $project: {
            _id: 1,
            fullname: 1,
            email: 1,
            mobile: 1,
            referl_code: 1,
            referrer_code: 1,
            dob: 1,
            payment_status: 1,
            fullname: { $concat: ["$user_info.f_name", " ", "$user_info.m_name", " ", "$user_info.l_name"] },
            bank_name: "$user_kyc.bank_name",
            branch_name: "$user_kyc.branch_name",
            ifsc_code: "$user_kyc.ifsc_code",
            account_number: "$user_kyc.account_number",
            upi_id: "$user_kyc.upi_id",
            aadhar_number: "$user_kyc.aadhar_number",
            pan_number: "$user_kyc.pan_number",
            relative_name: "$user_info.relative_name",
            house_number: "$user_info.house_number",
            street: "$user_info.street",
            village_locality: "$user_info.village_locality",
            post_office: "$user_info.post_office",
            city: "$user_info.city",
            state: "$user_info.state",
            pin_code: "$user_info.pin_code",
            f_name: "$user_info.f_name",
            m_name: "$user_info.m_name",
            l_name: "$user_info.l_name",
            trans_date: "$userPaymentDetails.trans_date"
          }
        }
      ]);

      let tutorials = [];

      //console.log(getAllUserData);
      getAllUserData.forEach((obj) => {
        var d = new Date(obj.trans_date.toString());
        var paymentDT = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();

        const { fullname, full_name, email, mobile, referl_code, referrer_code, dob, payment_status, bank_name, branch_name, ifsc_code, account_number, upi_id, aadhar_number, pan_number, relative_name, house_number, street, village_locality, post_office, city, state, pin_code } = obj;

        tutorials.push({ fullname, full_name, email, mobile, referl_code, referrer_code, dob, payment_status, bank_name, branch_name, ifsc_code, account_number, upi_id, aadhar_number, pan_number, relative_name, house_number, street, village_locality, post_office, city, state, pin_code, paymentDT });
      });

      const csvFields = ['Bank Fullname', 'email', 'mobile', 'referl code', 'referrer code', 'payment_status', 'Full name', 'Bank name', 'branch name', 'ifsc code', 'account number', 'upi id', 'aadhar number', 'pan number', 'relative name', 'house number', 'village locality', 'post office', 'city', 'state', 'pin code'];

      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(tutorials);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=allUsers.csv");
      res.status(200).end(csvData);
    } catch (error) {
      console.log('Entered in catch error section.' + error.message);
    }
  }

  async succespaymentcsv(req, res) {
    try {
      var payments = await usersModel.aggregate([

        // Join with user_info table
        {
          $lookup: {
            from: "payment_successes",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "payment_info"         // alias for userinfo table
          }
        },
        { $unwind: "$payment_info" },     // $unwind used for getting data in object or for one record only

        // define some conditions here 
        { $match: { status: 'active' } },
        { $sort: { 'payment_info.created_at': -1, 'payment_info._id': -1 } },
        // define which fields are you want to fetch
        {
          $project: {
            _id: 1,
            fullname: 1,
            email: 1,
            mobile: 1,
            user_type: 1,
            total_amount: "$payment_info.total_amount",
            gstCost: "$payment_info.gstCost",
            actualAmount: "$payment_info.actualAmount",
            created_at: "$payment_info.created_at",
            devivce_amount: "$payment_info.devivce_amount",
            payment_mode: "$payment_info.payment_mode"
          }
        }
      ]);



      let tutorials = [];

      payments.forEach((obj) => {
        let paymentDt = middleware.getFormattedDateFN(obj.created_at);

        const { fullname, mobile, payment_mode, gstCost, actualAmount, total_amount, devivce_amount, user_type, paymentDate } = obj;
        tutorials.push({ fullname, mobile, payment_mode, gstCost, actualAmount, total_amount, devivce_amount, user_type, paymentDt });
      });

      const csvFields = ["Full Name", "Mobile", "Payment Mode", "Total Amount"];

      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(tutorials);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=successpayments.csv");
      res.status(200).end(csvData);
    } catch (error) {
      console.log('Entered in catch error section.' + error.message);
    }
  }

  async downloadZE(req, res) {
    try {
      var getAllUserData = await usersModel.aggregate([
        {
          $lookup: {
            from: "ze_teams",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "ze_info"         // alias for userinfo table
          }
        },
        //{$unwind:"$ze_info"},
        { $sort: { fullname: 1 } },
        { '$match': { status: 'active', 'ze_info.type': 'ze', 'ze_info': { '$size': 1 } } },
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },
        { $unwind: "$user_info" },
        {
          $lookup: {
            from: "kyc_details",
            localField: "_id",
            foreignField: "user_id",
            as: "user_kyc"
          }
        },
        { $unwind: "$user_kyc" },
        {
          $project: {
            _id: 1,
            fullname: { $concat: ["$user_info.f_name", " ", "$user_info.m_name", " ", "$user_info.l_name"] },
            email: 1,
            mobile: 1,
            referrer_code: 1,
            referl_code: 1,
            created_at: 1,
            city: "$user_info.city",
            state: "$user_info.state",
            pin_code: "$user_info.pin_code",
            ze_referrer_code: "$ze_info.ze_referrer_code",
            pan_number: "$user_kyc.pan_number",
            aadhar_number: "$user_kyc.aadhar_number"
          }
        }

      ]);

      let tutorials = [];
      //console.log(getAllUserData);
      getAllUserData.forEach((obj) => {
        let createdAt = middleware.getFormattedDateFN(obj.created_at);

        const { fullname, email, mobile, referrer_code, city, state, referl_code, ze_referrer_code, pan_number, aadhar_number, pin_code, RegistrationDate } = obj;
        tutorials.push({ fullname, email, mobile, referrer_code, city, state, referl_code, ze_referrer_code, pan_number, aadhar_number, pin_code, createdAt });
      });

      const csvFields = ["Full Name", "Email", "Mobile", "PAN Number", "Pin Code"];

      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(tutorials);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=ZE-csv.csv");
      res.status(200).end(csvData);
    } catch (error) {
      console.log('Entered in catch error section.' + error.message);
    }
  }

  async downloadzefe(req, res, next) {
    try {

      const userID = req.params.id;
      const zeDetails = await usersModel.findById(userID);
      const feData = await zeModel.find({ "ze_user_id": userID, type: { $ne: 'ze' } });

      var allFEID = [];
      var o = 0;
      feData.forEach((obj) => {
        allFEID[o] = obj.user_id;
        o++;
      });


      var getAllUserData = await usersModel.aggregate([
        { $sort: { fullname: 1 } },
        { '$match': { status: 'active', user_type: /^agent$/i, "_id": { "$in": allFEID }, } },
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },
        { $unwind: "$user_info" },
        {
          $lookup: {
            from: "kyc_details",
            localField: "_id",
            foreignField: "user_id",
            as: "user_kyc"
          }
        },
        { $unwind: "$user_kyc" },
        {
          $project: {
            _id: 1,
            fullname: 1,
            email: 1,
            mobile: 1,
            referrer_code: 1,
            referl_code: 1,
            created_at: 1,
            city: "$user_info.city",
            state: "$user_info.state",
            pin_code: "$user_info.pin_code",
            pan_number: "$user_kyc.pan_number",
            aadhar_number: "$user_kyc.aadhar_number"
          }
        }

      ]);


      let tutorials = [];
      //console.log(zeDetails);
      getAllUserData.forEach((obj) => {
        let createdAt = middleware.getFormattedDateFN(obj.created_at);
        const { fullname, email, mobile, referrer_code, city, state, referl_code, pan_number, aadhar_number, pin_code, RegistrationDate } = obj;
        tutorials.push({ fullname, email, mobile, referrer_code, city, state, referl_code, pan_number, aadhar_number, pin_code, createdAt });
      });

      const csvFields = ["Full Name", "Email", "Mobile", "PAN Number", "Pin Code"];

      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(tutorials);
      let zeName = zeDetails.fullname;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=" + zeName + "-csv.csv");
      res.status(200).end(csvData);
    } catch (error) {
      console.log('Entered in catch error section.' + error.message);
    }
  }

  async downloadfebc(req, res, next) {
    try {

      const userReferrerCode = req.params.id;

      const feDetails = await usersModel.find({ "referrer_code": userReferrerCode });

      var getAllUserData = await usersModel.aggregate([
        { $sort: { fullname: 1 } },
        { '$match': { status: 'active', user_type: /^bc$/i, "referl_code": userReferrerCode } },
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },
        { $unwind: "$user_info" },
        {
          $lookup: {
            from: "kyc_details",
            localField: "_id",
            foreignField: "user_id",
            as: "user_kyc"
          }
        },
        { $unwind: "$user_kyc" },
        {
          $lookup: {
            from: "payment_successes",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userPaymentDetails"
          }
        },
        { $unwind: "$userPaymentDetails" },
        {
          $project: {
            _id: 1,
            fullname: 1,
            email: 1,
            mobile: 1,
            referrer_code: 1,
            referl_code: 1,
            created_at: 1,
            city: "$user_info.city",
            state: "$user_info.state",
            pin_code: "$user_info.pin_code",
            pan_number: "$user_kyc.pan_number",
            aadhar_number: "$user_kyc.aadhar_number",
            actualAmount: "$userPaymentDetails.actualAmount",
            gstCost: "$userPaymentDetails.gstCost",
            devivce_amount: "$userPaymentDetails.devivce_amount",
            total_amount: "$userPaymentDetails.total_amount",
            trans_date: "$userPaymentDetails.trans_date"
          }
        }

      ]);

      let tutorials = [];
      //console.log(feDetails);
      getAllUserData.forEach((obj) => {
        var d = new Date(obj.trans_date.toString());
        var paymentDT = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();
        let createdAt = middleware.getFormattedDateFN(obj.created_at);
        const { fullname, email, mobile, referrer_code, city, state, referl_code, pan_number, aadhar_number, pin_code, actualAmount, gstCost, devivce_amount, total_amount, RegistrationDate } = obj;
        tutorials.push({ fullname, email, mobile, referrer_code, city, state, referl_code, pan_number, aadhar_number, pin_code, actualAmount, gstCost, devivce_amount, total_amount, createdAt, paymentDT });
      });

      const csvFields = ["Full Name", "Email", "Mobile", "PAN Number", "Pin Code"];

      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(tutorials);
      let bcaName = feDetails.fullname;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=FE-MS-csv.csv");
      res.status(200).end(csvData);
    } catch (error) {
      console.log('Entered in catch error section.' + error.message);
    }
  }

  async downloadBoughtDevice(req, res, next) {
    try {

      var getAllUserData = await usersModel.aggregate([
        {
          $lookup: {
            from: "users_details",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userDetails"
          }
        },
        { $unwind: "$userDetails" },

        {
          $lookup: {
            from: "payment_successes",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userPaymentDetails"
          }
        },
        { $unwind: "$userPaymentDetails" },
        { $match: { status: 'active', user_type: 'bc', "userPaymentDetails.devivce_amount": { $ne: '0' } } },
        { $sort: { fullname: 1 } },

        {
          $project: {
            _id: 1,
            fullname: 1,
            mobile: 1,
            email: 1,
            payment_status: 1,
            user_type: 1,
            created_at: "$userPaymentDetails.created_at",
            city: "$userDetails.city",
            devivce_amount: "$userPaymentDetails.devivce_amount",
            trans_date: "$userPaymentDetails.trans_date"
          }
        }

      ]);

      let tutorials = [];
      //console.log(getAllUserData);
      getAllUserData.forEach((obj) => {
        let createdAt = middleware.getFormattedDateFN(obj.created_at);
        var d = new Date(obj.trans_date.toString());
        var paymentDT = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();

        const { fullname, email, mobile, city, devivce_amount, RegistrationDate } = obj;
        tutorials.push({ fullname, email, mobile, city, devivce_amount, createdAt, paymentDT });
      });

      const csvFields = ["Full Name", "Email", "Mobile", "PAN Number", "Pin Code"];

      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(tutorials);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=Device-csv.csv");
      res.status(200).end(csvData);
    } catch (error) {
      console.log('Entered in catch error section.' + error.message);
    }
  }
  // ----------  END Code here ----------------

  async getUsrDetailsFN(id, params, type) {
    if (type == 'select') {
      return await usersModel.findOne({ mobile: params });
    } else {
      //console.log(id);
      //return await kycModel.findOneAndUpdate({user_id: id }, {account_number : params});
    }



  }



  async reportcards(req, res, next) {
    try {
      if (req.session.userType == 'COMPANY' || req.session.userType == 'AM') {

        var getMobile = middleware.checkAreaManagerFN(req.session.user.mobile);

        const state = (getMobile.split("__")[2] == "UTTAR PRADESH") ? ((req.session.user.mobile == "9151154177") ? 'UTTAR PRADESH WESTERN' : 'UTTAR PRADESH EASTERN') : getMobile.split("__")[2];
        //console.log(state);
        if (state) {
          var getAllUPData = await usersModel.aggregate(
            [
              {
                '$lookup': {
                  'from': 'users_details',
                  'localField': '_id',
                  'foreignField': 'user_id',
                  'as': 'user_info'
                }
              }, {
                '$unwind': {
                  'path': '$user_info'
                }
              }, {
                '$lookup': {
                  'from': 'ze_teams',
                  'localField': '_id',
                  'foreignField': 'user_id',
                  'as': 'ze_info'
                }
              }, {
                '$match': {
                  'status': 'active',
                  'user_type': 'agent',
                  'user_info.state': getMobile.split("__")[2]
                }
              }, {
                '$project': {
                  '_id': 1,
                  'fullname': 1,
                  'mobile': 1,
                  'referrer_code': 1,
                  'referl_code': 1,
                  'user_type': 1,
                  'created_at': 1,
                  'city': '$user_info.city',
                  'state': '$user_info.state',
                  'ze_user_id': '$ze_info.ze_user_id'
                }
              }
            ]
          );
          //console.log(getAllUPData);
          var results = [];
          var date = new Date();

          var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
          var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const easternUPassignCity = ["ambedkar aagar", "amethi", "ayodhya", "azamgarh", 'bahraich', 'ballia', 'banda', 'balrampur', 'barabanki', 'basti', 'bhadohi', 'chandauli', 'chitrakoot', 'deoria', 'fatehpur', 'ghazipur', 'gonda', 'gorakhpur', 'jaunpur', 'kaushambi', 'kushinagar', 'maharajganj', 'mahoba', 'mau', 'mirzapur', 'pratapgarh', 'prayagraj', 'raebareli', 'sant kabir nagar', 'shravasti', 'siddharthnagar', 'sonbhadra', 'sultanpur', 'varanasi'];

          const cdt1 = new Date();
          const withoutTimecdt1 = cdt1.toJSON().split("T")[0];
          const actualcurntDT = withoutTimecdt1 + "T00:00:00.0Z";

          const ydt1 = new Date(new Date().setDate(new Date().getDate() - 1));
          const ydt2 = new Date(new Date().setDate(new Date().getDate() - 2));

          const withoutTimeydt1 = ydt1.toJSON().split("T")[0];
          const actualyestrdyDT = withoutTimeydt1 + "T00:00:00.0Z";

          const withoutTimeydt2 = ydt2.toJSON().split("T")[0];
          const actualyestrdyDT2 = withoutTimeydt2 + "T23:23:59.0Z";

          var montFirstDay = new Date(date.getFullYear(), date.getMonth(), 1);
          const withoutTimemontFirstDay = montFirstDay.toJSON().split("T")[0];
          const monthFirstDay = withoutTimemontFirstDay + "T23:59:59.0Z";

          await Promise.all(getAllUPData.map(async (val, key) => {
            let zeDtls = '';

            if (val.state == "UTTAR PRADESH") {

              if (easternUPassignCity.includes(val.city.toLowerCase()) && ((req.session.user.mobile == "9628880669") || (req.session.user.mobile == "7007122626"))) {

                let currentMonthTotal = await usersModel.find({
                  payment_status: "paid",
                  referl_code: val.referrer_code,
                  "created_at": { $gte: new Date(monthFirstDay), $lt: new Date(actualyestrdyDT2) }
                }).count();


                let yesterdayregBC = await usersModel.find({
                  referl_code: val.referrer_code,
                  payment_status: "paid",
                  created_at: {
                    $lt: new Date(actualcurntDT),
                    $gte: new Date(actualyestrdyDT)
                  },
                }).count();

                if (typeof val.ze_user_id != "undefined" || val.ze_user_id)
                  zeDtls = await usersModel.findById(val.ze_user_id);

                let bcDtls = await usersModel.find({
                  payment_status: "paid",
                  'referl_code': val.referrer_code,
                  "created_at": {
                    $gte: new Date(monthFirstDay),
                    $lt: new Date(actualyestrdyDT2)
                  }
                }).sort({ created_at: -1 })
                  ;
                let bccounts = await usersModel.findOne({ payment_status: "paid", 'referl_code': val.referrer_code }).count();

                //console.log(bccounts+' ---bccounts --------------currentMonthTotal--- '+ currentMonthTotal+' -------- '+val.referrer_code);

                bccounts = parseInt(bccounts) - (parseInt(currentMonthTotal) + parseInt(yesterdayregBC));
                //console.log(bccounts);

                // For Estern UP (Ravindra ji)
                results.push({
                  "feDtls": val,
                  "bccounts": bccounts,
                  "yesterdayregBC": yesterdayregBC,
                  'bcDtls': bcDtls,
                  'zeDtls': zeDtls,
                  'currentMonthTotal': currentMonthTotal

                });
              } else if (!easternUPassignCity.includes(val.city.toLowerCase()) && (req.session.user.mobile != "9628880669")) {
                // Western UP

                // console.log(easternUPassignCity.includes(val.city.toLowerCase())+' --- '+ val.city);
                let currentMonthTotal = await usersModel.find({
                  payment_status: "paid",
                  referl_code: val.referrer_code,
                  "created_at": { $gte: new Date(monthFirstDay), $lt: new Date(actualyestrdyDT2) }
                }).count();

                let yesterdayregBC = await usersModel.find({
                  referl_code: val.referrer_code,
                  payment_status: "paid",
                  created_at: {
                    $lt: new Date(actualcurntDT),
                    $gte: new Date(actualyestrdyDT)
                  },
                }).count();



                if (typeof val.ze_user_id != "undefined" || val.ze_user_id)
                  zeDtls = await usersModel.findById(val.ze_user_id);

                let bcDtls = await usersModel.find({
                  payment_status: "paid",
                  'referl_code': val.referrer_code,
                  "created_at": {
                    $gte: new Date(monthFirstDay),
                    $lt: new Date(actualyestrdyDT2)
                  }
                }).sort({ created_at: -1 })
                  ;
                let bccounts = await usersModel.findOne({ payment_status: "paid", 'referl_code': val.referrer_code }).count();
                //console.log(currentMonthTotal+ '   bccounts '+bccounts);
                bccounts = parseInt(bccounts) - (parseInt(currentMonthTotal) + parseInt(yesterdayregBC));

                //   console.log(val.city+' --------+++++------------');
                // console.log(bccounts);

                results.push({
                  "feDtls": val,
                  "bccounts": bccounts,
                  "yesterdayregBC": yesterdayregBC,
                  'bcDtls': bcDtls,
                  'zeDtls': zeDtls,
                  'currentMonthTotal': currentMonthTotal

                });
              }
            } else {
              // Rest all other State
              let currentMonthTotal = await usersModel.find({
                payment_status: "paid",
                referl_code: val.referrer_code,
                "created_at": {
                  $gte: new Date(monthFirstDay),
                  $lt: new Date(actualyestrdyDT2)
                }
              }).count();

              let yesterdayregBC = await usersModel.find({
                referl_code: val.referrer_code,
                payment_status: "paid",
                created_at: {
                  $lt: new Date(actualcurntDT),
                  $gte: new Date(actualyestrdyDT)
                },
              }).count();

              //console.log('actualcurntDT - '+actualcurntDT+' -=-=-=   actualyestrdyDT '+actualyestrdyDT);
              if (typeof val.ze_user_id != "undefined" || val.ze_user_id)
                zeDtls = await usersModel.findById(val.ze_user_id);

              let bcDtls = await usersModel.find({ payment_status: "paid", 'referl_code': val.referrer_code, "created_at": { $gte: new Date(monthFirstDay), $lt: new Date(actualyestrdyDT2) } }).sort({ created_at: -1 });
              let bccounts = await usersModel.findOne({ payment_status: "paid", 'referl_code': val.referrer_code }).count();

              //console.log('bccounts---- '+bccounts+' -----currentMonthTotal-- '+currentMonthTotal+' --- fnm --- '+val.fullname);

              bccounts = parseInt(bccounts) - (parseInt(currentMonthTotal) + parseInt(yesterdayregBC));


              results.push({
                "feDtls": val,
                "bccounts": bccounts,
                "yesterdayregBC": yesterdayregBC,
                'bcDtls': bcDtls,
                'zeDtls': zeDtls,
                'currentMonthTotal': currentMonthTotal

              });
            }
          }));



          results.sort((a, b) => (b.bccounts > a.bccounts) ? 1 : ((a.bccounts > b.bccounts) ? -1 : 0))

          // console.log(results);
          // return;

          res.render('admin/report-cards', {
            'path': '../',
            "leftMenuType": middleware.checkLeftMenuFN(req, res),
            "title": 'Dashboard',
            'usrType': req.session.userType,
            "results": results,
            'state': getMobile
          });
        } else {
          res.render('admin/report-cards', {
            'path': '../',
            "leftMenuType": middleware.checkLeftMenuFN(req, res),
            "title": 'Dashboard',
            'usrType': req.session.userType,
            "results": '',
            'state': "Error"
          });
        }
      }
    } catch (error) {
      console.log('Error report card- ' + error.message)
    }
  }

  async adminReportCards(req, res, next) {

    try {
      var states = (req.params.id).toUpperCase();
      const monthNames = ["Jan", "Feb", "March", "April", "May", "June",
        "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
      const d = new Date();
      var liData = '';

      if (states) {
        var total_BC = 0;
        var total_FE = 0;
        for (let i = 3; i >= 0; i--) {
          var getYesterday_FE = 0;
          var getYesterday_BC = 0;

          var getFEDataBY_Monthly = 0;
          var getBCDataBY_Monthly = 0;
          if (i == 0) {

            // -------      GET EVERY MONTH YESTERDAY DATA -------------
            getYesterday_FE = await this.currenthMDt(states, new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours('23', '59', '59')), new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours('00', '00', '00')), 'agent');

            getYesterday_BC = await this.currenthMDt(states, new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours('23', '59', '59')), new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours('00', '00', '00')), 'bc');


            getBCDataBY_Monthly = await this.pastMonthGetData(states, i, 'bc');

            getFEDataBY_Monthly = await this.pastMonthGetData(states, i, 'agent');



            total_FE = parseInt(getYesterday_FE) + parseInt(getFEDataBY_Monthly) + parseInt(total_FE);

            total_BC = parseInt(getYesterday_BC) + parseInt(getBCDataBY_Monthly) + parseInt(total_BC);

            liData += '<li class="td-min-orange list-group-item d-flex"><span class="text-semibold text-reagent-gray col-1 align-items-center justify-content-center">' + monthNames[d.getMonth() - i] + '</span><span class="text-center text-semibold text-reagent-gray col-2 align-items-center justify-content-center">' + getYesterday_FE + ' </span> </span><span class="text-center text-semibold text-reagent-gray col-1 align-items-center justify-content-center">' + (parseInt(getYesterday_FE) + parseInt(getFEDataBY_Monthly)) + '</span><span class="text-center text-semibold text-reagent-gray col-2 align-items-center justify-content-center">' + total_FE + '</span><span class="text-center text-semibold text-reagent-gray col-1 align-items-center justify-content-center">' + getYesterday_BC + '</span></span><span class="text-center text-semibold text-reagent-gray col-1 align-items-center justify-content-center">' + (parseInt(getYesterday_BC) + parseInt(getBCDataBY_Monthly)) + '</span><span class="text-center text-semibold text-reagent-gray col-2 ">' + total_BC + '</span><span class="text-semibold text-reagent-gray col-2 text-center">' + (parseInt(total_BC) + parseInt(total_FE)) + '</span></li>';

          } else {
            // ---------------- START  GET MONTHLY RECORD ----------- 
            getBCDataBY_Monthly = await this.pastMonthGetData(states, i, 'bc');

            getFEDataBY_Monthly = await this.pastMonthGetData(states, i, 'agent');


            total_FE = parseInt(total_FE) + parseInt(getFEDataBY_Monthly);
            total_BC = parseInt(total_BC) + parseInt(getBCDataBY_Monthly);

            liData += '<li class="list-group-item d-flex"><span class="text-semibold text-reagent-gray col-1 align-items-center justify-content-center">' + monthNames[d.getMonth() - i] + '</span><span class=" text-center text-semibold text-reagent-gray col-2 align-items-center justify-content-center">' + getYesterday_FE + ' </span> </span><span class=" text-center text-semibold text-reagent-gray col-1 align-items-center justify-content-center text-center">' + getFEDataBY_Monthly + '</span><span class="text-center text-semibold text-reagent-gray col-2 align-items-center justify-content-center">' + total_FE + '</span><span class="text-center text-semibold text-reagent-gray col-1 align-items-center justify-content-center">' + getYesterday_BC + '</span></span><span class="text-center text-semibold text-reagent-gray col-1 align-items-center justify-content-center">' + getBCDataBY_Monthly + '</span><span class="text-semibold text-reagent-gray col-2 text-center">' + total_BC + '</span><span class="text-semibold text-reagent-gray col-2 text-center">' + (parseInt(total_BC) + parseInt(total_FE)) + '</span></li>';

          }
        }


      }

      res.render('admin/admin-report-card', {
        'path': '../',
        "leftMenuType": middleware.checkLeftMenuFN(req, res),
        "title": 'Dashboard',
        'usrType': req.session.userType,
        "liData": liData,
        "state": states,
        "path": '../../'
      });

    } catch (error) {
      console.log(error);
    }
  }


  async fe_list_view(req, res, next) {
    try {
      var getAllUserData = await usersModel.aggregate([
        {
          $lookup: {
            from: "users_details",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userDetails"
          }
        },
        { $match: { status: 'active', user_type: /^bc$/i } },
        {
          $lookup: {
            from: "payment_successes",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userPaymentDetails"
          }
        },
        { $sort: { payment_status: -1 } },

        {
          $project: {
            _id: 1,
            mobile: 1,
            payment_status: 1,
            fullname: 1,
            user_type: 1,
            f_name: "$userDetails.f_name",
            m_name: "$userDetails.m_name",
            l_name: "$userDetails.l_name",
            city: "$userDetails.city",
            trans_date: "$userPaymentDetails.trans_date"

          }
        }
      ]);

      res.render('admin/fe-list-view', { 'path': '../', "leftMenuType": middleware.checkLeftMenuFN(), 'data': getAllUserData, title: 'List', usrType: req.session.userType });
    } catch (error) {

    }



  }

  // async list_FE_payouts(req, res, next) {
  //   try {
  //     const date = new Date(new Date());
  //     const c_month = date.toLocaleString('en-us', { month: 'short' });
  //     var fe_payoutListData = '';
  //     fe_payoutListData = await generatedPayoutsModel.aggregate([
  //       {
  //         $group: { _id: "$fe_user_id", bc_user_details: { $push: "$bc_user_details" }, fe_user_details: { $push: "$fe_user_details" }, ze_user_details: { $push: "$ze_user_details" }, fe_name: { $push: "$ze_user_details" }, fe_mobile: { $push: "$ze_user_details" }, uniqueValues: { $addToSet: "$fe_user_id" } }
  //       },
  //       {
  //         $match: {
  //           month: c_month.toLowerCase(),
  //           year: date.getFullYear(),
  //         }
  //       },
  //     ]);


  //     res.render('admin/fe-payout-gen', { status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "List Payout", 'path': '../../', usrType: req.session.userType, message: '', data: fe_payoutListData });
  //   } catch (error) {
  //     console.log(" create list payouts error message - " + error.message);
  //   }
  // }

  // async post_list_FE_payouts(req, res, next) {
  //   try {
  //     var data = req.body;
  //     var fe_payoutListData = '';
  //     var renderData = [];
  //     if (data.year && data.month) {
  //       const month = data.month

  //       fe_payoutListData = await generatedPayoutsModel.aggregate([
  //         {
  //           $group:
  //           {
  //             _id: "$fe_user_id",
  //             "totalAmount": { $sum: "$fe_payout_amount" },
  //             bc_user_details: { $push: "$bc_user_details" },
  //             fe_user_details: { $push: "$fe_user_details" },
  //             ze_user_details: { $push: "$ze_user_details" },
  //             //count: { $sum: 1 },
  //             // uniqueValues: {$addToSet: "$fe_user_id"}
  //           }
  //         },

  //       ]);
  //       console.log('-----+++------' + fe_payoutListData.length);
  //       fe_payoutListData.forEach((obj) => {
  //         console.log(obj.fe_user_details);
  //       });

  //     } else {
  //       //console.log('------ ELSE LOOP ----------');
  //       req.redirect('admin/fe-list-view');
  //     }

  //     return res.render('admin/fe-payout-gen', { status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "List Payout", 'path': '../../', usrType: req.session.userType, message: '', data: fe_payoutListData });
  //   } catch (error) {
  //     console.log(" create list payouts error message - " + error.message);
  //   }
  // }

  // async list_payouts(req, res, next) {
  //   try {
  //     const date = new Date(new Date());
  //     const c_month = date.toLocaleString('en-us', { month: 'short' });

  //     const payoutListData = await generatedPayoutsModel.find({month : c_month.toLowerCase(), year : date.getFullYear()});

  //     res.render('admin/payout-gen', { status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "List Payout", 'path': '../../', usrType: req.session.userType, message: '', data : payoutListData });
  //   } catch (error) {
  //     console.log(" create list payouts error message - " + error.message);
  //   }
  // }
  // async payouts_post_list(req, res, next) {
  //   try {
  //       var data = req.body;
  //       var payoutListData = '';

  //       if(data.year && data.month){
  //         const month = (data.month);
  //         payoutListData = await generatedPayoutsModel.find({month : month.toLowerCase(), year: data.year});

  //         res.render('admin/payout-gen', { status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Generate List Payout", 'path': '../../', usrType: req.session.userType, message: 'Please select all required feilds.', data : payoutListData });
  //       }else{
  //           req.redirect('admin/payout-gen');
  //       }




  //   } catch (error) {
  //     console.log(" create list payouts error message - " + error.message);
  //   }
  // }

  // async create_payouts(req, res, next) {
  //   try {
  //     var totalUploadedFiles = await payoutUploadModel.distinct('month');
  //     totalUploadedFiles = totalUploadedFiles.length;
  //     res.render('admin/create-payouts', { status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: '', total_inserted_count: 0, totalUploadedFiles: totalUploadedFiles });
  //   } catch (error) {
  //     console.log(" create payouts error message - " + error.message);
  //   }
  // }
  // async upload_payouts(req, res, next) {
  //   try {
  //     var pdata = req.body;

  //     let dir = "./public/upload/csv";
  //     let uploadCSVFile = req.files && req.files.csv_file ? req.files.csv_file : null;

  //     let csvuplod = middleware.csvFileUploadsFN(req.files, uploadCSVFile, dir);
  //     var status = 0;
  //     var csvPayoutData = [];
  //     var upload_status = '';
  //     var csvPayoutErrorData = [];
  //     var total_inserted_count = 0;
  //     var return_message = [];
  //     var totalUploadedFiles = await payoutUploadModel.distinct('month');
  //     totalUploadedFiles = totalUploadedFiles.length;

  //     if (csvuplod.status == 'success' && csvuplod.message.length > 0) {
  //       var filePath = paths.join(__dirname, '../../public/upload/csv/' + csvuplod.message);
  //       const csvUploadjsonArray = await csv().fromFile(filePath);

  //       //fs.createReadStream(__dirname+'/chart-of-accounts.csv').pipe(parser);
  //       if (csvUploadjsonArray.length > 0) {
  //         for (let i = 0; csvUploadjsonArray.length > i; i++) {
  //           var csvPAN = csvUploadjsonArray[i].pan;
  //           var csvAmount = parseInt((csvUploadjsonArray[i].amount) ? csvUploadjsonArray[i].amount : 0);
  //           if (csvPAN.trim().length == 10 && csvAmount > 0) {
  //             //if (csvPAN.trim().length > 9 && csvAmount > 0) {
  //             var panData = await kycModel.find({ pan_number: csvPAN.trim(), status: 'active' }).count();

  //             if (panData > 0 || panData) {
  //               //var check_record_exist = await payoutUploadModel.find({ pan_number: csvPAN, type: pdata.type.toLowerCase().trim(), month: pdata.month, year: pdata.year, status: "uploaded" }).count();

  //               //if (check_record_exist == 0) {

  //               var ff = await kycModel.findOne({ pan_number: csvPAN.trim(), status: 'active' });
  //               var uff = await usersModel.findById(ff.user_id);

  //               if (uff.referl_code == 'MITRADMIN001') {
  //                 upload_status += 'false';
  //                 csvPayoutErrorData.push({
  //                   'pan_number': csvPAN.trim(),
  //                   'amount': 'This Pan user is not MS. Its FE PAN Number.'
  //                 });
  //               } else {
  //                 total_inserted_count = parseInt(total_inserted_count) + 1;
  //                 upload_status += 'true';
  //                 csvPayoutData.push({
  //                   'pan_number': csvPAN.toUpperCase().trim(),
  //                   'amount': csvAmount,
  //                   'type': pdata.type.toLowerCase().trim(),
  //                   'month': pdata.month,
  //                   'year': pdata.year,
  //                   'status': 'updated'
  //                 });
  //               }

  //               // }
  //               // else{
  //               //   res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: [{ 'pan_number': "This month record is Uploaded.", "amount": '!' }], total_inserted_count: total_inserted_count });
  //               // }
  //             } else {
  //               upload_status += 'false';
  //               csvPayoutErrorData.push({
  //                 'pan_number': csvPAN.trim(),
  //                 'amount': csvAmount
  //               });
  //             }

  //           } else {
  //             return_message = [{ 'pan_number': "PAN Formate or Amount is not correct", "amount": csvPAN.trim() }];
  //             status = 0;
  //             next();
  //             //return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message, total_inserted_count: total_inserted_count, totalUploadedFiles: totalUploadedFiles });
  //           }
  //         }
  //       } else {
  //         return_message = [{ 'pan_number': "'Please choose valid csv file.'", "amount": '!' }];
  //         status = 0;
  //         next();
  //         //return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message, total_inserted_count: total_inserted_count, totalUploadedFiles: totalUploadedFiles});
  //       }
  //       if (!upload_status.includes("false")) {

  //         var insrtPayouts = await payoutUploadModel.insertMany(csvPayoutData);
  //         //console.log(insrtPayouts);
  //         if (insrtPayouts) {
  //           res.redirect('./list-payout');
  //         }
  //       } else {
  //         return_message = csvPayoutErrorData;
  //         status = 0;
  //         next();
  //         //return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: csvPayoutErrorData, total_inserted_count: total_inserted_count, totalUploadedFiles: totalUploadedFiles });
  //       }
  //     } else {
  //       status = 0;
  //       return_message = [{ 'pan_number': "'Please choose csv file.'", "amount": '!' }];
  //       //return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: [{ 'pan_number': "'Please choose csv file.'", "amount": '!' }], total_inserted_count: total_inserted_count, totalUploadedFiles: totalUploadedFiles});
  //       next();
  //     }
  //     console.log('++++++++= ' + totalUploadedFiles);
  //     return res.render('admin/create-payouts', { status: status, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message, total_inserted_count: total_inserted_count, totalUploadedFiles: totalUploadedFiles });

  //   } catch (error) {
  //     console.log('-------  create_payout error section  ----------');
  //     console.log(error);
  //   }
  // }

  // async generate_payouts(req, res, next) {
  //   try {
  //     var allPayoutData = await payoutUploadModel.aggregate([
  //       { "$group": { "_id": "$pan_number", sum: { $sum: "$amount" } } },
  //       { "$match": { "_id": { "$ne": null } } },
  //       { "$project": { "pan_number": "$_id", "_id": 0, "sum": 1 } }
  //     ]);




  //     const fePercent = 2;
  //     const zePercent = 0.22;

  //     await Promise.all(allPayoutData.map(async (obj) => {
  //       var bcTotalAmount = 0;
  //       var feTotalAmount = 0;
  //       var zeTotalAmount = 0;
  //       var aeTotalAmount = 0;
  //       let bc_banking_amount = await payoutUploadModel.findOne({ pan_number: obj.pan_number, type: 'banking' });

  //       let bankingAmounts = (bc_banking_amount) ? bc_banking_amount.amount : 0;
  //       bcTotalAmount = parseInt(obj.sum) - parseInt(bankingAmounts);

  //       // -----------    Calculate FE Payuots -----------  
  //       let fe_incentive = (parseInt(obj.sum) * parseInt(fePercent)) / 100;
  //       feTotalAmount = parseInt(feTotalAmount) + parseInt(fe_incentive);
  //       var uploadedPAN = obj.pan_number;
  //       let get_bc_kyc_data = await kycModel.findOne({ pan_number: { $regex: new RegExp(uploadedPAN, "i") } }); //, { $regex : /obj.pan_number$/i }

  //       var bc_Details = await usersModel.findById(get_bc_kyc_data.user_id);

  //       var bc_FE_Details = await usersModel.findOne({ referrer_code: bc_Details.referl_code });
  //       // -----------------------------------       ------------------- 


  //       // -----------    Calculate ZE Payuots ----------- 
  //       let getZEDetails = await zeModel.findOne({ user_id: bc_FE_Details._id, status: 'active' });
  //       let ze_incentive = (parseInt(obj.sum) * parseInt(zePercent)) / 100;
  //       zeTotalAmount = parseInt(zeTotalAmount) + parseInt(ze_incentive);
  //       let bc_ZE_Details = null;
  //       if (getZEDetails) { // enter when record send for ZE
  //         bc_ZE_Details = await usersModel.findById(getZEDetails.ze_user_id);
  //       } else {
  //         bc_ZE_Details = null;
  //       }

  //       bcTotalAmount = (bcTotalAmount) ? bcTotalAmount : 0;
  //       feTotalAmount = (feTotalAmount) ? feTotalAmount : 0;
  //       zeTotalAmount = (zeTotalAmount) ? zeTotalAmount : 0;
  //       aeTotalAmount = (aeTotalAmount) ? aeTotalAmount : 0;

  //       await generatedPayoutsModel.create({
  //         bc_user_id: bc_Details._id,
  //         fe_user_id: bc_FE_Details._id,
  //         ze_user_id: (bc_ZE_Details) ? bc_ZE_Details._id : null,
  //         bc_name: bc_Details.fullname,
  //         bc_mobile: bc_Details.mobile,
  //         fe_name: bc_Details.fullname,
  //         fe_mobile: bc_FE_Details.mobile,
  //         ze_name: (bc_ZE_Details) ? bc_ZE_Details.fullname : 'N/A',
  //         ze_mobile: (bc_ZE_Details) ? bc_ZE_Details.mobile : 'N/A',
  //         bc_user_details: bc_Details, //JSON.stringify(),
  //         fe_user_details: bc_FE_Details, //JSON.stringify(bc_FE_Details),
  //         ze_user_details: bc_ZE_Details, //JSON.stringify(bc_ZE_Details),
  //         bc_payout_amount: parseInt(bcTotalAmount),
  //         fe_payout_amount: parseInt(feTotalAmount),
  //         ze_payout_amount: parseInt(zeTotalAmount),
  //         ae_payout_amount: parseInt(aeTotalAmount),
  //         month: "jan", //data.month,
  //         year: "2021" //data.year
  //       });

  //     }));
  //     //console.log(allPayoutData);

  //     res.redirect('./list-payouts');
  //   } catch (error) {
  //     console.log('+++++++++++++++++++++');
  //     console.log(error.message);
  //   }

  // }











  // async checkPANExistFN (pan, type, month, year){
  //     const panData = await kycModel.findOne({pan_number: pan});

  //     if(panData){
  //       const check_record_exist = await payoutUploadModel.findOne({pan_number: pan, type:type, month:month, year:year, status: "uploaded"});
  //       return ((check_record_exist) ? false : true);

  //     }

  // }


  async currenthMDt(states, lts, gts, uType) {
    try {
      var rtdt = await usersModel.aggregate([
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },    // $unwind used for getting data in object or for one record only
        {
          $match: {
            status: 'active',
            payment_status: 'paid',
            user_type: uType,
            'user_info.state': states,
            created_at: {
              $lt: lts,
              $gte: gts
            },
          }
        },
        { $group: { _id: null, getCount: { $sum: 1 } } },
        { $project: { _id: 0 } }
        //{ $project: { _id: 1, fullname:1, created_at:1, user_type:1} }

      ]);
      return ("" + rtdt.length > 0 ? rtdt[0].getCount : 0);
    } catch (error) {
      console.log(error.message);
    }


  }

  async pastMonthGetData(states, i, uType) {
    try {

      var mdt = await usersModel.aggregate([
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },
        { $unwind: "$user_info" },     // $unwind used for getting data in object or for one record only
        {
          $match: {
            status: 'active',
            payment_status: 'paid',
            user_type: uType,
            'user_info.state': states,
            $expr: {
              $and: [
                { $eq: [{ $year: "$created_at" }, { $year: new Date() }] },
                { $eq: [i, { $subtract: [{ $month: new Date() }, { $month: "$created_at" }] }] },
              ]
            }
          }
        },

        { $group: { _id: null, monthlyCount: { $sum: 1 } } },
        { $project: { _id: 0 } }
        //{ $project: { _id: 1, fullname:1, created_at:1, user_type:1 } }


      ]);

      //console.log(mdt);
      return ("" + mdt.length > 0 ? mdt[0].monthlyCount : 0);

    } catch (error) {

    }
  }




  async feBcSheet(req, res) {
    const CsvParser = require("json2csv").Parser;
    try {
      const bcFedetails = await usersModel.aggregate([
        {
          $lookup: {
            from: "users_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_info"         // alias for userinfo table
          }
        },
        { $unwind: "$user_info" },
        {
          $lookup: {
            from: "kyc_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_kyc"         // alias for userinfo table
          }
        },
        { $unwind: "$user_kyc" },
        {
          $match: {
            status: 'active',
            payment_status: 'paid',
            user_type: { $in: ["agent", "bc"] }
          }
        },
        {
          $project: {
            _id: 1,
            fullname: { $concat: ["$user_info.f_name", " ", "$user_info.m_name", " ", "$user_info.l_name"] },
            created_at: 1,
            user_type: 1,
            address: { $concat: ["$user_info.house_number", " ", "$user_info.street"] },
            city: "$user_info.city",
            state: "$user_info.state",
            pincode: "$user_info.pin_code",
            mobile: 1,
            email: 1,
            aadharno: "$user_kyc.aadhar_number",
            panno: "$user_kyc.pan_number",
          }
        }

      ]);

      //console.log(bcFedetails);

      let bcFeData = [];

      bcFedetails.map((data, index) => {
        bcFeData.push({
          's.no': index + 1,
          'company_name': "Mitr Sewa ",
          'company_type': 'Pvt Ltd',
          'name_of_person': data.fullname.toUpperCase(),
          'address': data.address,
          'city': data.city.toUpperCase(),
          'pincode': data.pincode,
          'state': data.state,
          'contact_no': data.mobile,
          'email_id': data.email,
          'aadhar_no': data.aadharno,
          'pan_no': data.panno,
          'gst_no': ""
        });

      });
      //console.log(bcFeData);
      const csvFields = ["Company Name", "Company Type", "Name of Person", "Address", "City", "Pin Code", "State", "Contact No", "Email Id", "Aadhar Number", "PAN Number",];
      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(bcFeData);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=shivendra-csv-data.csv");
      res.status(200).end(csvData);

    } catch (error) {
      console.log(error);
    }

  }


  async getEmptyAccountNumber(req, res) {
    try {
      const bcFedetails = await usersModel.aggregate([
        {
          $lookup: {
            from: "kyc_details",       // other table name
            localField: "_id",   // name of users table field
            foreignField: "user_id", // name of userinfo table field
            as: "user_kyc"         // alias for userinfo table
          }
        },
        { $unwind: "$user_kyc" },
        {
          $match: {
            status: 'active',
            payment_status: 'paid',
            "user_kyc.account_number": { "$eq": null }
          }
        },
        {
          $project:
          {
            _id: 1,
            fullname: 1,
            mobile: 1,
            email: 1,
            bank_name: "$user_kyc.bank_name",
            ifsc_code: "$user_kyc.ifsc_code",
            account_number: "$user_kyc.account_number"
          }
        }
      ]);
      let bcFeData = [];

      bcFedetails.map((data, index) => {
        bcFeData.push({
          'name_of_person': data.fullname.toUpperCase(),
          'contact_no': data.mobile,
          'email_id': data.email,
          'bank_name': data.bank_name,
          'ifsc_code': data.ifsc_code,
          'account_number': data.account_number
        });

      });
      //console.log(bcFeData);
      const csvFields = ["Name of Person", "Contact No", "Email Id", "Bank Name", "IFSC CODE", "Account Number"];
      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(bcFeData);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=account-Number-empty-csv-data.csv");
      res.status(200).end(csvData);

    } catch (error) {
      console.log(error);
    }

  }


  //  ------------  Abhishek Code start from here -------------
  async bc_list_view_mis(req, res, next) {

    let state = req.params.state;

    let matchObj = {};
    if (state == "all") {
      matchObj = {
        status: 'active',
        user_type: 'bc',
      };
    } else {
      matchObj = {
        status: 'active',
        user_type: 'bc',
        'userDetails.state': state
      };
    }

    try {
      var getAllUserData = await usersModel.aggregate([
        {
          $lookup: {
            from: "users_details",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userDetails"
          }
        },
        { $match: matchObj },
        {
          $lookup: {
            from: "payment_successes",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userPaymentDetails"
          }
        },
        {
          $lookup: {
            from: "kyc_details",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userKycDetails"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "referl_code",    // field in the orders collection
            foreignField: "referrer_code",  // field in the items collection
            as: "feDetails"
          }
        },
        { $sort: { payment_status: -1 } },

        {
          $project: {
            _id: 1,
            mobile: 1,
            payment_status: 1,
            fullname: 1,
            user_type: 1,
            referrer_code: 1,
            referl_code: 1,
            email: 1,
            f_name: "$userDetails.f_name",
            m_name: "$userDetails.m_name",
            l_name: "$userDetails.l_name",
            city: "$userDetails.city",
            state: "$userDetails.state",
            pincode: "$userDetails.pin_code",
            trans_date: "$userPaymentDetails.trans_date",
            pan_no: "$userKycDetails.pan_number",
            aadhar_no: "$userKycDetails.aadhar_number",
            fe_mobile: "$feDetails.mobile",
            fe_fullname: "$feDetails.fullname",
          }
        }
      ]);

      res.render('admin/bc-list-view-mis', { 'path': '../../', "leftMenuType": middleware.checkLeftMenuFN(), 'data': getAllUserData, title: 'List', usrType: req.session.userType, 'state': state });
    } catch (error) {
      console.log(error);
    }



  }
  async fe_list_view_mis(req, res, next) {

    let state = req.params.state;
    let matchObj = {};
    if (state == "all") {
      matchObj = {
        status: 'active',
        user_type: 'agent',
      };
    } else {
      matchObj = {
        status: 'active',
        user_type: 'agent',
        'userDetails.state': state
      };
    }

    try {
      var getAllUserData = await usersModel.aggregate([
        {
          $lookup: {
            from: "users_details",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userDetails"
          }
        },
        { $match: matchObj },
        {
          $lookup: {
            from: "payment_successes",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userPaymentDetails"
          }
        },
        {
          $lookup: {
            from: "kyc_details",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userKycDetails"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "referl_code",    // field in the orders collection
            foreignField: "referrer_code",  // field in the items collection
            as: "feDetails"
          }
        },
        { $sort: { payment_status: -1 } },

        {
          $project: {
            _id: 1,
            mobile: 1,
            payment_status: 1,
            fullname: 1,
            user_type: 1,
            referrer_code: 1,
            referl_code: 1,
            email: 1,
            f_name: "$userDetails.f_name",
            m_name: "$userDetails.m_name",
            l_name: "$userDetails.l_name",
            city: "$userDetails.city",
            state: "$userDetails.state",
            pincode: "$userDetails.pin_code",
            trans_date: "$userPaymentDetails.trans_date",
            pan_no: "$userKycDetails.pan_number",
            aadhar_no: "$userKycDetails.aadhar_number",
            fe_mobile: "$feDetails.mobile",
            fe_fullname: "$feDetails.fullname",
          }
        }
      ]);

      res.render('admin/fe-list-view-mis', { 'path': '../../', "leftMenuType": middleware.checkLeftMenuFN(), 'data': getAllUserData, title: 'List', usrType: req.session.userType, 'state': state });
    } catch (error) {

    }



  }
  async bc_list_view_export(req, res, next) {
    try {
      let state = req.params.state;
      let matchObj = {};
      if (state == "all") {
        matchObj = {
          status: 'active',
          user_type: 'bc',
        };
      } else {
        matchObj = {
          status: 'active',
          user_type: 'bc',
          'userDetails.state': state
        };
      }

      var getAllUserData = await usersModel.aggregate([
        {
          $lookup: {
            from: "users_details",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userDetails"
          }
        },
        { $unwind: "$userDetails" },
        { $match: matchObj },
        {
          $lookup: {
            from: "payment_successes",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userPaymentDetails"
          }
        },
        { $unwind: "$userPaymentDetails" },
        {
          $lookup: {
            from: "kyc_details",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userKycDetails"
          }
        },
        { $unwind: "$userKycDetails" },
        {
          $lookup: {
            from: "users",
            localField: "referl_code",    // field in the orders collection
            foreignField: "referrer_code",  // field in the items collection
            as: "feDetails"
          }
        },
        { $unwind: "$feDetails" },
        { $sort: { payment_status: -1 } },

        {
          $project: {
            _id: 1,
            mobile: 1,
            payment_status: 1,
            fullname: 1,
            user_type: 1,
            referrer_code: 1,
            referl_code: 1,
            email: 1,
            f_name: "$userDetails.f_name",
            m_name: "$userDetails.m_name",
            l_name: "$userDetails.l_name",
            city: "$userDetails.city",
            state: "$userDetails.state",
            pincode: "$userDetails.pin_code",
            trans_date: "$userPaymentDetails.trans_date",
            pan_no: "$userKycDetails.pan_number",
            aadhar_no: "$userKycDetails.aadhar_number",
            fe_mobile: "$feDetails.mobile",
            fe_fullname: "$feDetails.fullname",
          }
        }
      ]);
      //console.log(getAllUserData);

      let mitrsewakdata = [];

      getAllUserData.forEach((obj) => {
        let createdDt = middleware.getFormattedDateFN(obj.trans_date);

        var d = new Date(obj.trans_date.toString());
        var paymentDT = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();

        const { _id, email, mobile, referl_code, referrer_code, payment_status, user_type, fullname, f_name, m_name, l_name, city, state, pincode, trans_date, pan_no, aadhar_no, fe_mobile, fe_fullname } = obj;

        mitrsewakdata.push({
          fullname, mobile, city, pincode, pan_no, aadhar_no, paymentDT, referrer_code, fe_fullname, fe_mobile
        });
      });

      //console.log(mitrsewakdata); return;

      const csvFields = ["Name", "Mobile", "District", "Pin Code", "Pan No", "Aadhar", "Trans", "Referrer Code", "Referral Code", "FE Name", "FE Mobile"];

      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(mitrsewakdata);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=mitrsewak.csv");
      res.status(200).end(csvData);

    } catch (error) {
      console.log(`Error - ${error} `);
    }

  }
  async fe_list_view_export(req, res, next) {

    let state = req.params.state;
    let matchObj = {};
    if (state == "all") {
      matchObj = {
        status: 'active',
        user_type: 'agent',
      };
    } else {
      matchObj = {
        status: 'active',
        user_type: 'agent',
        'userDetails.state': state
      };
    }

    try {
      var getAllUserData = await usersModel.aggregate([
        {
          $lookup: {
            from: "users_details",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userDetails"
          }
        },
        { $match: matchObj },
        {
          $lookup: {
            from: "payment_successes",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userPaymentDetails"
          }
        },
        {
          $lookup: {
            from: "kyc_details",
            localField: "_id",    // field in the orders collection
            foreignField: "user_id",  // field in the items collection
            as: "userKycDetails"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "referl_code",    // field in the orders collection
            foreignField: "referrer_code",  // field in the items collection
            as: "feDetails"
          }
        },
        { $sort: { payment_status: -1 } },

        {
          $project: {
            _id: 1,
            mobile: 1,
            payment_status: 1,
            fullname: 1,
            user_type: 1,
            referrer_code: 1,
            referl_code: 1,
            email: 1,
            f_name: "$userDetails.f_name",
            m_name: "$userDetails.m_name",
            l_name: "$userDetails.l_name",
            city: "$userDetails.city",
            state: "$userDetails.state",
            pincode: "$userDetails.pin_code",
            trans_date: "$userPaymentDetails.trans_date",
            pan_no: "$userKycDetails.pan_number",
            aadhar_no: "$userKycDetails.aadhar_number",
            fe_mobile: "$feDetails.mobile",
            fe_fullname: "$feDetails.fullname",
          }
        }
      ]);
      // console.log(getAllUserData); 
      // console.log("------------------------");

      let msdata = [];

      getAllUserData.forEach((obj) => {
        let createdDt = middleware.getFormattedDateFN(obj.trans_date);

        var d = new Date(obj.trans_date.toString());
        var paymentDT = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();

        const { _id, email, mobile, referl_code, referrer_code, payment_status, user_type, fullname, f_name, m_name, l_name, city, state, pincode, trans_date, pan_no, aadhar_no, fe_mobile, fe_fullname } = obj;

        msdata.push({
          fullname, email, mobile, city, pincode, pan_no, aadhar_no, paymentDT, referrer_code, fe_fullname, fe_mobile
        });
      });

      const csvFields = ["Name", "Mobile", "District", "Pin Code", "Pan No", "Aadhar", "Trans", "Referrer Code", "Referral Code", "FE Name", "FE Mobile"];

      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(msdata);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=fedata.csv");
      res.status(200).end(csvData);

    } catch (error) {
      console.log(error);
    }

  }
  async adminBimaReports(req, res) {
    try {

      if (req.params.state) {
        / Fetch all Fe from Database /

        const fedetails_mspl = await usersModel.aggregate([
          {
            $lookup: {
              from: "users_details",       // other table name
              localField: "_id",   // name of users table field
              foreignField: "user_id", // name of userinfo table field
              as: "user_info"         // alias for userinfo table
            }
          },
          { $unwind: "$user_info" },
          {
            $lookup: {
              from: "kyc_details",       // other table name
              localField: "_id",   // name of users table field
              foreignField: "user_id", // name of userinfo table field
              as: "user_kyc"         // alias for userinfo table
            }
          },
          { $unwind: "$user_kyc" },
          {
            $match: {
              status: 'active',
              payment_status: 'paid',
              user_type: { $in: ["agent"] },
              'user_info.state': req.params.state,
            }
          },
          {
            $project: {
              _id: 1,
              fullname: { $concat: ["$user_info.f_name", " ", "$user_info.m_name", " ", "$user_info.l_name"] },
              created_at: 1,
              user_type: 1,
              referrer_code: 1,
              address: { $concat: ["$user_info.house_number", " ", "$user_info.street"] },
              city: "$user_info.city",
              state: "$user_info.state",
              pincode: "$user_info.pin_code",
              mobile: 1,
              email: 1,
              aadharno: "$user_kyc.aadhar_number",
              panno: "$user_kyc.pan_number",
            }
          }

        ]);

        / for api only /
        var mobile_array = [];
        var state_array = [];
        var getFeData = [];

        fedetails_mspl.forEach(function (element, index) {
          mobile_array.push(Number(element.mobile));
          state_array.push(element.state);
          getFeData.push({
            fullname: element.fullname,
            mobile: element.mobile,
            address: element.address,
            city: element.city,
            state: element.state,
            pincode: element.pincode,
            id: element._id,
            email: element.email,
            aadharno: element.aadharno,
            panno: element.panno,
            referrercode: element.referrer_code
          });
        })


        //console.log(mobile_array); return;

        if (mobile_array.length > 0) {

          const bimaDetail = await bimaModel.find({ mobile: { $in: mobile_array }, "clientdata.policy_amount": "410" }, (err, result) => {
            if (err) {
              //console.log(`--------------------`);
              //res.send(err);
            } else {
              //console.log(`---------=====-----------`);
              //res.json(result);
            }
          });
          //console.log(mobile_array); return;
          const bimaDetails = await bimaModel.aggregate([

            {
              $lookup:
              {
                from: "bimadatas",
                localField: "_id",
                foreignField: "_id",
                as: "todaydata"
              },
            },
            { $unwind: "$todaydata" },
            {
              $match:
              {
                mobile: { $in: mobile_array },
                //"todaydata.clientdata.policy_date": "2021-03-09"

              },
            },
            {
              $project: {
                name: 1,
                mobile: 1,
                state: 1,
                clients: 1,
                clientdata: 1,
                yesterday_clients: 1,
                previous_month_clients: 1,
                //names:{$cond: {if:{ $gte: [ "$qty", 250 ] } }}
              }
            }
          ],
            function (err, response) {
              if (err) throw err;
              if (!response) {

                res.status(200).json({ success: false, message: 'Somthing went wrong. Please contact admin.' });

              }
              else {
                //console.log(response); return;
                res.render('admin/fe-bima-admin', { status: 1, title: "Bima Portal Fe Report", state: req.params.state, data: response, 'path': '../../', usrType: req.session.userType })

              }
            });




        } else {
          console.log(`Mobile No not found.`);

          res.render('admin/fe-bima-admin', { status: 1, title: "Bima Portal Fe Report", state: req.params.state, data: [], 'path': '../../', usrType: req.session.userType })

        }

      } else {
        console.log(`State is not valid please provide State`); return;
      }
    } catch (error) {
      console.log(error);
    }

  }

  async adminBimaBCReports(req, res) {
    try {

      if (req.params.state) {
        // / Fetch all Fe from Database /

        const fedetails_mspl = await usersModel.aggregate([
          {
            $lookup: {
              from: "users_details",       // other table name
              localField: "_id",   // name of users table field
              foreignField: "user_id", // name of userinfo table field
              as: "user_info"         // alias for userinfo table
            }
          },
          { $unwind: "$user_info" },
          {
            $lookup: {
              from: "kyc_details",       // other table name
              localField: "_id",   // name of users table field
              foreignField: "user_id", // name of userinfo table field
              as: "user_kyc"         // alias for userinfo table
            }
          },
          { $unwind: "$user_kyc" },
          {
            $match: {
              status: 'active',
              payment_status: 'paid',
              user_type: { $in: ["bc"] },
              'user_info.state': req.params.state,
              referl_code: req.params.referrerCode
            }
          },
          {
            $project: {
              _id: 1,
              fullname: { $concat: ["$user_info.f_name", " ", "$user_info.m_name", " ", "$user_info.l_name"] },
              created_at: 1,
              user_type: 1,
              address: { $concat: ["$user_info.house_number", " ", "$user_info.street"] },
              city: "$user_info.city",
              state: "$user_info.state",
              pincode: "$user_info.pin_code",
              mobile: 1,
              email: 1,
              aadharno: "$user_kyc.aadhar_number",
              panno: "$user_kyc.pan_number",
            }
          }

        ]);

        // / for api only /
        var mobile_array = [];
        var getFeData = [];

        fedetails_mspl.forEach(function (element, index) {
          mobile_array.push(element.mobile);
          getFeData.push({
            mobile: element.mobile,
            address: element.address,
            city: element.city,
            state: element.state,
            pincode: element.pincode,
            id: element._id,
            email: element.email,
            aadharno: element.aadharno,
            panno: element.panno,
          });
        })


        if (mobile_array.length > 0) {

          / Api Call start for Bima portal Data /
          var request = require("request");
          var options = {
            method: 'POST',
            url: 'https://www.mitrbima.com/api/agent-policies',
            headers:
            {
              'postman-token': '250c7f14-db6a-122e-194f-867f87b39fef',
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: 'Basic bWl0cmJpbWE6bWl0cnNld2FAbWl0cmJpbWE='
            },
            body: { mobile_number: mobile_array },
            json: true
          };

          request(options, function (error, response, body) {
            if (error) throw new Error(error);
            var perArr = [];
            if (body.status == true) {
              body.data.forEach(function (data, index) {
                if (!data.error) {
                  if (data.mobile == getFeData[index].mobile) {
                    perArr.push({
                      mobile: data.mobile,
                      total_policies: data.total_policies,
                      policy_410: data.policy_410,
                      policy_630: data.policy_630,
                      today_total_policy: data.today_total_policy,
                      today_policy_410: data.today_policy_410,
                      today_policy_630: data.today_policy_630,

                      address: getFeData[index].address,
                      city: getFeData[index].city,
                      state: getFeData[index].state,
                      pincode: getFeData[index].pincode,
                      id: getFeData[index].id,
                      email: getFeData[index].email,
                      aadharno: getFeData[index].aadharno,
                      panno: getFeData[index].panno,

                    });
                  }

                }

              });
            }
            / Result /
            //console.log(perArr); return;


          });

          / Api Call Ends /

        } else {
          //console.log(`No fe data avaliable`);
          //console.log(mobile_array); 
          return false;
        }

      } else {
        //console.log(`State is not valid please provide State`); 
        return false;
      }
    } catch (error) {
      console.log(error);
    }

  }
  async cronForBima(req, res) {

    try {

      var apiarray = [];
      var request = require("request");
      var options = {
        method: 'GET',
        url: 'https://www.mitrbima.com/api/agent-policy-details',
        headers:
        {
          'postman-token': '07750e55-da06-2bea-bb82-d23ac062e991',
          'cache-control': 'no-cache',
          authorization: 'Basic bWl0cmJpbWE6bWl0cnNld2FAbWl0cmJpbWE='
        }
      };

      request(options, async function (error, response, body) {
        if (error) {
          throw new Error(error);
        } else {
          try {
            var b_data = JSON.parse(body);
            if (b_data.status == true) {
              var policy_agent_data = b_data.data;
              //console.log(policy_agent_data); return;
              for (var i in policy_agent_data) {

                apiarray.push(
                  {
                    name: policy_agent_data[i].name,
                    mobile: policy_agent_data[i].mobile,
                    state: policy_agent_data[i].state,
                    clients: policy_agent_data[i].clients,
                    clientdata: policy_agent_data[i].clientdata,
                    yesterday_clients: policy_agent_data[i].yesterday_clients,
                    previous_month_clients: policy_agent_data[i].previous_month_clients,
                  });
              }
              const delOldBima = await bimaModel.remove();

              //console.log(delOldBima); return false;

              const resultdat = await bimaModel.insertMany(apiarray);
              //console.log(apiarray.length);
              res.redirect(req.header('Referer'));



            }
          } catch (error) {
            //console.log('----------- inner error -----');
            console.log(error);
          }

        }
      });

    } catch (error) {
      //console.log("outer error");
      console.log(error);
    }


  }

  async bimaStateWise(req, res) {

    let stateData = req.params.state;

    try {

      const bimadata = await bimaModel.aggregate([
        {
          $group: {
            _id: "$state",
            data: {
              $push: "$$ROOT"
            }
          }
        }
      ]);



      if (bimadata.length > 0) {

        let statedata = [];

        bimadata.forEach((value, index) => {

          let clientdata = [];
          let yesData = [];
          let thisMon = [];

          value.data.map((res, ind) => {
            clientdata.push(res.clients);
            yesData.push(res.yesterday_clients);
            thisMon.push(res.previous_month_clients);
          });

          statedata.push({
            'state': value._id,
            'total_clients': clientdata.reduce((a, b) => a + b, 0),
            'yesterday_clients': yesData.reduce((a, b) => a + b, 0),
            'previous_month_clients': thisMon.reduce((a, b) => a + b, 0),
          });

        });

        res.render('admin/state-wise-bima', { status: 1, title: "Bima Portal State wise", state: stateData, data: statedata, 'path': '../../', usrType: req.session.userType })


      } else {
        console.log(`No Data Avaliable`);
        res.render('admin/state-wise-bima', { status: 1, title: "Bima Portal State wise", state: stateData, data: {}, 'path': '../../', usrType: req.session.userType })
      }

    } catch (error) {
      console.log("------------Error Array-----------");
      console.log(error);
    }


  }


  async adminBimaReportsCsv(req, res) {
    try {

      if (req.params.state) {
        / Fetch all Fe from Database /

        const fedetails_mspl = await usersModel.aggregate([
          {
            $lookup: {
              from: "users_details",       // other table name
              localField: "_id",   // name of users table field
              foreignField: "user_id", // name of userinfo table field
              as: "user_info"         // alias for userinfo table
            }
          },
          { $unwind: "$user_info" },
          {
            $lookup: {
              from: "kyc_details",       // other table name
              localField: "_id",   // name of users table field
              foreignField: "user_id", // name of userinfo table field
              as: "user_kyc"         // alias for userinfo table
            }
          },
          { $unwind: "$user_kyc" },
          {
            $match: {
              status: 'active',
              payment_status: 'paid',
              user_type: { $in: ["agent"] },
              'user_info.state': req.params.state,
            }
          },
          {
            $project: {
              _id: 1,
              fullname: { $concat: ["$user_info.f_name", " ", "$user_info.m_name", " ", "$user_info.l_name"] },
              created_at: 1,
              user_type: 1,
              referrer_code: 1,
              address: { $concat: ["$user_info.house_number", " ", "$user_info.street"] },
              city: "$user_info.city",
              state: "$user_info.state",
              pincode: "$user_info.pin_code",
              mobile: 1,
              email: 1,
              aadharno: "$user_kyc.aadhar_number",
              panno: "$user_kyc.pan_number",
            }
          }

        ]);

        / for api only /
        var mobile_array = [];
        var state_array = [];
        var getFeData = [];

        fedetails_mspl.forEach(function (element, index) {
          mobile_array.push(Number(element.mobile));
          state_array.push(element.state);
          getFeData.push({
            fullname: element.fullname,
            mobile: element.mobile,
            address: element.address,
            city: element.city,
            state: element.state,
            pincode: element.pincode,
            id: element._id,
            email: element.email,
            aadharno: element.aadharno,
            panno: element.panno,
            referrercode: element.referrer_code
          });
        })


        //console.log(mobile_array); return;

        if (mobile_array.length > 0) {

          const bimaDetails = await bimaModel.aggregate([

            {
              $lookup:
              {
                from: "bimadatas",
                localField: "_id",
                foreignField: "_id",
                as: "todaydata"
              },
            },
            { $unwind: "$todaydata" },
            {
              $match:
              {
                mobile: { $in: mobile_array },
                //"todaydata.clientdata.policy_date": "2021-03-09"

              },
            },
            {
              $project: {
                name: 1,
                mobile: 1,
                state: 1,
                clients: 1,
                clientdata: 1,
                yesterday_clients: 1,
                previous_month_clients: 1,
                //names:{$cond: {if:{ $gte: [ "$qty", 250 ] } }}
              }
            }
          ],
            function (err, response) {
              if (err) throw err;
              if (!response) {

                res.status(200).json({ success: false, message: 'Somthing went wrong. Please contact admin.' });

              }
              else {
                //console.log(response); return;

                let statewisefe = [];
                //console.log(response);
                response.forEach((obj) => {

                  const { _id, clientdata, name, mobile, state, clients, yesterday_clients, previous_month_clients } = obj;
                  statewisefe.push({ name, mobile, state, yesterday_clients, previous_month_clients, clients });
                });
                //console.log(statewisefe); return;

                const csvFields = ["Full Name", "Mobile", "State", "Yesterday Policy", "Previous Month Policy", "Total Policies"];

                const csvParser = new CsvParser({ csvFields });
                const csvData = csvParser.parse(statewisefe);

                res.setHeader("Content-Type", "text/csv");
                res.setHeader("Content-Disposition", "attachment; filename=feBimaReport.csv");
                res.status(200).end(csvData);


                //res.render('admin/fe-bima-admin',{status: 1, title: "Bima Portal Fe Report",state:req.params.state, data:response,  'path': '../../', usrType:req.session.userType})

              }
            });




        } else {
          // console.log(`Mobile No not found.`);

          res.render('admin/fe-bima-admin', { status: 1, title: "Bima Portal Fe Report", state: req.params.state, data: [], 'path': '../../', usrType: req.session.userType })

        }

      } else {
        // console.log(`State is not valid please provide State`); 
        return;
      }
    } catch (error) {
      console.log(error);
    }

  }

  async list_payouts(req, res, next) {
    try {

      let year = "";
      let month = "";
      if ((typeof req.query.year != "undefined" && typeof req.query.month != "undefined")) {
        month = req.query.month;
        year = req.query.year;

      } else {
        const date = new Date(new Date());
        const c_month = date.toLocaleString('en-us', { month: 'short' });
        month = c_month.toLowerCase();
        year = date.getFullYear();
      }

      if ((year != "" || year != null) && (month != "" || month != null)) {

        //payoutListData = await generatedPayoutsModel.find({month : month.toLowerCase(), year: data.year});

        const payoutListData = await generatedPayoutsModel.aggregate([
          {
            '$match': {
              'month': month.toLowerCase(),
              'year': year
            }
          }, {
            '$lookup': {
              'from': 'kyc_details',
              'localField': 'bc_user_id',
              'foreignField': 'user_id',
              'as': 'kyc_details'
            }
          }, {
            '$unwind': {
              'path': '$kyc_details'
            }
          }
        ]);

        res.render('admin/payout-gen', { status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Generate List Payout", 'path': '../../', usrType: req.session.userType, message: 'Please select all required feilds.', year: year, month: month, data: payoutListData });
      } else {
        req.redirect('admin/list-payouts');
      }

    } catch (error) {
      console.log(" create list payouts error message - " + error.message);
    }
  }

  async create_payouts(req, res, next) {
    try {
      //const errMsg = await req.consumeFlash('errorMsg');

      var totalUploadedFiles = await payoutUploadModel.distinct('month');
      //console.log(totalUploadedFiles);
      totalUploadedFiles = totalUploadedFiles.length;
      res.render('admin/create-payouts', {

        status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res),
        title: "Upload Payout", 'path': '../../', usrType: req.session.userType,
        message: '',
        totalUploadedFiles: totalUploadedFiles,

      });

    } catch (error) {
      console.log(" create payouts error message - " + error.message);
    }
  }

  async upload_payouts(req, res, next) {
    try {
      var pdata = req.body;

      const chkExist = await payoutUploadModel.find({
        month: pdata.month.toLowerCase().trim(),
        year: pdata.year,
        type: pdata.type.toLowerCase().trim()
      }).count();
      //console.log(chkExist); 
      if (chkExist > 0) {
        return_message = [{ 'pan_number': `This ${pdata.month} month data is already Uploaded.`, "amount": 0 }];
        status = 0;
      } else {
        let dir = "./public/upload/csv";
        let uploadCSVFile = req.files && req.files.csv_file ? req.files.csv_file : null;

        let csvuplod = middleware.csvFileUploadsFN(req.files, uploadCSVFile, dir);
        var status = 0;
        var csvPayoutData = [];
        var upload_status = '';
        var csvPayoutErrorData = [];
        var total_inserted_count = 0;
        var return_message = [];
        var totalUploadedFiles = await payoutUploadModel.distinct('month');
        totalUploadedFiles = totalUploadedFiles.length;

        if (csvuplod.status == 'success' && csvuplod.message.length > 0) {
          var filePath = paths.join(__dirname, '../../public/upload/csv/' + csvuplod.message);
          const csvUploadjsonArray = await csv().fromFile(filePath);
          /* const panchking = csvUploadjsonArray.map((data,index)=>{
            return data.pan;
          })
          console.log(panchking); */

          const jsonObject = csvUploadjsonArray.map(JSON.stringify);
          let uniqueSet = new Set(jsonObject);
          let uniqueArray = Array.from(uniqueSet).map(JSON.parse);

          //fs.createReadStream(__dirname+'/chart-of-accounts.csv').pipe(parser);
          if (csvUploadjsonArray.length > 0) { //check uploaded csv is empty or not
            if (csvUploadjsonArray.length === uniqueArray.length) { // Check for duplicate pan in uploaded csv

              for (let i = 0; csvUploadjsonArray.length > i; i++) {
                var csvPAN = csvUploadjsonArray[i].pan;
                var csvAmount = parseInt((csvUploadjsonArray[i].amount) ? csvUploadjsonArray[i].amount : 0);
                if (csvPAN.trim().length == 10 && csvAmount > 0) {
                  
                  //if (csvPAN.trim().length > 9 && csvAmount > 0) {
                   var regex = new RegExp(["^", csvPAN, "$"].join(""), "i");
                  var panData = await kycModel.find({pan_number:regex, status: 'active' });
                  // console.log('------------- ');
                  // console.log(panData);
                  if (panData > 0 || panData) {
                    var check_record_exist = await payoutUploadModel.find({ pan_number : regex, type: pdata.type.toLowerCase().trim(), month: pdata.month, year: pdata.year, status: "uploaded" }).count();

                    if (check_record_exist == 0) {
                      
                      // select recored based on given pan and check pan user type.
                    const panDataboth = await kycModel.aggregate([
                      {
                        '$match': {
                          pan_number: new RegExp('^' +csvPAN.trim() + '$', 'i'),
                          status: 'active'
                        }
                      },
                      {
                        '$lookup': {
                          from: 'users',
                          localField: 'user_id',
                          foreignField: '_id',
                          as: 'data'
                        }
                      },
                      {
                        '$unwind': { 'path': '$data' }
                      },
                      {
                        '$match': {
                          $or: [
                            {"data.user_type": 'bc'},
                            {"data.user_type": 'ews'}
                          ],
                        }
                      },
                      {
                        $project: {
                          _id: 1,
                          pan_number: 1,
                          user_id: 1,
                          fullname: "$data.fullname",
                          user_type: "$data.user_type",
                          mobile: "$data.mobile",
                          email: "$data.email",
                          user_status: "$data.status",
                          referl_code:"$data.referl_code"
                        }
                      }
                    ]);
                    // console.log('---------'+csvPAN.trim());
                    // console.log(panDataboth);
                    // console.log('===============================');
                    if(panDataboth.length > 0){
                      // if (panDataboth[0].referl_code == 'MITRADMIN001') {
                      //   upload_status += 'false';
                      //   csvPayoutErrorData.push({
                      //     'pan_number': csvPAN.trim(),
                      //     'amount': 'This Pan user is not MS. Its FE PAN Number.'
                      //   });
                      // } else {
                        total_inserted_count = parseInt(total_inserted_count) + 1;
                        upload_status += 'true';
                        csvPayoutData.push({
                          'pan_number': csvPAN.toUpperCase().trim(),
                          'amount': csvAmount,
                          'type': pdata.type.toLowerCase().trim(),
                          'month': pdata.month.toLowerCase().trim(),
                          'year': pdata.year,
                          'status': 'updated'
                        });
                      //}
                    }else{
                      upload_status += 'false';
                      csvPayoutErrorData.push({
                        'pan_number': csvPAN.trim(),
                        'amount': 'This Pan user is not MS. Its FE PAN Number or incorrect PAN.'
                      });
                    }
                    }
                    else{
                      res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: [{ 'pan_number': "This month record is Uploaded.", "amount": '!' }] });
                    }
                  } else {
                    upload_status += 'false';
                    csvPayoutErrorData.push({
                      'pan_number': csvPAN.trim(),
                      'amount': "This Pan is Incorrect or invalid."
                    });
                  }
                } else {
                  return_message = [{ 'pan_number': "PAN Formate or Amount is not correct", "amount": csvPAN.trim() }];
                  status = 0;
                  //next();
                  return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message });
                }
              }

            } else {
              return_message = [{ 'pan_number': "Uploaded CSV have duplicate PAN Numbers", "amount": '!' }];
              return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message });

            }
          } else {
            return_message = [{ 'pan_number': "Please choose valid csv file.", "amount": '!' }];
            status = 0;
            //next();
            return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message });
          }
          if (!upload_status.includes("false")) {

            var insrtPayouts = await payoutUploadModel.insertMany(csvPayoutData);
            //console.log(insrtPayouts);
            if (insrtPayouts) {
              //res.redirect('./list-payouts');
              return res.render('admin/create-payouts', { status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: "Data has been successfully uploaded." });

            }
          } else {
            return_message = csvPayoutErrorData;
            status = 0;
            // next();
            return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: csvPayoutErrorData });
          }
        } else {
          status = 0;
          return_message = [{ 'pan_number': "'Please choose csv file.'", "amount": '!' }];
          return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: [{ 'pan_number': "'Please choose csv file.'", "amount": '!' }] });
          //next();
        }
      }
      //console.log('++++++++= '+totalUploadedFiles);
      //return ;
      return res.render('admin/create-payouts', { status: status, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message });

    } catch (error) {
      console.log('-------  create_payout error section  ----------');
      console.log(error);
    }
  }

  async insert_fePayouts(req, res, next) {
    try {
      var pdata = req.body;

      const chkExist = await fePayoutModel.find({
        month: pdata.month.toLowerCase().trim(),
        year: pdata.year,
        type: pdata.type,
      }).countDocuments();
      //console.log(chkExist);  return;
      if (chkExist > 0) {
        return_message = [{ 'pan_number': `This ${pdata.month} month data is already Uploaded.`, "amount": 0 }];
        status = 0;
      } else {

        let dir = "./public/upload/csv";
        let uploadCSVFile = req.files && req.files.csv_file ? req.files.csv_file : null;

        let csvuplod = middleware.csvFileUploadsFN(req.files, uploadCSVFile, dir);
        var status = 0;
        var csvPayoutData = [];
        var upload_status = '';
        var csvPayoutErrorData = [];
        var total_inserted_count = 0;
        var return_message = [];
        var totalUploadedFiles = await fePayoutModel.distinct('month');
        totalUploadedFiles = totalUploadedFiles.length;

        if (csvuplod.status == 'success' && csvuplod.message.length > 0) {
          var filePath = paths.join(__dirname, '../../public/upload/csv/' + csvuplod.message);
          const csvUploadjsonArray = await csv().fromFile(filePath);

          const jsonObject = csvUploadjsonArray.map(JSON.stringify);
          let uniqueSet = new Set(jsonObject);
          let uniqueArray = Array.from(uniqueSet).map(JSON.parse);


          if (csvUploadjsonArray.length > 0) { //check uploaded csv is empty or not
            if (csvUploadjsonArray.length === uniqueArray.length) { // Check for duplicate pan in uploaded csv

              for (let i = 0; csvUploadjsonArray.length > i; i++) {
                var csvPAN = csvUploadjsonArray[i].pan;
                var csvAmount = parseInt((csvUploadjsonArray[i].amount) ? csvUploadjsonArray[i].amount : 0);
                if (typeof csvPAN != 'undefined') {
                  if (csvPAN.trim().length == 10 && csvAmount > 0) {
                    //if (csvPAN.trim().length > 9 && csvAmount > 0) {
                    var panData = await kycModel.find({ pan_number: csvPAN.trim(), status: 'active' }).count();
                    //console.log(panData); return;
                    if (panData > 0 || panData) { // pan is exist or not in db 



                      const agentPanData = await kycModel.aggregate([
                        {
                          '$match': {
                            pan_number: csvPAN.trim(),
                            status: 'active'
                          }
                        },
                        {
                          '$lookup': {
                            from: 'users',
                            localField: 'user_id',
                            foreignField: '_id',
                            as: 'data'
                          }
                        },
                        {
                          '$unwind': { 'path': '$data' }
                        },
                        {
                          '$match': {
                            "data.user_type": 'agent'
                          }
                        },
                        {
                          $project: {
                            _id: 1,
                            pan_number: 1,
                            user_id: 1,
                            fullname: "$data.fullname",
                            user_type: "$data.user_type",
                            mobile: "$data.mobile",
                            email: "$data.email",
                            user_status: "$data.status",
                            referl_code:"$data.referl_code"
                          }
                        }
                      ]);

                      // var ff = await kycModel.findOne({ pan_number: csvPAN.trim(), status: 'active' });
                      // var uff = await usersModel.find({ _id: ff.user_id, referl_code: 'MITRADMIN001', user_type: 'agent' }).count();

                      if (agentPanData.length == 1) {
                        // for fe data insert 

                        total_inserted_count = parseInt(total_inserted_count) + 1;
                        upload_status += 'true';
                        csvPayoutData.push({
                          'user_id': ff.user_id,
                          'pan_number': csvPAN.toUpperCase().trim(),
                          'amount': csvAmount,
                          'type': pdata.type.toLowerCase().trim(),
                          'month': pdata.month.toLowerCase().trim(),
                          'year': pdata.year,
                          'status': 'updated'
                        });
                      } else {
                        upload_status += 'false';
                        csvPayoutErrorData.push({
                          'pan_number': csvPAN.trim(),
                          'amount': 'This Pan user is not FE. Its MS PAN Number or invalid.'
                        });
                      }
                    } else {
                      upload_status += 'false';
                      csvPayoutErrorData.push({
                        'pan_number': `This ${csvPAN.trim().toUpperCase()} does not exist`,
                        'amount': csvAmount
                      });
                    }
                  } else {
                    return_message = [{ 'pan_number': "PAN Formate or Amount is not correct", "amount": csvPAN.trim() }];
                    status = 0;

                    return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message });
                  }
                } else {
                  return_message = [{ 'pan_number': "Pan Number is not valid", "amount": '!' }];
                  return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message });
                }
              }

            } else {
              return_message = [{ 'pan_number': "Uploaded CSV have duplicate PAN Numbers", "amount": '!' }];
              return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message });

            }
          } else {
            return_message = [{ 'pan_number': "Please choose valid csv file.", "amount": '!' }];
            status = 0;
            //next();
            return res.render('admin/create-payouts', { status: status, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message });
          }

          if (!upload_status.includes("false")) {

            /* console.log(csvPayoutData);
            return; */

            var insrtPayouts = await fePayoutModel.insertMany(csvPayoutData);
            //console.log(insrtPayouts);
            if (insrtPayouts) {
              //res.redirect('./list-payouts');
              return res.render('admin/create-payouts', { status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: " FE Payouts data has been successfully uploaded." });

            }
          } else {
            return_message = csvPayoutErrorData;
            status = 0;
            // next();
            return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: csvPayoutErrorData });
          }
        } else {
          status = 0;
          return_message = [{ 'pan_number': "'Please choose csv file.'", "amount": '!' }];
          return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: [{ 'pan_number': "'Please choose csv file.'", "amount": '!' }] });
          //next();
        }
      }

      return res.render('admin/create-payouts', { status: status, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message });

    } catch (error) {
      //console.log('-------  create_payout error section  ----------');
      //console.log(error);
    }

  }

  async generate_payouts(req, res, next) {
    try {

      /*------------------ If year and month is Undefined then------------- */
      if (typeof req.body.year == "undefined" || typeof req.body.month == "undefined") {
        /* console.log(`If year and month is Undefined then-`);
        res.redirect(req.header('Referer')); */

        var return_message = [{ 'pan_number': "Year and Month is not defined.", "amount": '!' }];
        var status = 0;
        return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message });

      }

      // Check if payout is uploaded in database /
      const chkDatauploaded = await payoutUploadModel.find({ year: req.body.year, month: req.body.month });

      // -----------Map All serices which are avaloiable for month and year-------- /
      //let ourServices = ['banking','insurance','amazon','ecom','digipay'];
      let pushAllServices = chkDatauploaded.map((data, index) => {
        return data.type;
      });

      let filterAllServices = pushAllServices.filter((x, i, a) => a.indexOf(x) == i);

      // -----------------Payouts not uploaded check----------------------- /
      if (!(chkDatauploaded.length > 0)) {
        //console.log(`----payout upload`);
        await req.flash('errorMsg', `All payouts for ${req.body.year}  ${req.body.month} is not uploaded yet. Please upload and then generate payouts.`);
        /* console.log(`----Payouts not uploaded check-----`);
        res.redirect(req.header('Referer'));
        return false; */

        var return_message = [{ 'pan_number': "Payouts not uploaded. First Upload payouts then generate Payout", "amount": '!' }];
        var status = 0;
        return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message });

      }

      // ---------------PAyouts already Generated check--------------------- /
      const chkpayoutalreadygenerated = await generatedPayoutsModel.find({ year: req.body.year, month: req.body.month });

      if (chkpayoutalreadygenerated.length > 0) {
        //console.log(`---Generated payouts------`);
        await req.flash('errorMsg', `All Payouts for ${req.body.year}  ${req.body.month} is already generated.`);
        /* console.log(`-----PAyouts already Generated check----`);
        res.redirect(req.header('Referer'));
        return false; */

        var return_message = [{ 'pan_number': "Payouts already Generated", "amount": '!' }];
        var status = 0;
        return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message });

      }
      //console.log(filterAllServices);
      // ---------------All services of payouts not Generated check--------------------- /
      if (filterAllServices.length != 3) {

        await req.flash('errorMsg', `All Services of payouts ${req.body.year}  ${req.body.month} is not uploaded yet. Please upload and then generate payouts.`);
        /* console.log(`-----All services of payouts not Generated check-----`);
        res.redirect(req.header('Referer'));
        return false; */

        var return_message = [{ 'pan_number': "All services Not uploaded yet. Please Upload ", "amount": '!' }];
        var status = 0;
        return res.render('admin/create-payouts', { status: 0, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Upload Payout", 'path': '../../', usrType: req.session.userType, message: return_message });

      }

      var allPayoutData = await payoutUploadModel.aggregate([
        {
          '$match': {
            'year': req.body.year,
            'month': req.body.month
          }
        }, {
          '$group': {
            '_id': '$pan_number',
            'sum': {
              '$sum': '$amount'
            }
          }
        }, {
          '$match': {
            '_id': {
              '$ne': null
            }
          }
        }, {
          '$project': {
            'pan_number': '$_id',
            '_id': 0,
            'sum': 1
          }
        }
      ]);

      const fePercent = 2;
      const zePercent = 0.22;

      await Promise.all(allPayoutData.map(async (obj) => {
        var bcTotalAmount = 0;
        var aeTotalAmount = 0;
        let bc_banking_amount = await payoutUploadModel.findOne({ pan_number: obj.pan_number, type: 'banking' });

        let bankingAmounts = (bc_banking_amount) ? bc_banking_amount.amount : 0;
        
        if(parseFloat(obj.sum) == 0){ // this check for validate if DB sum is zero then no substraction required.
          bcTotalAmount = 0;
        }else{
          bcTotalAmount = parseFloat(obj.sum) - parseFloat(bankingAmounts);
        }
        

        // -----------    Calculate FE Payuots -----------  
        let fe_incentive = (parseFloat(obj.sum) * parseFloat(fePercent)) / 100;
        var uploadedPAN = obj.pan_number;
        let get_bc_kyc_data = await kycModel.findOne({ pan_number: { $regex: new RegExp(uploadedPAN, "i") } }); //, { $regex : /obj.pan_number$/i }

        var bc_Details = await usersModel.findById(get_bc_kyc_data.user_id);

        var bc_FE_Details = await usersModel.findOne({ referrer_code: bc_Details.referl_code });
        // -----------------------------------       ------------------- 


        // -----------    Calculate ZE Payuots ----------- 
        let getZEDetails = await zeModel.findOne({ user_id: bc_FE_Details._id, status: 'active' });
        let ze_incentive = (parseFloat(obj.sum) * parseFloat(zePercent)) / 100;
        let bc_ZE_Details = null;
        if (getZEDetails) { // enter when record send for ZE
          bc_ZE_Details = await usersModel.findById(getZEDetails.ze_user_id);
        } else {
          bc_ZE_Details = null;
        }

        bcTotalAmount = (bcTotalAmount) ? bcTotalAmount : 0;
        fe_incentive = (fe_incentive) ? fe_incentive : 0;
        ze_incentive = (ze_incentive) ? ze_incentive : 0;
        aeTotalAmount = (aeTotalAmount) ? aeTotalAmount : 0;

        //console.log('bc bank- ' + bankingAmounts + ' --- sum ' + obj.sum + ' ----- ' + fe_incentive + '   --- f2 - ' + fe_incentive.toFixed(2));
        //return;
        await generatedPayoutsModel.create({
          bc_user_id: bc_Details._id,
          fe_user_id: bc_FE_Details._id,
          ze_user_id: (bc_ZE_Details) ? bc_ZE_Details._id : null,
          bc_name: bc_Details.fullname,
          bc_mobile: bc_Details.mobile,
          fe_name: bc_FE_Details.fullname,
          fe_mobile: bc_FE_Details.mobile,
          ze_name: (bc_ZE_Details) ? bc_ZE_Details.fullname : 'N/A',
          ze_mobile: (bc_ZE_Details) ? bc_ZE_Details.mobile : 'N/A',
          bc_user_details: JSON.stringify(bc_Details), //JSON.stringify(),
          fe_user_details: JSON.stringify(bc_FE_Details), //JSON.stringify(bc_FE_Details),
          ze_user_details: JSON.stringify(bc_ZE_Details), //JSON.stringify(bc_ZE_Details),
          bc_payout_amount: bcTotalAmount.toFixed(2),
          fe_payout_amount: fe_incentive.toFixed(2),
          ze_payout_amount: ze_incentive.toFixed(2),
          ae_payout_amount: aeTotalAmount.toFixed(2),
          month: req.body.month, //req.body.month,
          year: req.body.year //req.body.year
        });

      }));
      //console.log(allPayoutData);

      res.redirect('./list-payouts');
    } catch (error) {
      //console.log('+++++++++++++++++++++');
      //console.log(error.message);
    }

  }

  async feOwnPayouts(req, res, next) {
    try {
      let year = "";
      let month = "";
      if ((typeof req.query.year != "undefined" && typeof req.query.month != "undefined")) {
        month = req.query.month;
        year = req.query.year;

      } else {
        const date = new Date(new Date());
        const c_month = date.toLocaleString('en-us', { month: 'short' });
        month = c_month.toLowerCase();
        year = date.getFullYear();
      }
      //console.log(month,year); return;

      if ((year != "" || year != null) && (month != "" || month != null)) {
        //console.log(month, year); return;
        /*  let feOwnPayout = await fePayoutModel.aggregate([
           {
             '$match': {
               'year': year,
               'month': month
             }
           }, {
             '$lookup': {
               'from': 'kyc_details',
               'localField': 'pan_number',
               'foreignField': 'pan_number',
               'as': 'feDetails'
             }
           }, {
             '$unwind': {
               'path': '$feDetails'
             }
           }, {
             '$lookup': {
               from: 'generated_payouts',
               as: 'payoutsDet',
               'let': {
                 user_id: '$feDetails.user_id',
                 month: '$month',
                 year: '$year'
               },
               pipeline: [
                 {
                   $match: {
                     $expr: {
                       $and: [
                         {
                           $eq: [
                             '$month',
                             '$$month'
                           ]
                         },
                         {
                           $eq: [
                             '$year',
                             '$$year'
                           ]
                         },
                         {
                           $eq: [
                             '$fe_user_id',
                             '$$user_id'
                           ]
                         }
                       ]
                     }
                   }
                 }
               ]
             }
           }, {
             '$addFields': {
               totalBC_FE_Amount: {
                 $sum: '$payoutsDet.fe_payout_amount'
               }
             }
           }
         ]); */

        const feOwnPayout = await fePayoutModel.aggregate([
          {
            '$match': {
              'year': year,
              'month': month
            }
          }, {
            '$lookup': {
              'from': 'kyc_details',
              'localField': 'user_id',
              'foreignField': 'user_id',
              'as': 'feDetails'
            }
          }, {
            '$unwind': {
              'path': '$feDetails'
            }
          }
        ]);

        //console.log(feOwnPayout);

        return res.render('admin/fe-own-payout', { status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "fe-payout-list", activeBar: 'Payout', month: month, year: year, 'path': '../../', usrType: req.session.userType, message: '', data: feOwnPayout });

      } else {
        console.log(`Year and month is not defined`);
      }

    } catch (error) {
      throw new Error(error);
    }
  }

  async feOwnPayout_export(req, res, next) {
    try {
      if (req.params.year !== "" && req.params.month !== "") {
        const year = req.params.year;
        const month = req.params.month;

        /* let feOwnPayout = await fePayoutModel.aggregate([
          {
            '$match': {
              'year': year,
              'month': month
            }
          }, {
            '$lookup': {
              'from': 'kyc_details',
              'localField': 'pan_number',
              'foreignField': 'pan_number',
              'as': 'feDetails'
            }
          }, {
            '$unwind': {
              'path': '$feDetails'
            }
          }, {
            '$lookup': {
              'from': 'users',
              'localField': 'feDetails.user_id',
              'foreignField': '_id',
              'as': 'details'
            }
          }, {
            '$unwind': {
              'path': '$details'
            }
          }, {
            '$lookup': {
              'from': 'generated_payouts',
              'as': 'payoutsDet',
              'let': {
                'user_id': '$feDetails.user_id',
                'month': '$month',
                'year': '$year'
              },
              'pipeline': [
                {
                  '$match': {
                    '$expr': {
                      '$and': [
                        {
                          '$eq': [
                            '$month', '$$month'
                          ]
                        }, {
                          '$eq': [
                            '$year', '$$year'
                          ]
                        }, {
                          '$eq': [
                            '$fe_user_id', '$$user_id'
                          ]
                        }
                      ]
                    }
                  }
                }
              ]
            }
          }, {
            '$addFields': {
              'totalBC_FE_Amount': {
                '$sum': '$payoutsDet.fe_payout_amount'
              }
            }
          }
        ]); */

        const feOwnPayout = await fePayoutModel.aggregate([
          {
            '$match': {
              'year': year,
              'month': month
            }
          }, {
            '$lookup': {
              'from': 'kyc_details',
              'localField': 'user_id',
              'foreignField': 'user_id',
              'as': 'feDetails'
            }
          }, {
            '$unwind': {
              'path': '$feDetails'
            }
          },
          {
            '$lookup': {
              'from': 'users',
              'localField': 'user_id',
              'foreignField': '_id',
              'as': 'details'
            }
          }, {
            '$unwind': {
              'path': '$details'
            }
          }
        ]);

        //console.log(feOwnPayout); return;

        if (feOwnPayout.length > 0) {

          let feOwnPayoutData = [];

          feOwnPayout.forEach((res, index) => {

            feOwnPayoutData.push({
              'feName': res.feDetails.full_name,
              'feMobile': res.details.mobile,
              'type': res.type,
              'panNo': res.feDetails.pan_number,
              'bankName': res.feDetails.bank_name,
              'branchName': res.feDetails.branch_name,
              'accountNo': res.feDetails.account_number,
              'ifsc': res.feDetails.ifsc_code,
              'Amount': res.amount,
            });
          });

          //console.log(feOwnPayoutData); return;

          const csvFields = ["Name", "Mobile Number", "Payout Type", "Pan Number", "Bank Name", "Branch Name", "Account Number", "IFSC", "Amount"];

          const csvParser = new CsvParser({ csvFields });
          const csvData = csvParser.parse(feOwnPayoutData);

          res.setHeader("Content-Type", "text/csv");
          res.setHeader("Content-Disposition", `attachment; filename=MS-OwnPayout-${year}-${month}.csv`);
          res.status(200).end(csvData);

        } else {

          return res.redirect(req.header('Referer'));
        }

      } else {
        //console.log('Year and month is not available');
        return res.redirect(req.header('Referer'));
      }
    } catch (error) {

    }

  }

  async list_FE_payouts(req, res, next) {
    try {
      let year = "";
      let month = "";
      if ((typeof req.query.year != "undefined" && typeof req.query.month != "undefined")) {
        month = req.query.month;
        year = req.query.year;

      } else {
        const date = new Date(new Date());
        const c_month = date.toLocaleString('en-us', { month: 'short' });
        month = c_month.toLowerCase();
        year = date.getFullYear();
      }
      let fe_payoutListData = "";

      if ((year != "" || year != null) && (month != "" || month != null)) {
        fe_payoutListData = await generatedPayoutsModel.aggregate([
          {
            '$match': {
              'month': month,
              'year': year,
              'fe_user_id': {
                '$exists': true,
                '$ne': null
              }
            }
          }, {
            '$group': {
              '_id': '$fe_user_id',
              'totalcount': {
                '$sum': 1
              },
              'fe_payout_amount': {
                '$sum': '$fe_payout_amount'
              },
              'fe_details': {
                '$first': '$fe_user_details'
              }
            }
          }, {
            "$lookup": {
              from: 'kyc_details',
              localField: '_id',
              foreignField: 'user_id',
              as: 'kyc_details'
            }
          }, {
            "$unwind": {
              path: "$kyc_details",
            }
          }
        ]);

      } else {
        console.log(`Month & Year cannot be blank`);
      }

      return res.render('admin/fe-payout-gen', { status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "fe-payout-list", activeBar: 'Payout', month: month, year: year, 'path': '../../', usrType: req.session.userType, message: '', data: fe_payoutListData });
    } catch (error) {
      console.log(" create list payouts error message - " + error.message);
    }
  }
  async fe_payouts_export(req, res, next) {
    try {

    } catch (error) {
      console.log(error);
    }
  }
  async list_ZE_payouts(req, res, next) {
    try {

      let year = "";
      let month = "";
      if ((typeof req.query.year != "undefined" && typeof req.query.month != "undefined")) {
        month = req.query.month;
        year = req.query.year;

      } else {
        const date = new Date(new Date());
        const c_month = date.toLocaleString('en-us', { month: 'short' });
        month = c_month.toLowerCase();
        year = date.getFullYear();
      }
      let zePayoutList = "";
      if ((year != "" || year != null) && (month != "" || month != null)) {
        zePayoutList = await generatedPayoutsModel.aggregate([
          {
            '$match': {
              'month': month,
              'year': year,
              'ze_user_id': {
                '$exists': true,
                '$ne': null
              }
            }
          },
          {
            '$group': {
              '_id': '$ze_user_id',
              'totalcount': {
                '$sum': 1
              },
              'ze_payout_amount': {
                '$sum': '$ze_payout_amount'
              },
              'ze_details': {
                '$first': '$ze_user_details'
              }
            }
          },
          {
            '$lookup': {
              'from': 'kyc_details',
              'localField': '_id',
              'foreignField': 'user_id',
              'as': 'kyc_details'
            }
          },
          {
            '$unwind': {
              'path': '$kyc_details'
            }
          }
        ]);
      } else {
        console.log(`Month & Year cannot be blank`);
      }

      return res.render('admin/ze-payout-gen', { status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "ze-payout-list", activeBar: 'Payout', 'path': '../../', usrType: req.session.userType, message: '', month: month, year: year, data: zePayoutList });
    } catch (error) {
      console.log(" create list payouts error message - " + error.message);
    }
  }

  // async feFullPayouts(req, res, next) {
  //   try {
  //     let year = "";
  //     let month = "";

  //     if ((typeof req.query.year != "undefined" && typeof req.query.month != "undefined")) {
  //       month = req.query.month;
  //       year = req.query.year;

  //     } else {
  //       const date = new Date(new Date());
  //       const c_month = date.toLocaleString('en-us', { month: 'short' });
  //       month = c_month.toLowerCase();
  //       year = date.getFullYear();
  //     }


  //     const allPayout = await generatedPayoutsModel.aggregate([
  //       {
  //         $match: {
  //           month: month,
  //           year: year
  //         }
  //       },
  //       {
  //         $group: {
  //           _id: "$fe_user_id",
  //           totalBc: {
  //             $push: "$bc_user_details"
  //           },
  //           bccount: {
  //             $sum: 1
  //           },
  //           bcFeAmount: {
  //             $push: "$fe_payout_amount"
  //           },
  //           feBcAmt: {
  //             $sum: "$fe_payout_amount"
  //           },
  //           fedetails: {
  //             $first: "$fe_user_details"
  //           }
  //         }
  //       }, {
  //         $project: {
  //           _id: 1,
  //           fecount: 1,
  //           bccount: 1,
  //           feBcAmt: 1,
  //           bcdata: {
  //             $function:
  //             {
  //               body: function (bcdetails, bcFeAmount) {
  //                 let bcarr = [];
  //                 bcdetails.forEach((data, index) => {
  //                   let pushData = JSON.parse(data);
  //                   pushData.feBcPayout = bcFeAmount[index];
  //                   bcarr.push(pushData);
  //                 });
  //                 return bcarr;
  //               },
  //               args: ["$totalBc", "$bcFeAmount"],
  //               lang: "js"
  //             }
  //           },
  //           fedetails: {
  //             $function:
  //             {
  //               body: function (fedetails) {
  //                 return JSON.parse(fedetails);
  //               },
  //               args: ["$fedetails"],
  //               lang: "js"
  //             }
  //           },
  //         }
  //       }, {
  //         $lookup: {
  //           from: 'fe_payouts',
  //           as: 'ownpayout',
  //           let: { id: "$_id" },
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: {
  //                   $and: [
  //                     { $eq: ['$year', year] },
  //                     { $eq: ['$month', month] },
  //                     { $eq: ['$user_id', "$$id"] }
  //                   ]
  //                 }
  //               }
  //             }
  //           ]
  //         }
  //       }, {
  //         $lookup: {
  //           from: 'kyc_details',
  //           localField: '_id',
  //           foreignField: 'user_id',
  //           as: 'feKyc'
  //         }
  //       }, {
  //         $unwind: {
  //           path: "$feKyc"
  //         }
  //       }
  //     ]);

  //     //console.log(allPayout);

  //     res.render('admin/total-fe-payouts', { status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Total Fe Payout", 'path': '../../', usrType: req.session.userType, message: 'Please select all required feilds.', year: year, month: month, data: allPayout });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  async feFullPayouts(req, res, next) {
    try {
      let year = "";
      let month = "";

      if ((typeof req.query.year != "undefined" && typeof req.query.month != "undefined")) {
        month = req.query.month;
        year = req.query.year;

      } else {
        const date = new Date(new Date());
        const c_month = date.toLocaleString('en-us', { month: 'short' });
        month = c_month.toLowerCase();
        year = date.getFullYear();
      }
      

      const allPayout = await generatedPayoutsModel.aggregate([
        {
            '$match': {
                'month': 'jan', 
                'year': '2021'
            }
        }, {
            '$group': {
                '_id': '$fe_user_id', 
                'totalBc': {
                    '$push': '$bc_user_details'
                }, 
                'bccount': {
                    '$sum': 1
                }, 
                'bcFeAmount': {
                    '$push': '$fe_payout_amount'
                }, 
                'feBcAmt': {
                    '$sum': '$fe_payout_amount'
                }, 
                'fedetails': {
                    '$first': '$fe_user_details'
                }
            }
        }, {
            '$project': {
                '_id': 1, 
                'fecount': 1, 
                'bccount': 1, 
                'feBcAmt': 1, 
                'bcFeAmount': 1, 
                'totalBc': 1, 
                'fedetails': '$fedetails'
            }
        }, {
            '$lookup': {
                'from': 'fe_payouts', 
                'as': 'ownpayout', 
                'let': {
                    'id': '$_id'
                }, 
                'pipeline': [
                    {
                        '$match': {
                            '$expr': {
                                '$and': [
                                    {
                                        '$eq': [
                                            '$year', '2021'
                                        ]
                                    }, {
                                        '$eq': [
                                            '$month', 'jan'
                                        ]
                                    }, {
                                        '$eq': [
                                            '$user_id', '$$id'
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                ]
            }
        }, {
            '$lookup': {
                'from': 'kyc_details', 
                'localField': '_id', 
                'foreignField': 'user_id', 
                'as': 'feKyc'
            }
        }, {
            '$unwind': {
                'path': '$feKyc'
            }
        }
    ]);

      //console.log(allPayout); return;

      res.render('admin/total-fe-payouts', { status: 1, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "Total Fe Payout", 'path': '../../', usrType: req.session.userType, message: 'Please select all required feilds.', year: year, month: month, data: allPayout });
    } catch (error) {
      console.log(error);
    }
  }
  // async list_payouts_export(req, res, next) {
  //   try {

  //     if (req.params.year !== "" && req.params.month !== "") {
  //       const year = req.params.year;
  //       const month = req.params.month;

  //       const payoutListData = await generatedPayoutsModel.aggregate([
  //         {
  //           '$match': {
  //             'month': month.toLowerCase(),
  //             'year': year
  //           }
  //         }, {
  //           '$lookup': {
  //             'from': 'kyc_details',
  //             'localField': 'bc_user_id',
  //             'foreignField': 'user_id',
  //             'as': 'kyc_details'
  //           }
  //         }, {
  //           '$unwind': {
  //             'path': '$kyc_details'
  //           }
  //         }, {
  //           '$project': {
  //             _id: 1,
  //             bc_user_id: 1,
  //             bc_name: 1,
  //             bc_mobile: 1,
  //             bc_payout_amount: 1,
  //             month: 1,
  //             year: 1,
  //             details: {
  //               $function: {
  //                 body: function (bc_user_details) {
  //                   let obj = JSON.parse(bc_user_details);
  //                   return {
  //                     email: obj.email,
  //                     mobile: obj.mobile,
  //                     referrer_code: obj.referrer_code,
  //                     dob: obj.dob


  //                   };
  //                 },
  //                 args: ["$bc_user_details"],
  //                 lang: "js"
  //               }
  //             },
  //             bc_payout_amount: 1,
  //             fe_payout_amount: 1,
  //             ze_payout_amount: 1,
  //             bank_name: "$kyc_details.bank_name",
  //             branch_name: "$kyc_details.bank_name",
  //             ifsc_code: "$kyc_details.ifsc_code",
  //             user_id: "$kyc_details.user_id",
  //             account_no: "$kyc_details.account_number",
  //             pan_number: "$kyc_details.pan_number"
  //           }
  //         }
  //       ]);

  //       //console.log(payoutListData);
  //       if (payoutListData.length > 0) {

  //         let msPayoutData = [];

  //         payoutListData.forEach((obj) => {
  //           /* let createdDt = middleware.getFormattedDateFN(obj.trans_date);

  //           var d = new Date(obj.trans_date.toString());
  //           var paymentDT = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear(); */

  //           const { _id, bc_user_id, bc_name, bc_mobile, bc_payout_amount, fe_payout_amount, ze_payout_amount, month, year, details, bank_name, branch_name, ifsc_code, user_id, account_no, pan_number } = obj;

  //           msPayoutData.push({
  //             bc_name, bc_mobile, pan_number, bank_name, branch_name, account_no, ifsc_code, bc_payout_amount, fe_payout_amount, ze_payout_amount
  //           });
  //         });

  //         //console.log(msPayoutData); return;

  //         const csvFields = ["Name", "Mobile", "Pan Number", "Bank Name", "Branch Name", "Account Number", "IFSC", "Bc Payout Amount", "FE Payout", "ZE Payout"];

  //         const csvParser = new CsvParser({ csvFields });
  //         const csvData = csvParser.parse(msPayoutData);

  //         res.setHeader("Content-Type", "text/csv");
  //         res.setHeader("Content-Disposition", `attachment; filename=MS-Payout-${year}-${month}.csv`);
  //         res.status(200).end(csvData);

  //       } else {
  //         console.log('No data avaliable');
  //         return res.redirect(req.header('Referer'));
  //       }

  //     } else {
  //       console.log('Year and month not found');
  //       return res.redirect(req.header('Referer'));
  //     }

  //   } catch (error) {
  //     console.log(" create list payouts error message - " + error.message);
  //   }
  // }

  async list_payouts_export(req, res, next) {
    try {

      if (req.params.year !== "" && req.params.month !== "") {
        const year = req.params.year;
        const month = req.params.month;

        const payoutListData = await generatedPayoutsModel.aggregate([
          {
            '$match': {
              'month': month.toLowerCase(),
              'year': year
            }
          }, {
            '$lookup': {
              'from': 'kyc_details',
              'localField': 'bc_user_id',
              'foreignField': 'user_id',
              'as': 'kyc_details'
            }
          }, {
            '$unwind': {
              'path': '$kyc_details'
            }
          }, {
            '$project': {
              _id: 1,
              bc_user_id: 1,
              bc_name: 1,
              bc_mobile: 1,
              bc_payout_amount: 1,
              month: 1,
              year: 1,
              bc_payout_amount: 1,
              fe_payout_amount: 1,
              ze_payout_amount: 1,
              bank_name: "$kyc_details.bank_name",
              branch_name: "$kyc_details.bank_name",
              ifsc_code: "$kyc_details.ifsc_code",
              user_id: "$kyc_details.user_id",
              account_no: "$kyc_details.account_number",
              pan_number: "$kyc_details.pan_number"
            }
          }
        ]);

        //console.log(payoutListData);
        if (payoutListData.length > 0) {

          let msPayoutData = [];

          payoutListData.forEach((obj) => {
            /* let createdDt = middleware.getFormattedDateFN(obj.trans_date);

            var d = new Date(obj.trans_date.toString());
            var paymentDT = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear(); */

            const { _id, bc_user_id, bc_name, bc_mobile, bc_payout_amount, fe_payout_amount, ze_payout_amount, month, year, bank_name, branch_name, ifsc_code, user_id, account_no, pan_number } = obj;

            msPayoutData.push({
              bc_name, bc_mobile, pan_number, bank_name, branch_name, account_no, ifsc_code, bc_payout_amount, fe_payout_amount, ze_payout_amount
            });
          });

          //console.log(msPayoutData); return;

          const csvFields = ["Name", "Mobile", "Pan Number", "Bank Name", "Branch Name", "Account Number", "IFSC", "Bc Payout Amount", "FE Payout", "ZE Payout"];

          const csvParser = new CsvParser({ csvFields });
          const csvData = csvParser.parse(msPayoutData);

          res.setHeader("Content-Type", "text/csv");
          res.setHeader("Content-Disposition", `attachment; filename=MS-Payout-${year}-${month}.csv`);
          res.status(200).end(csvData);

        } else {
          //console.log('No data avaliable');
          return res.redirect(req.header('Referer'));
        }

      } else {
        //console.log('Year and month not found');
        return res.redirect(req.header('Referer'));
      }

    } catch (error) {
      //console.log(" create list payouts error message - " + error.message);
    }
  }


  async ze_payouts_export(req, res, next) {
    try {
      let year = req.params.year;
      let month = req.params.month;
      console.log(`qqqqq --- ${year} ----- ${month}`);
      if (typeof year != "undefined" && typeof month != "undefined") {
        const zePayoutList = await generatedPayoutsModel.aggregate([
          {
            '$match': {
              'month': month,
              'year': year,
              'ze_user_id': {
                '$exists': true,
                '$ne': null
              }
            }
          },
          {
            '$group': {
              '_id': '$ze_user_id',
              'totalcount': {
                '$sum': 1
              },
              'ze_payout_amount': {
                '$sum': '$ze_payout_amount'
              },
              'ze_details': {
                '$first': '$ze_user_details'
              }
            }
          },
          {
            '$lookup': {
              'from': 'kyc_details',
              'localField': '_id',
              'foreignField': 'user_id',
              'as': 'kyc_details'
            }
          },
          {
            '$unwind': {
              'path': '$kyc_details'
            }
          }
        ]);

        if (zePayoutList.length > 0) {

          const zeExportData = [];
          //console.log(fe_payoutListData);
          zePayoutList.forEach((res, index) => {
            let zeDet = JSON.parse(res.ze_details);
            zeExportData.push({
              'zeName': res.kyc_details.full_name,
              'zeMobile': zeDet.mobile,
              'panNo': res.kyc_details.pan_number,
              'bankName': res.kyc_details.bank_name,
              'accountNo': res.kyc_details.account_number,
              'ifsc': res.kyc_details.ifsc_code,
              'zeAmount': res.ze_payout_amount,
            });
          })

          const csvFields = ["ZE Name", "ZE Mobile", "PAN Number", "Bank Name", "Account No", "IFSC", "ZE Amount"];
          const csvParser = new CsvParser({ csvFields });
          const csvData = csvParser.parse(zeExportData);

          res.setHeader("Content-Type", "text/csv");
          res.setHeader("Content-Disposition", `attachment; filename=ZE-Payout-${month}-${year}.csv`);
          res.status(200).end(csvData);

        } else {
          console.log(`Data is empty `);
          return res.redirect(req.header('Referer'));
        }

      } else {
        console.log(`Year and Month not found.`);
        return res.redirect(req.header('Referer'));
      }
    } catch (error) {
      console.log(error);
    }
  }
  async fe_payouts_export(req, res, next) {
    try {
      let year = req.params.year;
      let month = req.params.month;
      //console.log(`qqqqq --- ${year} ----- ${month}`);
      if (typeof year != "undefined" && typeof month != "undefined") {
        const fe_payoutListData = await generatedPayoutsModel.aggregate([
          {
            '$match': {
              'month': month,
              'year': year,
              'fe_user_id': {
                '$exists': true,
                '$ne': null
              }
            }
          }, {
            '$group': {
              '_id': '$fe_user_id',
              'totalcount': {
                '$sum': 1
              },
              'fe_payout_amount': {
                '$sum': '$fe_payout_amount'
              },
              'fe_details': {
                '$first': '$fe_user_details'
              }
            }
          }, {
            "$lookup": {
              from: 'kyc_details',
              localField: '_id',
              foreignField: 'user_id',
              as: 'kyc_details'
            }
          }, {
            "$unwind": {
              path: "$kyc_details",
            }
          }
        ]);

        if (fe_payoutListData.length > 0) {

          const feExportData = [];
          //console.log(fe_payoutListData);
          fe_payoutListData.forEach((res, index) => {
            let feDet = JSON.parse(res.fe_details);
            feExportData.push({
              'feName': res.kyc_details.full_name,
              'feMobile': feDet.mobile,
              'panNo': res.kyc_details.pan_number,
              'bankName': res.kyc_details.bank_name,
              'accountNo': res.kyc_details.account_number,
              'ifsc': res.kyc_details.ifsc_code,
              'feAmount': res.fe_payout_amount,
            });
          })
          //console.log(feExportData);

          const csvFields = ["FE Name", "FE Mobile", "PAN Number", "Bank Name", "Account No", "IFSC", "FE Amount"];
          const csvParser = new CsvParser({ csvFields });
          const csvData = csvParser.parse(feExportData);

          res.setHeader("Content-Type", "text/csv");
          res.setHeader("Content-Disposition", `attachment; filename=FE-Payout-${month}-${year}.csv`);
          res.status(200).end(csvData);
        } else {
          console.log(`Data not avaliable`);
          return res.redirect(req.header('Referer'));
        }
      } else {
        console.log(`Year and month is undefined`);
        return res.redirect(req.header('Referer'));
      }

    } catch (error) {
      console.log(error);
    }
  }

  // async feFullPayoutExport(req, res, next) {
  //   try {
  //     if (req.params.year !== "" && req.params.month !== "") {
  //       const year = req.params.year;
  //       const month = req.params.month;

  //       const allPayout = await generatedPayoutsModel.aggregate([
  //         {
  //           $match: {
  //             month: month,
  //             year: year
  //           }
  //         },
  //         {
  //           $group: {
  //             _id: "$fe_user_id",
  //             totalBc: {
  //               $push: "$bc_user_details"
  //             },
  //             bccount: {
  //               $sum: 1
  //             },
  //             bcFeAmount: {
  //               $push: "$fe_payout_amount"
  //             },
  //             feBcAmt: {
  //               $sum: "$fe_payout_amount"
  //             },
  //             fedetails: {
  //               $first: "$fe_user_details"
  //             }
  //           }
  //         }, {
  //           $project: {
  //             _id: 1,
  //             fecount: 1,
  //             bccount: 1,
  //             feBcAmt: 1,
  //             bcdata: {
  //               $function:
  //               {
  //                 body: function (bcdetails, bcFeAmount) {
  //                   let bcarr = [];
  //                   bcdetails.forEach((data, index) => {
  //                     let pushData = JSON.parse(data);
  //                     pushData.feBcPayout = bcFeAmount[index];
  //                     bcarr.push(pushData);
  //                   });
  //                   return bcarr;
  //                 },
  //                 args: ["$totalBc", "$bcFeAmount"],
  //                 lang: "js"
  //               }
  //             },
  //             fedetails: {
  //               $function:
  //               {
  //                 body: function (fedetails) {
  //                   return JSON.parse(fedetails);
  //                 },
  //                 args: ["$fedetails"],
  //                 lang: "js"
  //               }
  //             },
  //           }
  //         }, {
  //           $lookup: {
  //             from: 'fe_payouts',
  //             as: 'ownpayout',
  //             let: { id: "$_id" },
  //             pipeline: [
  //               {
  //                 $match: {
  //                   $expr: {
  //                     $and: [
  //                       { $eq: ['$year', year] },
  //                       { $eq: ['$month', month] },
  //                       { $eq: ['$user_id', "$$id"] }
  //                     ]
  //                   }
  //                 }
  //               }
  //             ]
  //           }
  //         }, {
  //           $lookup: {
  //             from: 'kyc_details',
  //             localField: '_id',
  //             foreignField: 'user_id',
  //             as: 'feKyc'
  //           }
  //         }, {
  //           $unwind: {
  //             path: "$feKyc"
  //           }
  //         }
  //       ]);

  //       if (allPayout.length > 0) {

  //         let feTotalPayout = [];
  //         let ownPayout = [];

  //         allPayout.forEach((res, index) => {

  //           ownPayout = res.ownpayout.map((res, index) => {
  //             return res.amount;
  //           });

  //           feTotalPayout.push({
  //             'feName': res.feKyc.full_name,
  //             'panNo': res.feKyc.pan_number,
  //             'bankName': res.feKyc.bank_name,
  //             'branchName': res.feKyc.branch_name,
  //             'accountNo': res.feKyc.account_number,
  //             'ifsc': res.feKyc.ifsc_code,
  //             'bcCount': res.bccount,
  //             'fePayout': res.feBcAmt,
  //             'feOwnPayout': ownPayout.reduce((a, b) => a + b, 0),
  //             'totalPayout': (ownPayout.reduce((a, b) => a + b, 0) + res.feBcAmt).toFixed(2),
  //           });

  //         });

  //         //console.log(feTotalPayout); return;

  //         const csvFields = ["Name", "Pan Number", "Bank Name", "Branch Name", "Account Number", "IFSC", "BC Count", "FE Payout", "FE Own Payout", "Total Payout"];

  //         const csvParser = new CsvParser({ csvFields });
  //         const csvData = csvParser.parse(feTotalPayout);

  //         res.setHeader("Content-Type", "text/csv");
  //         res.setHeader("Content-Disposition", `attachment; filename=MS-TotalPayout-${year}-${month}.csv`);
  //         res.status(200).end(csvData);

  //       } else {

  //         return res.redirect(req.header('Referer'));
  //       }

  //     } else {
  //       //console.log('Year and month is not available');
  //       return res.redirect(req.header('Referer'));
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  async feFullPayoutExport(req, res, next) {
    try{
      if (req.params.year !== "" && req.params.month !== "") {
        const year = req.params.year;
        const month = req.params.month;

        const allPayout = await generatedPayoutsModel.aggregate([
          {
              '$match': {
                  'month': 'jan', 
                  'year': '2021'
              }
          }, {
              '$group': {
                  '_id': '$fe_user_id', 
                  'totalBc': {
                      '$push': '$bc_user_details'
                  }, 
                  'bccount': {
                      '$sum': 1
                  }, 
                  'bcFeAmount': {
                      '$push': '$fe_payout_amount'
                  }, 
                  'feBcAmt': {
                      '$sum': '$fe_payout_amount'
                  }, 
                  'fedetails': {
                      '$first': '$fe_user_details'
                  }
              }
          }, {
              '$project': {
                  '_id': 1, 
                  'fecount': 1, 
                  'bccount': 1, 
                  'feBcAmt': 1, 
                  'bcFeAmount': 1, 
                  'totalBc': 1, 
                  'fedetails': '$fedetails'
              }
          }, {
              '$lookup': {
                  'from': 'fe_payouts', 
                  'as': 'ownpayout', 
                  'let': {
                      'id': '$_id'
                  }, 
                  'pipeline': [
                      {
                          '$match': {
                              '$expr': {
                                  '$and': [
                                      {
                                          '$eq': [
                                              '$year', '2021'
                                          ]
                                      }, {
                                          '$eq': [
                                              '$month', 'jan'
                                          ]
                                      }, {
                                          '$eq': [
                                              '$user_id', '$$id'
                                          ]
                                      }
                                  ]
                              }
                          }
                      }
                  ]
              }
          }, {
              '$lookup': {
                  'from': 'kyc_details', 
                  'localField': '_id', 
                  'foreignField': 'user_id', 
                  'as': 'feKyc'
              }
          }, {
              '$unwind': {
                  'path': '$feKyc'
              }
          }
      ]);

        if (allPayout.length > 0) {

          let feTotalPayout = [];
          let ownPayout = [];
          //console.log(allPayout); return;
          allPayout.forEach((res, index) => {

            ownPayout = res.ownpayout.map((res,index)=>{
              return res.amount;
            });
            let feDetails = JSON.parse(res.fedetails);
            
            feTotalPayout.push({
              'feName': res.feKyc.full_name,
              'panNo': res.feKyc.pan_number,
              'bankName': res.feKyc.bank_name,
              'branchName': res.feKyc.branch_name,
              'accountNo': res.feKyc.account_number,
              'ifsc': res.feKyc.ifsc_code,
              'bcCount': res.bccount,
              'fePayout':res.feBcAmt,
              'feOwnPayout': ownPayout.reduce((a, b) => a + b, 0),
              'totalPayout': (ownPayout.reduce((a, b) => a + b, 0)+ res.feBcAmt).toFixed(2),
            });

          });

          //console.log(feTotalPayout); return;

          const csvFields = ["Name", "Pan Number", "Bank Name", "Branch Name", "Account Number", "IFSC", "BC Count","FE Payout","FE Own Payout","Total Payout"];

          const csvParser = new CsvParser({ csvFields });
          const csvData = csvParser.parse(feTotalPayout);

          res.setHeader("Content-Type", "text/csv");
          res.setHeader("Content-Disposition", `attachment; filename=MS-TotalPayout-${year}-${month}.csv`);
          res.status(200).end(csvData);

        } else {

          return res.redirect(req.header('Referer'));
        }

      }else{
        //console.log('Year and month is not available');
        return res.redirect(req.header('Referer'));
      }
    }catch(error){
      console.log(error);
    }
  }

}

export default new adminController();