import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://mitrsewa:kqO9SbktMRYZZ117@cluster0.mau8k.mongodb.net/mitrsewa?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true});

var conn = mongoose.Collection;
//const mongoosePaginate = require('mongoose-paginate-v2'); //first step
mongoose.set('useFindAndModify', false);
var usersSchema = new mongoose.Schema({
    email: {
      type : String,
      required:true,
      index:{
        unique: true
    }},
    mobile: {
      type : String,
      required : true,
      index:{
        unique: true
    }},
    fullname: {
      type : String
    },
    password: {
      type : String,
      required : true
    },
    whatsapp_no: {
      type : String
    },
    dob: {
      type : String
    },
    referl_code: {
      type : String
    },
    referrer_code: {
      type : String
    },
    profile_image : {type: String,required:true,}, 
    email_status: {
      type : String
    },
    mobile_status: {
      type : String
    },
    amazon_email: {
      type : String,
    },
    amazon_mobile: {
      type : String,
    },
    kyc_status: {
      type : String
    },
    payment_status: {
      type : String
    },
    user_type: {
      type : String
    },
    token: {
      type : String,
      required:true
    },
    last_login: {
      type : String
    },
    created_at: {
      type : Date,
      default:Date.now
    },
    status: {type : String}
  });

  //usersSchema.plugin(mongoosePaginate); //second step

  var usersModel = mongoose.model('users', usersSchema);
  export default usersModel;