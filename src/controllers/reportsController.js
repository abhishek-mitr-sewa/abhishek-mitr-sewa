import usersModel from "../models/users";
import usersDetailModel from "../models/usersDetail";
import kycModel from "../models/kyc";
import middleware from '../middleware/helper';
const CsvParser = require("json2csv").Parser;
import reportAuthModel from "../models/reportAuth";


const url = require('url');


class reportsController {

  async reportview(req, res, next) {

    res.render('reports/report-auth', { status: 2, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "'Add member", 'path': '../../', usrType: req.session.userType, errors: null, message: '' });
  }

  async reportGen(req, res, next) {

    var data = await usersModel.aggregate([
      {
        '$lookup': {
          'from': 'users_details',
          'localField': '_id',
          'foreignField': 'user_id',
          'as': 'user_info'
        }
      },
      { $unwind: "$user_info" },
      {
        '$lookup': {
          'from': 'kyc_details',
          'localField': '_id',
          'foreignField': 'user_id',
          'as': 'kycData'
        }
      },
      { $unwind: "$kycData" },
      {
        '$lookup': {
          from: 'payment_successes',
          localField: '_id',
          foreignField: 'user_id',
          as: 'pmnt'
        }
      },
      { $unwind: "$pmnt" },
      {
        '$match': {
          'payment_status': 'paid',
          'status': 'active',
          // 'user_info.state': 'UTTAR PRADESH',
          // 'user_info.city': {
          //   $in: [
          //     'AZAMGARH',
          //     'BAHRAICH',
          //     'Bahraich',
          //     'BALLIA',
          //     'BALRAMPAUR',
          //     'BALRAMPUR',
          //     'Balrampur',
          //     'BARABANKI',
          //     'basti',
          //     'BHINGA',
          //     'Dhaneypur',
          //     'Dharampur',
          //     'GOLA GOKARANNATH',
          //     'GONDA',
          //     'gonda',
          //     'GORAKHPUR',
          //     'KUSHINAGAR',
          //     'LAKHIMPUR KHERI',
          //     'Lakhimpur khire',
          //     'MAHARAJGANJ',
          //     'NANPARA',
          //     'SHARAWASTI',
          //     'SHRAVASTI',
          //     'Shrawasti',
          //     'SHRAWASTI',
          //     'SHRAWATI',
          //     'SIDDHARTHNAGAR'
          //   ]
          // }
        }
      },
      {
        '$group': {
          _id: "$referl_code",
          count: {
            $sum: 1
          },

          bcData: {
            $push: '$$ROOT'
          },
        }
      },
      {
        '$lookup': {
          from: 'users',
          localField: '_id',
          foreignField: 'referrer_code',
          as: 'feData'
        }
      },
      { $unwind: "$feData" },
      {
        $project: {
          _id: 1,
          count: 1,
          bcData: 1,
          fe_id: "$feData._id",
          fe_email: "$feData.email",
          fe_mobile: "$feData.mobile",
          fe_name: "$feData.fullname",
        }
      },
      {
        '$lookup': {
          from: 'ze_teams',
          localField: 'fe_id',
          foreignField: 'user_id',
          as: 'withZEData'
        }
      },
      { $unwind: "$withZEData" },
      {
        $project: {
          _id: 1,
          count: 1,
          bcData: 1,
          fe_id: 1,
          fe_email: 1,
          fe_mobile: 1,
          fe_name: 1,
          ze_id: "$withZEData.ze_user_id",
          ze_code: "$withZEData.ze_referrer_code"
        }
      },
      {
        '$lookup': {
          from: 'users',
          localField: 'ze_id',
          foreignField: '_id',
          as: 'mainData'
        }
      },
      { $unwind: "$mainData" },
      {
        $project: {
          _id: 1,
          count: 1,
          bcData: 1,
          fe_id: 1,
          fe_email: 1,
          fe_mobile: 1,
          fe_name: 1,
          ze_id: 1,
          ze_code: 1,
          ze_name: "$mainData.fullname",
          ze_email: "$mainData.email",
          ze_mobile: "$mainData.mobile",
        }
      },
    ]);

    //console.log(data);
    res.render('reports/list', { status: 2, "leftMenuType": middleware.checkLeftMenuFN(req, res), title: "'Add member", 'path': '../../', usrType: req.session.userType, errors: null, message: '', data: data });
  }

