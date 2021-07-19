import mongoose from 'mongoose';

var conn = mongoose.Collection;
//const mongoosePaginate = require('mongoose-paginate-v2'); //first step
mongoose.set('useFindAndModify', false);
var otpSchema = new mongoose.Schema({
    mobile_email: {
      type : String,
      required:true
    },
    otp: {
      type : String,
      required : true,
      index:{
        unique: true
    }},
    otp_status: {
      type : String,
      required : true
    },
    created_at: {
      type : Date,
      default:Date.now
    }
  });

  //usersSchema.plugin(mongoosePaginate); //second step

  var otpModel = mongoose.model('otp', otpSchema);
  export default otpModel;