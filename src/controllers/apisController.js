import usersModel from "../models/users";
import usersDetailModel from "../models/usersDetail";
import kycModel from "../models/kyc";
import middleware from '../middleware/auth';

import zeModel from "../models/ze_team";
import { exit } from "process";


const url = require('url'); 




class apisController {

  async getUserDetailsByPAN (req, res, next){
    try{

      var data = req.body;
      
      let matchToken = middleware.checkTokenAuthentication(data.api_token);
      if(matchToken){
        let panNumber = data.pan_number;
        const PANCount = await kycModel.find({"pan_number": panNumber, "status": "active"}).count();
        if(PANCount !=0){
          var getAllUserData = await usersModel.aggregate([
            {
              $lookup:{
                  from: "users_details",       // other table name
                  localField: "_id",   // name of users table field
                  foreignField: "user_id", // name of userinfo table field
                  as: "user_info"         // alias for userinfo table
              }
            },
            {   $unwind:"$user_info" }, 
            {
              $lookup:{
                  from: "kyc_details", 
                  localField: "_id", 
                  foreignField: "user_id",
                  as: "user_kyc"
              }
          },
          {   $unwind:"$user_kyc" }, 
          {
             $lookup: {
               from: "payment_successes",
               localField: "_id",    // field in the orders collection
               foreignField: "user_id",  // field in the items collection
               as: "userPaymentDetails"
             }
           },
           {   $unwind:"$userPaymentDetails" }, 
           
           {'$match'  : {status: 'active', "user_kyc.pan_number": panNumber }},
           //{ $sort: { fullname: 1 } },
           {
             $project:{
                 _id : 1,
                 fullname : 1,
                 email : 1,
                 mobile : 1,
                 referrer_code:1,
                 referl_code:1,
                 payment_status:1,
                 created_at:1,
                 user_type:1,
                 city : "$user_info.city", 
                 state : "$user_info.state",
                 street : "$user_info.street",
                 village_locality : "$user_info.village_locality",
                 pin_code : "$user_info.pin_code",
                 pan_number : "$user_kyc.pan_number",
                 aadhar_number : "$user_kyc.aadhar_number",
                 bank_name : "$user_kyc.bank_name",
                 branch_name : "$user_kyc.branch_name",
                 account_number : "$user_kyc.account_number",
                 ifsc_code : "$user_kyc.ifsc_code",
                 actualAmount : "$userPaymentDetails.actualAmount",
                 paymentDate : "$userPaymentDetails.created_at",
             } 
           }
            
          ]);
         res.json({status: 1, response : 'success', message : 'Record fetch successfuly', data: getAllUserData[0]})
        }else{
          res.json({status: 0, response : 'fail', message : 'PAN Number is not matched.', data: {}})
        }
        
      }else{
        res.json({status: 0, response : 'fail', message : 'Token is not matched.', data: {}})
      }
      
    } catch (error) {
      //console.log('Entered in catch error section.'+error);
      
    }
  }