  async exportmasterData(req, res, next) {

    var data = await usersModel.aggregate([
      {
        '$lookup': {
          'from': 'users_details',
          'localField': '_id',
          'foreignField': 'user_id',
          'as': 'user_info'
        }
      },
      { $unwind: "$user_info" },
      {
        '$lookup': {
          'from': 'kyc_details',
          'localField': '_id',
          'foreignField': 'user_id',
          'as': 'kycData'
        }
      },
      { $unwind: "$kycData" },
      {
        '$lookup': {
          from: 'payment_successes',
          localField: '_id',
          foreignField: 'user_id',
          as: 'pmnt'
        }
      },
      { $unwind: "$pmnt" },
      {
        '$match': {
          'payment_status': 'paid',
          'status': 'active',
          // 'user_info.state': 'UTTAR PRADESH',
          // 'user_info.city': {
          //   $in: [
          //     'AZAMGARH',
          //     'BAHRAICH',
          //     'Bahraich',
          //     'BALLIA',
          //     'BALRAMPAUR',
          //     'BALRAMPUR',
          //     'Balrampur',
          //     'BARABANKI',
          //     'basti',
          //     'BHINGA',
          //     'Dhaneypur',
          //     'Dharampur',
          //     'GOLA GOKARANNATH',
          //     'GONDA',
          //     'gonda',
          //     'GORAKHPUR',
          //     'KUSHINAGAR',
          //     'LAKHIMPUR KHERI',
          //     'Lakhimpur khire',
          //     'MAHARAJGANJ',
          //     'NANPARA',
          //     'SHARAWASTI',
          //     'SHRAVASTI',
          //     'Shrawasti',
          //     'SHRAWASTI',
          //     'SHRAWATI',
          //     'SIDDHARTHNAGAR'
          //   ]
          // }
        }
      },
      {
        '$group': {
          _id: "$referl_code",
          count: {
            $sum: 1
          },

          bcData: {
            $push: '$$ROOT'
          },
        }
      },
      {
        '$lookup': {
          from: 'users',
          localField: '_id',
          foreignField: 'referrer_code',
          as: 'feData'
        }
      },
      { $unwind: "$feData" },
      {
        $project: {
          _id: 1,
          count: 1,
          bcData: 1,
          fe_id: "$feData._id",
          fe_email: "$feData.email",
          fe_mobile: "$feData.mobile",
          fe_name: "$feData.fullname",
        }
      },
      {
        '$lookup': {
          from: 'ze_teams',
          localField: 'fe_id',
          foreignField: 'user_id',
          as: 'withZEData'
        }
      },
      { $unwind: "$withZEData" },
      {
        $project: {
          _id: 1,
          count: 1,
          bcData: 1,
          fe_id: 1,
          fe_email: 1,
          fe_mobile: 1,
          fe_name: 1,
          ze_id: "$withZEData.ze_user_id",
          ze_code: "$withZEData.ze_referrer_code"
        }
      },
      {
        '$lookup': {
          from: 'users',
          localField: 'ze_id',
          foreignField: '_id',
          as: 'mainData'
        }
      },
      { $unwind: "$mainData" },
      {
        $project: {
          _id: 1,
          count: 1,
          bcData: 1,
          fe_id: 1,
          fe_email: 1,
          fe_mobile: 1,
          fe_name: 1,
          ze_id: 1,
          ze_code: 1,
          ze_name: "$mainData.fullname",
          ze_email: "$mainData.email",
          ze_mobile: "$mainData.mobile",
        }
      },
    ]);

    let totalData = [];
    data.forEach((res, index) => {
      res.bcData.forEach((bcd, index) => {
        totalData.push({
          'zeName': res.ze_name,
          'zeMobile': res.ze_mobile,
          'feName': res.fe_name,
          'feMobile': res.fe_mobile,
          'msName': bcd.fullname,
          'msMobile': bcd.mobile,
          'msEmail': bcd.email,
          'msreRerrerCode': bcd.referrer_code,
          'msType': (bcd.user_type != 'agent') ? 'MS' : 'FE',
          'msCreateAt': bcd.pmnt.created_at.toDateString(),
          'msDistrict': bcd.user_info.city,
          'msState': bcd.user_info.state,
          'msPinCode': bcd.user_info.pin_code,
          'msPAN': bcd.kycData.pan_number,
          'msAadhar': bcd.kycData.aadhar_number

        });
      });
    });

    const csvFields = ["Name", "Mobile Number", "Payout Type", "Pan Number", "Bank Name", "Branch Name", "Account Number", "IFSC", "Amount"];

    const csvParser = new CsvParser({ csvFields });
    const csvData = csvParser.parse(totalData);


    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=exportMasterData.csv`);
    res.status(200).end(csvData);
  }

  async exportFEnoMSwithZEmasterData(req, res, next) {

    var data = await usersModel.aggregate([
      {
        '$lookup': {
          'from': 'users_details',
          'localField': '_id',
          'foreignField': 'user_id',
          'as': 'user_info'
        }
      },
      { $unwind: "$user_info" },
      {
        '$lookup': {
          'from': 'kyc_details',
          'localField': '_id',
          'foreignField': 'user_id',
          'as': 'kycData'
        }
      },
      { $unwind: "$kycData" },
      {
        '$lookup': {
          from: 'users',
          localField: 'referrer_code',
          foreignField: 'referl_code',
          as: 'ss'
        }
      },
      {
        $project: {
          fullname: { $concat: ["$user_info.f_name", " ", "$user_info.m_name", "$user_info.l_name"] },
          email: 1,
          mobile: 1,
          user_type: 1,
          referrer_code: 1,
          district: '$user_info.city',
          state: '$user_info.state',
          pan_number: "$kycData.pan_number",
          aadhar_number: "$kycData.aadhar_number",
          numberOfBC: {
            $cond: {
              if:
                { $isArray: "$ss" }, then: { $size: "$ss" },
              else: 0
            }
          }
        }
      },
      {
        '$match': {
          numberOfBC: 0
        }
      },
      {
        '$lookup': {
          from: 'ze_teams',
          localField: '_id',
          foreignField: 'user_id',
          as: 'withZEData'
        }
      },
      { $unwind: "$withZEData" },
      {
        $project: {
          _id: 1,
          email: 1,
          mobile: 1,
          fullname: 1,
          referrer_code: 1,
          user_type: 1,
          districtL: 1,
          stateL: 1,
          ze_id: '$withZEData.ze_user_id',
          ze_code: '$withZEData.ze_referrer_code',

        }
      },
      {
        '$lookup': {
          from: 'users',
          localField: 'ze_id',
          foreignField: '_id',
          as: 'mainData'
        }
      },
      { $unwind: "$mainData" },
      {
        $project: {
          _id: 1,
          email: 1,
          mobile: 1,
          fullname: 1,
          district: 1,
          state: 1,
          referrer_code: 1,
          ze_id: 1,
          ze_code: 1,
          ze_name: '$mainData.fullname',
          ze_email: '$mainData.email',
          ze_mobile: '$mainData.mobile'
        }
      }
    ]);

    //console.log(data);
    let totalData = [];
    data.forEach((res, index) => {
      totalData.push({
        'zeName': res.ze_name,
        'zeMobile': res.ze_mobile,
        'feName': res.fullname,
        'feMobile': res.mobile,
        'msName': 'N/A',
        'msMobile': 'N/A',
        'msEmail': 'N/A',
        'msreRerrerCode': 'N/A',
        'msType': 'N/A',
        'msCreateAt': 'N/A',
        'msDistrict': 'N/A',
        'msState': 'N/A',
        'msPinCode': 'N/A',
        'msPAN': 'N/A',
        'msAadhar': 'N/A',
      });
    });

    const csvFields = ["Name", "Mobile Number", "Payout Type", "Pan Number", "Bank Name", "Branch Name", "Account Number", "IFSC", "Amount"];

    const csvParser = new CsvParser({ csvFields });
    const csvData = csvParser.parse(totalData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=exportMasterData.csv`);
    res.status(200).end(csvData);
  }

  async exportFEnoMSnoZEmasterData(req, res, next) {

    var data = await usersModel.aggregate([
      {
        '$match': {
          'user_type': 'agent'
        }
      }, {
        '$lookup': {
          'from': 'users',
          'localField': 'referrer_code',
          'foreignField': 'referl_code',
          'as': 'allFeBc'
        }
      }, {
        '$project': {
          '_id': 1,
          'email': 1,
          'mobile': 1,
          'fullname': 1,
          'bcCount': {
            '$size': '$allFeBc'
          }
        }
      }, {
        '$match': {
          'bcCount': 0
        }
      }, {
        '$lookup': {
          'from': 'ze_teams',
          'localField': '_id',
          'foreignField': 'user_id',
          'as': 'zeTeams'
        }
      }, {
        '$project': {
          '_id': 1,
          'email': 1,
          'mobile': 1,
          'fullname': 1,
          'zeCount': {
            '$size': '$zeTeams'
          }
        }
      }, {
        '$match': {
          'zeCount': 0
        }
      }
    ]);

    let totalData = [];
    data.forEach((res, index) => {
      totalData.push({
        'zeName': 'N/A',
        'zeMobile': 'N/A',
        'feName': res.fullname,
        'feMobile': res.mobile,
        'msName': 'N/A',
        'msMobile': 'N/A',
        'msEmail': 'N/A',
        'msreRerrerCode': 'N/A',
        'msType': 'N/A',
        'msCreateAt': 'N/A',
        'msDistrict': 'N/A',
        'msState': 'N/A',
        'msPinCode': 'N/A',
        'msPAN': 'N/A',
        'msAadhar': 'N/A',
      });
    });

    const csvFields = ["Name", "Mobile Number", "Payout Type", "Pan Number", "Bank Name", "Branch Name", "Account Number", "IFSC", "Amount"];

    const csvParser = new CsvParser({ csvFields });
    const csvData = csvParser.parse(totalData);


    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=exportMasterData.csv`);
    res.status(200).end(csvData);
  }

  async testreport(req, res, next) {
    try {

      // get yesterday all data from db
      const yda = await usersModel.aggregate([
        {
          '$lookup': {
            'from': 'users_details',
            'localField': '_id',
            'foreignField': 'user_id',
            'as': 'alldata'
          }
        }, {
          '$unwind': {
            'path': '$alldata'
          }
        }, {
          '$match': {
            'payment_status': 'paid',
            'status': 'active',
            'created_at': {
              '$gte': new Date(middleware.getYesterdayDTFN('yesterday').startDate),
              '$lt': new Date(middleware.getYesterdayDTFN('yesterday').endDate)
            }
          }
        }, {
          '$group': {
            '_id': '$alldata.state',
            'totalCount': {
              '$sum': 1
            },
            'allAgents': {
              '$push': {
                '$cond': [
                  {
                    '$eq': [
                      '$user_type', 'agent'
                    ]
                  }, {
                    'agent_data': '$$ROOT'
                  }, '$$REMOVE'
                ]
              }
            },
            'allBC': {
              '$push': {
                '$cond': [
                  {
                    '$eq': [
                      '$user_type', 'bc'
                    ]
                  }, {
                    'bc_data': '$$ROOT'
                  }, '$$REMOVE'
                ]
              }
            },
            'allEws': {
              '$push': {
                '$cond': [
                  {
                    '$eq': [
                      '$user_type', 'ews'
                    ]
                  }, {
                    'ews_data': '$$ROOT'
                  }, '$$REMOVE'
                ]
              }
            }
          }
        }, {
          '$addFields': {
            'totalCopies': {
              '$cond': [
                {
                  '$eq': [
                    '$user_type', 'agent'
                  ]
                }, {
                  '$sum': 1
                }, '$$REMOVE'
              ]
            }
          }
        }
      ]);
      var totalYDAData = [];
      await Promise.all(yda.map(async (val, key) => {

        totalYDAData.push({
          'state': val._id,
          'totalCount': val.totalCount,
          'totalAgentsCount': val.allAgents.length,
          'totalBCCount': val.allBC.length,
          'totalEWSCount': val.allEws.length
        });
      }));
      console.log(totalYDAData);
      //middleware.getYesterdayDTFN('monthFirstDay').date

      return;

    } catch (error) {
      console.log(error);
    }
  }

}

export default new reportsController();