import mongoose from 'mongoose';

var conn = mongoose.Collection;
//const mongoosePaginate = require('mongoose-paginate-v2'); //first step
mongoose.set('useFindAndModify', false);
var generatedPayoutsSchema = new mongoose.Schema({
    bc_user_id: {type : mongoose.Schema.Types.ObjectId, ref: 'users'},
    fe_user_id: {type : mongoose.Schema.Types.ObjectId, ref: 'users'},
    ze_user_id: {type : mongoose.Schema.Types.ObjectId, ref: 'users'},
    bc_name: {type : String},
    bc_mobile: {type : String},
    fe_name: {type : String},
    fe_mobile: {type : String},
    ze_name: {type : String},
    ze_mobile: {type : String},
    bc_user_details: {
      type : String,
      required:true
    },
    fe_user_details: {
      type : String,
      required : true
    },
    ze_user_details: {type : String},
    bc_payout_amount: {
      type : Number,
      required : true
    },
    fe_payout_amount: {
      type : Number,
      required : true
    },
    ze_payout_amount: {
      type : Number,
      required : true
    },
    ae_payout_amount: { // ae stands for Area Excutive 
      type : Number,
      required : true
    },
    month: {
      type : String,
      required : true
    },
    year: {
      type : String,
      required : true
    },
    type: { 
      type: String, 
      enum : ['generated','paid'], 
      default: 'generated' 
      }, 
    status: {type: String},
    created_at: {
      type : Date,
      default:Date.now
    }
  });

  //usersSchema.plugin(mongoosePaginate); //second step

  var generatedPayoutsModel = mongoose.model('generated_payouts', generatedPayoutsSchema);
  export default generatedPayoutsModel;