  async getZEFEDetails (req, res, next){
    try {
        var data = req.body;
        
        let matchToken = middleware.checkTokenAuthentication(data.api_token);
        
        if(matchToken){
          var allData = [];
          var allzeData = [];
          var message = '';
       
          const getDetails = await zeModel.find({"ze_user_id": data.user_id, status : 'active'}); 
          
          var recordType = '';
          var feData = '';
          
          if(getDetails.length > 0){ // enter when record send for ZE
            await Promise.all(getDetails.map(async (element, index) => {
              if(element.type == 'ze'){
                recordType = element.type;
              }else{
                  feData = await usersModel.aggregate([
                    {
                      $lookup:{
                          from: "users_details",       // other table name
                          localField: "_id",   // name of users table field
                          foreignField: "user_id", // name of userinfo table field
                          as: "user_info"         // alias for userinfo table
                      }
                    },
                    {$unwind:"$user_info" }, 
                    {
                      $lookup:{
                          from: "kyc_details", 
                          localField: "_id", 
                          foreignField: "user_id",
                          as: "user_kyc"
                      }
                  },
                  {$unwind:"$user_kyc" }, 
                  {'$match' : {status: 'active', user_type: 'agent', _id: element.user_id}},
                  {
                    $project:{
                        _id : 1,
                        fullname : 1,
                        email : 1,
                        mobile : 1,
                        referrer_code:1,
                        referl_code:1,
                        payment_status:1,
                        created_at:1,
                        user_type:1,
                        city : "$user_info.city", 
                        state : "$user_info.state",
                        street : "$user_info.street",
                        village_locality : "$user_info.village_locality",
                        pin_code : "$user_info.pin_code",
                        pan_number : "$user_kyc.pan_number",
                        aadhar_number : "$user_kyc.aadhar_number",
                        bank_name : "$user_kyc.bank_name",
                        branch_name : "$user_kyc.branch_name",
                        account_number : "$user_kyc.account_number",
                        ifsc_code : "$user_kyc.ifsc_code"
                    } 
                  }
                  ]);
                  allData.push(feData[0]);
                  message = 'Record fetch successfuly';
                  
              }
            }));
          }else {
            //
            // select the record and check FE OR BC
            const getfeDetals =  await usersModel.findById(data.user_id);
            //console.log(getfeDetals);

            if(getfeDetals.user_type == 'agent'){
              recordType = 'agent';

              //select ze details.

              const getBCDetals = await usersModel.find({referl_code : data.referrer_code, user_type: 'bc'}); // Select All BC Under this AGENT
              
              if(getBCDetals.length> 0){
                
                await Promise.all(getBCDetals.map(async (element, index) => {
                  
                  var allBCData = await usersModel.aggregate([
                      {
                        $lookup:{
                          from: "users_details",       // other table name
                          localField: "_id",   // name of users table field
                          foreignField: "user_id", // name of userinfo table field
                          as: "user_info"         // alias for userinfo table
                      }
                      },
                      {$unwind:"$user_info" }, 
                      {
                        $lookup:{
                            from: "kyc_details", 
                            localField: "_id", 
                            foreignField: "user_id",
                            as: "user_kyc"
                        }
                      },
                      {$unwind:"$user_kyc" }, 
                      {
                        $lookup: {
                          from: "payment_successes",
                          localField: "_id",    // field in the orders collection
                          foreignField: "user_id",  // field in the items collection
                          as: "userPaymentDetails"
                        }
                      },
                      {$unwind:"$userPaymentDetails" }, 
                      
                      {'$match'  : {status: 'active', user_type: 'bc', _id: element._id }},
                      {
                        $project:{
                            _id : 1,
                            fullname : 1,
                            email : 1,
                            mobile : 1,
                            referrer_code:1,
                            referl_code:1,
                            payment_status:1,
                            created_at:1,
                            user_type:1,
                            city : "$user_info.city", 
                            state : "$user_info.state",
                            street : "$user_info.street",
                            village_locality : "$user_info.village_locality",
                            pin_code : "$user_info.pin_code",
                            pan_number : "$user_kyc.pan_number",
                            aadhar_number : "$user_kyc.aadhar_number",
                            bank_name : "$user_kyc.bank_name",
                            branch_name : "$user_kyc.branch_name",
                            account_number : "$user_kyc.account_number",
                            ifsc_code : "$user_kyc.ifsc_code",
                            actualAmount : "$userPaymentDetails.actualAmount",
                            paymentDate : "$userPaymentDetails.created_at",
                        } 
                      }
                    
                  ]);
                  //console.log(allBCData[0]);
                  allData.push(allBCData[0]);
                }));
                
                message = 'Record fetch successfuly';
              }else{
                message = "No record Found on this ID or Referal Code.";
                allData.push({});
              }
            }else if(getfeDetals.user_type == 'bc'){
              recordType = 'bc'; // if bc then send the added his/her fe details.

              const feDatas = await usersModel.findOne({status : 'active', user_type : 'agent', "referrer_code" : data.referrer_code });
              allData.push(feDatas);
              
              
              // To get this BC-> FE-> ZE detais
              let zeDataRcord = await zeModel.findOne({"user_id": feDatas._id, status: 'active'});
             if(zeDataRcord){
                let getAllZEData = await usersModel.aggregate([
                  {'$match'  : {status: 'active', user_type : /^agent$/i, "_id": zeDataRcord.ze_user_id }},
                  {
                    $lookup:{
                        from: "users_details",       // other table name
                        localField: "_id",   // name of users table field
                        foreignField: "user_id", // name of userinfo table field
                        as: "user_info"         // alias for userinfo table
                    }
                  },
                  {   $unwind:"$user_info" }, 
                  {
                    $lookup:{
                        from: "kyc_details", 
                        localField: "_id", 
                        foreignField: "user_id",
                        as: "user_kyc"
                    }
                },
                {   $unwind:"$user_kyc" }, 
                  {   
                    $project:{
                      _id : 1,
                      fullname : 1,
                      email : 1,
                      mobile : 1,
                      referl_code: 1, 
                      referrer_code:1,
                      payment_status:1,
                      full_name : "$user_kyc.full_name",
                      bank_name : "$user_kyc.bank_name",
                      branch_name : "$user_kyc.branch_name",
                      ifsc_code : "$user_kyc.ifsc_code",
                      account_number : "$user_kyc.account_number",
                      upi_id : "$user_kyc.upi_id",
                      aadhar_number : "$user_kyc.aadhar_number",
                      pan_number : "$user_kyc.pan_number",
                      relative_name : "$user_info.relative_name",
                      house_number : "$user_info.house_number", 
                      street : "$user_info.street", 
                      village_locality : "$user_info.village_locality",
                      post_office : "$user_info.post_office", 
                      city : "$user_info.city", 
                      state : "$user_info.state", 
                      pin_code : "$user_info.pin_code",
                      f_name: "$user_info.f_name",
                      m_name: "$user_info.m_name",
                      l_name: "$user_info.l_name",
                      trans_date: "$userPaymentDetails.trans_date"
                    } 
                  }
                  
                ]); 
                
                allzeData.push(getAllZEData);
             }else{
               // when no ze found of this bca
              allzeData.push([]);
             }
              
              message = 'Record fetch successfuly';
            }else{
              console.log('Kya bhej rahe ho baklol...');
            } 
          }
          
          const allDatas = {'recordType' : recordType, 'bcFEData': allData, "allzeData": allzeData[0]};
          res.json({status: 1, response : 'success', message : message, data: allDatas});
          
        }else{
          res.json({status: 0, response : 'fail', message : 'Token is not matched.', data: {}})
        }
        
    } catch (error) {
      console.log(error.message);
    }
    
  }


