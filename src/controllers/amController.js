import middleware from '../middleware/helper';
import usersModel from "../models/users";
var request = require("request");
import flash from "express-flash";
import fs from 'fs';
const paths = require('path');

const { check, validationResult, body } = require('express-validator');
const session = require("express-session");
const CsvParser = require("json2csv").Parser;



class amController {

    async feDetails(req, res, next){
        try{
            var getMobile = middleware.checkAreaManagerFN(req.session.user.mobile);
            const state = (getMobile.split("__")[2] == "UTTAR PRADESH") ? ((req.session.user.mobile == "8400020189") ? 'UTTAR PRADESH WESTERN' : 'UTTAR PRADESH EASTERN') : getMobile.split("__")[2];
            //console.log(state);
            if(typeof state == "undefined"){
                console.log(`State is not defined`);
            }else{
                
                var getAllUserData = await usersModel.aggregate([
                    {
                      $lookup: {
                          from: "users_details",
                          localField: "_id",    // field in the orders collection
                          foreignField: "user_id",  // field in the items collection
                          as: "userDetails"
                      }
                    },
                    {
                        $unwind: {
                              path: "$userDetails"
                        }
                    },
                    {
                    $match: {
                        status: 'active', 
                        user_type : 'agent',  
                        'userDetails.state':getMobile.split("__")[2]
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
                    {
                      $unwind: {
                            path: "$userPaymentDetails"
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
                        $unwind: {
                              path: "$userKycDetails"
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
                    {
                        $unwind: {
                              path: "$feDetails"
                        }
                    },
                    { $sort: {payment_status: -1 } },
                      
                    {
                      $project: {
                          _id: 1,
                          mobile:1,
                          payment_status:1,
                          fullname:1,
                          user_type:1,
                          referrer_code:1,
                          referl_code:1,
                          email:1,
                          f_name: "$userDetails.f_name",
                          m_name: "$userDetails.m_name",
                          l_name: "$userDetails.l_name",
                          city: "$userDetails.city",
                          state: "$userDetails.state",
                          pincode: "$userDetails.pin_code",
                          trans_date: "$userPaymentDetails.trans_date",
                          pan_no : "$userKycDetails.pan_number",
                          aadhar_no : "$userKycDetails.aadhar_number",
                          fe_mobile: "$feDetails.mobile",
                          fe_fullname: "$feDetails.fullname",
                      }
                    }
                ]);
                //console.log(getAllUserData);
                res.render('am/fe-list-view-mis', {'path': '../../', "leftMenuType": middleware.checkLeftMenuFN(), 'data': getAllUserData, title: 'List',usrType:req.session.userType, 'state': getMobile.split("__")[2] });
        
            }


            
        }catch(error){
            console.log(error);
        }
    }

    async fe_list_view_export (req, res, next){

        let state = req.params.state;
        
          const matchObj = {
            status: 'active', 
            user_type : 'agent',  
            'userDetails.state':state
          };
        
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
                {
                    $unwind: {
                          path: "$userDetails"
                    }
                },
                {
                    $match: matchObj
                },
                {
                  $lookup: {
                    from: "payment_successes",
                    localField: "_id",    // field in the orders collection
                    foreignField: "user_id",  // field in the items collection
                    as: "userPaymentDetails"
                  }
                },
                {
                    $unwind: {
                          path: "$userPaymentDetails"
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
                    $unwind: {
                          path: "$userKycDetails"
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
                {
                    $unwind: {
                          path: "$feDetails"
                    }
                },
                { $sort: {payment_status: -1 } },
                  
                {
                  $project: {
                      _id: 1,
                      mobile:1,
                      payment_status:1,
                      fullname:1,
                      user_type:1,
                      referrer_code:1,
                      referl_code:1,
                      email:1,
                      f_name: "$userDetails.f_name",
                      m_name: "$userDetails.m_name",
                      l_name: "$userDetails.l_name",
                      city: "userDetails.city",
                      state: "$userDetails.state",
                      pincode: "$userDetails.pin_code",
                      trans_date: "$userPaymentDetails.trans_date",
                      pan_no : "$userKycDetails.pan_number",
                      aadhar_no : "$userKycDetails.aadhar_number",
                      fe_mobile: "$feDetails.mobile",
                      fe_fullname: "$feDetails.fullname",
                  }
                }
            ]);
            //console.log(getAllUserData);  return;
            

            let msdata = [];

            getAllUserData.forEach((obj) => {
            
            const { _id, email, mobile, referl_code, referrer_code, payment_status,user_type,fullname, f_name, m_name,l_name,city,state,pincode,trans_date,pan_no,aadhar_no,fe_mobile,fe_fullname } = obj;

            msdata.push({ 
              fullname, email, mobile, city, pincode,referrer_code  });
          });

          const csvFields = ["Name","Email", "Mobile", "District", "Pin Code","Referrer Code"];

              const csvParser = new CsvParser({ csvFields });
              const csvData = csvParser.parse(msdata);

              res.setHeader("Content-Type", "text/csv");
              res.setHeader("Content-Disposition", "attachment; filename=fedata.csv");
              res.status(200).end(csvData);

            } catch (error) {
                console.log(error);
        }
        
      }

    async bcDetails (req, res, next){
        try {
            
            var getMobile = middleware.checkAreaManagerFN(req.session.user.mobile);
            const state = (getMobile.split("__")[2] == "UTTAR PRADESH") ? ((req.session.user.mobile == "8400020189") ? 'UTTAR PRADESH WESTERN' : 'UTTAR PRADESH EASTERN') : getMobile.split("__")[2];
            
            if(typeof state == "undefined"){
                console.log(`State is not defined`);
                return false;
            }else{

                const  matchObj = {
                    status: 'active', 
                    user_type : 'bc',  
                    'userDetails.state':getMobile.split("__")[2]
                  };

                var getAllUserData = await usersModel.aggregate([
                    {
                    $lookup: {
                        from: "users_details",
                        localField: "_id",    // field in the orders collection
                        foreignField: "user_id",  // field in the items collection
                        as: "userDetails"
                    }
                    },
                    {$match: matchObj},
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
                    { $sort: {payment_status: -1 } },
                    
                    {
                    $project: {
                        _id: 1,
                        mobile:1,
                        payment_status:1,
                        fullname:1,
                        user_type:1,
                        referrer_code:1,
                        referl_code:1,
                        email:1,
                        f_name: "$userDetails.f_name",
                        m_name: "$userDetails.m_name",
                        l_name: "$userDetails.l_name",
                        city: "$userDetails.city",
                        state: "$userDetails.state",
                        pincode: "$userDetails.pin_code",
                        trans_date: "$userPaymentDetails.trans_date",
                        pan_no : "$userKycDetails.pan_number",
                        aadhar_no : "$userKycDetails.aadhar_number",
                        fe_mobile: "$feDetails.mobile",
                        fe_fullname: "$feDetails.fullname",
                    }
                    }
                ]);
                res.render('am/bc-list-view-mis', {'path': '../../', "leftMenuType": middleware.checkLeftMenuFN(), 'data': getAllUserData, title: 'List',usrType:req.session.userType, 'state': getMobile.split("__")[2] });
            }
        } catch (error) {
          console.log(error);
        } 
    }

    async bc_list_view_export(req,res,next){
        try{

        let state = req.params.state;
        
        const matchObj = {
            status: 'active', 
            user_type : 'bc',  
            'userDetails.state':state
        };
          

          var getAllUserData = await usersModel.aggregate([
            {
              $lookup: {
                  from: "users_details",
                  localField: "_id",    // field in the orders collection
                  foreignField: "user_id",  // field in the items collection
                  as: "userDetails"
              }
            },
            { $unwind: {path: "$userDetails" } },
            {$match: matchObj},
            {
              $lookup: {
                from: "payment_successes",
                localField: "_id",    // field in the orders collection
                foreignField: "user_id",  // field in the items collection
                as: "userPaymentDetails"
              }
            },
            { $unwind: {path: "$userPaymentDetails" } },
            {
              $lookup: {
                from: "kyc_details",
                localField: "_id",    // field in the orders collection
                foreignField: "user_id",  // field in the items collection
                as: "userKycDetails"
              }
            },
            { $unwind: {path: "$userKycDetails" } },
            {
              $lookup: {
                from: "users",
                localField: "referl_code",    // field in the orders collection
                foreignField: "referrer_code",  // field in the items collection
                as: "feDetails"
              }
            },
            { $unwind: {path: "$feDetails" } },
            { $sort: {payment_status: -1 } },
              
            {
              $project: {
                  _id: 1,
                  mobile:1,
                  payment_status:1,
                  fullname:1,
                  user_type:1,
                  referrer_code:1,
                  referl_code:1,
                  email:1,
                  f_name: "$userDetails.f_name",
                  m_name: "$userDetails.m_name",
                  l_name: "$userDetails.l_name",
                  city: "$userDetails.city",
                  state: "$userDetails.state",
                  pincode: "$userDetails.pin_code",
                  trans_date: "$userPaymentDetails.trans_date",
                  pan_no : "$userKycDetails.pan_number",
                  aadhar_no : "$userKycDetails.aadhar_number",
                  fe_mobile: "$feDetails.mobile",
                  fe_fullname: "$feDetails.fullname",
              }
            }
          ]);
          //console.log(getAllUserData); return ;

          let mitrsewakdata = [];

          getAllUserData.forEach((obj) => {
            let createdDt = middleware.getFormattedDateFN(obj.trans_date);

            var d = new Date(obj.trans_date.toString());
            var paymentDT = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();

            const { _id, email, mobile, referl_code, referrer_code, payment_status,user_type,fullname, f_name, m_name,l_name,city,state,pincode,trans_date,pan_no,aadhar_no,fe_mobile,fe_fullname } = obj;

            mitrsewakdata.push({ 
              fullname, mobile, city, pincode,fe_fullname,fe_mobile  });
          });

          //console.log(mitrsewakdata); return;

          const csvFields = ["Name", "Mobile", "District", "Pin Code","FE Name","FE Mobile"];

          const csvParser = new CsvParser({ csvFields });
          const csvData = csvParser.parse(mitrsewakdata);

          res.setHeader("Content-Type", "text/csv");
          res.setHeader("Content-Disposition", "attachment; filename=mitrsewak.csv");
          res.status(200).end(csvData);

        }catch(error){
          console.log(`Error - ${error} `);
        }
          
    }
    
    async inactive_users(req, res, next){
      try{
        var getMobile = middleware.checkAreaManagerFN(req.session.user.mobile);
        const state = (getMobile.split("__")[2] == "UTTAR PRADESH") ? ((req.session.user.mobile == "8400020189") ? 'UTTAR PRADESH WESTERN' : 'UTTAR PRADESH EASTERN') : getMobile.split("__")[2];
          if(typeof state !="undefined"){
            const userdetails = await usersModel.aggregate([
              {
                '$lookup': {
                  'from': 'users_details', 
                  'let': {
                    'userID': '$_id'
                  }, 
                  'pipeline': [
                    {
                      '$match': {
                        '$expr': {
                          '$and': [
                            {
                              '$eq': [
                                '$user_id', '$$userID'
                              ]
                            }, {
                              '$eq': [
                                '$state', state
                              ]
                            }
                          ]
                        }
                      }
                    }, {
                      '$project': {
                        'f_name': 1, 
                        'm_name': 1, 
                        'l_name': 1, 
                        'relative_name': 1, 
                        'house_number': 1, 
                        'street': 1, 
                        'village_locality': 1, 
                        'post_office': 1, 
                        'city': 1, 
                        'state': 1, 
                        'pin_code': 1, 
                        'status': 1, 
                        'created_at': 1, 
                        'blood_group': 1
                      }
                    }
                  ], 
                  'as': 'usersDetails'
                }
              }, {
                '$project': {
                  'email': 1, 
                  'mobile': 1, 
                  'referl_code': 1, 
                  'referrer_code': 1, 
                  'whatsapp_no': 1, 
                  'email_status': 1, 
                  'mobile_status': 1, 
                  'kyc_status': 1, 
                  'payment_status': 1, 
                  'user_type': 1, 
                  'status': 1, 
                  'usersDetails': 1, 
                  'userDetCount': {
                    '$size': '$usersDetails'
                  }
                }
              }, {
                '$match': {
                  'user_type': {
                    '$in': [
                      'user', 'newews'
                    ]
                  }, 
                  'userDetCount': 1
                }
              }, {
                '$unwind': {
                  'path': '$usersDetails'
                }
              }, {
                '$lookup': {
                  'from': 'kyc_details', 
                  'localField': '_id', 
                  'foreignField': 'user_id', 
                  'as': 'kycDetails'
                }
              }, {
                '$unwind': {
                  'path': '$kycDetails'
                }
              }
            ]);
            res.render('am/inactive-users', {'path': '../../', "leftMenuType": middleware.checkLeftMenuFN(), 'data': userdetails, title: 'List',usrType:req.session.userType, 'state': state });
          }else{
            //console.log("State not found");
            return false;
          }
      }catch(error){
        //console.log('Error');
      }
    }

}

export default new amController();