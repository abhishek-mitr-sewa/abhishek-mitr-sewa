import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://mitrsewa:kqO9SbktMRYZZ117@cluster0.mau8k.mongodb.net/mitrsewa?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true});

var conn = mongoose.Collection;
//const mongoosePaginate = require('mongoose-paginate-v2'); //first step
mongoose.set('useFindAndModify', false);
var kycSchema = new mongoose.Schema({
    user_id: {type : mongoose.Schema.Types.ObjectId, ref: 'users'},
    full_name: {type : String},
    bank_name: {type : String},
    branch_name: {type : String},
    ifsc_code: {type : String},
    upi_id: {type : String},
    account_number: {type: String},
    aadhar_number: {type : String},
    pan_number: {type : String},
    aadhar_front:{type : String},
    aadhar_back:{type : String},
    pan_front: {type : String},
    bc_agent_agreement: {type : String}, 
    bank_detail_status: {type : String},
    kyc_status: {type : String},
    approved_by: {type : String},
    created_at: {
      type : Date,
      default:Date.now
    },
    status: {type : String}
  });

  //usersSchema.plugin(mongoosePaginate); //second step

  var kycModel = mongoose.model('kyc_details', kycSchema);
  export default kycModel;