  async getAllUserDetails (req, res, next){
    try {
        var data = req.body;
        
        let matchToken = middleware.checkTokenAuthentication(data.api_token);
        
        if(matchToken){

            var getAllBCData = await usersModel.aggregate([
            {
                $lookup:{
                    from: "users_details",       // other table name
                    localField: "_id",   // name of users table field
                    foreignField: "user_id", // name of userinfo table field
                    as: "user_info"         // alias for userinfo table
                }
            },
            {   $unwind:"$user_info" },     // $unwind used for getting data in object or for one record only
            // Join with user_role table
            {
                $lookup:{
                    from: "kyc_details", 
                    localField: "_id", 
                    foreignField: "user_id",
                    as: "user_kyc"
                }
            },
            {   $unwind:"$user_kyc" },
            // define some conditions here 
              {$match: { status: 'active'}},
              {
                $lookup: {
                   from: "payment_successes",
                   localField: "_id",    // field in the orders collection
                   foreignField: "user_id",  // field in the items collection
                   as: "userPaymentDetails"
                }
             },
             {$unwind:"$userPaymentDetails" },

             {$match: { status: 'active', user_type : 'bc'}},
             { $sort: {payment_status: 1} },
            // define which fields are you want to fetch
            {   
                $project:{
                    _id : 1,
                    fullname : 1,
                    email : 1,
                    mobile : 1,
                    referl_code: 1, 
                    referrer_code:1,
                    payment_status:1,
                    user_type: 1,
                    full_name : "$user_kyc.full_name",
                    bank_name : "$user_kyc.bank_name",
                    branch_name : "$user_kyc.branch_name",
                    ifsc_code : "$user_kyc.ifsc_code",
                    account_number : "$user_kyc.account_number",
                    upi_id : "$user_kyc.upi_id",
                    aadhar_number : "$user_kyc.aadhar_number",
                    pan_number : "$user_kyc.pan_number",
                    relative_name : "$user_info.relative_name",
                    house_number : "$user_info.house_number", 
                    street : "$user_info.street", 
                    village_locality : "$user_info.village_locality",
                    post_office : "$user_info.post_office", 
                    city : "$user_info.city", 
                    state : "$user_info.state", 
                    pin_code : "$user_info.pin_code",
                    trans_date: "$userPaymentDetails.trans_date"
                } 
            }
            ]);

            var getAllFEData = await usersModel.aggregate([
              {
                  $lookup:{
                      from: "users_details",       // other table name
                      localField: "_id",   // name of users table field
                      foreignField: "user_id", // name of userinfo table field
                      as: "user_info"         // alias for userinfo table
                  }
              },
              {   $unwind:"$user_info" },     // $unwind used for getting data in object or for one record only
              // Join with user_role table
              {
                  $lookup:{
                      from: "kyc_details", 
                      localField: "_id", 
                      foreignField: "user_id",
                      as: "user_kyc"
                  }
              },
              {   $unwind:"$user_kyc" },
              // define some conditions here 
                {$match: { status: 'active'}},
                {
                  $lookup: {
                     from: "payment_successes",
                     localField: "_id",    // field in the orders collection
                     foreignField: "user_id",  // field in the items collection
                     as: "userPaymentDetails"
                  }
               },
               {$unwind:"$userPaymentDetails" },

               {$match: { status: 'active', user_type : 'agent'}},
               { $sort: {payment_status: 1} },
              // define which fields are you want to fetch
              {   
                  $project:{
                      _id : 1,
                      fullname : 1,
                      email : 1,
                      mobile : 1,
                      referl_code: 1, 
                      referrer_code:1,
                      payment_status:1,
                      user_type: 1,
                      full_name : "$user_kyc.full_name",
                      bank_name : "$user_kyc.bank_name",
                      branch_name : "$user_kyc.branch_name",
                      ifsc_code : "$user_kyc.ifsc_code",
                      account_number : "$user_kyc.account_number",
                      upi_id : "$user_kyc.upi_id",
                      aadhar_number : "$user_kyc.aadhar_number",
                      pan_number : "$user_kyc.pan_number",
                      relative_name : "$user_info.relative_name",
                      house_number : "$user_info.house_number", 
                      street : "$user_info.street", 
                      village_locality : "$user_info.village_locality",
                      post_office : "$user_info.post_office", 
                      city : "$user_info.city", 
                      state : "$user_info.state", 
                      pin_code : "$user_info.pin_code",
                      trans_date: "$userPaymentDetails.trans_date"
                  } 
              }
              ]);
            var finalObj = {'bc': getAllBCData, 'fe': getAllFEData};

            res.json({status: 1, response : 'success', message : 'Record fetch successfuly', data: finalObj})
        }else{
          res.json({status: 0, response : 'fail', message : 'Token is not matched.', data: {}})
        }
        
    } catch (error) {
      console.log(error.message);
    }
    
  }

}

export default new apisController();