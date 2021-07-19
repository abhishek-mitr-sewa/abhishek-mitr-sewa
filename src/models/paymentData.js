import mongoose from 'mongoose';

var conn = mongoose.Collection;
//const mongoosePaginate = require('mongoose-paginate-v2'); //first step
mongoose.set('useFindAndModify', false);
var paymentDataSchema = new mongoose.Schema({
  user_id: {type : mongoose.Schema.Types.ObjectId, ref: 'users'},
  mobile_email: {type : String},
  server_data: {type : String},
  payment_status: {type : String},
  transcation_id: {type : String},
  request_type: {type : String},
  actualAmount: {type: String, default: "0"},
  created_at: {
    type : Date,
    default:Date.now
  }
});

  //usersSchema.plugin(mongoosePaginate); //second step

  var paymentDataModel = mongoose.model('paymentData', paymentDataSchema);
  export default paymentDataModel;