import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://mitrsewa:kqO9SbktMRYZZ117@cluster0.mau8k.mongodb.net/mitrsewa?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true});

var conn = mongoose.Collection;
//const mongoosePaginate = require('mongoose-paginate-v2'); //first step
mongoose.set('useFindAndModify', false);
var paymentSchema = new mongoose.Schema({
  user_id: {type : mongoose.Schema.Types.ObjectId, ref: 'users'},
  transcation_id: {type : String},
  total_amount: {type : String},
  devivce_amount: {type : String},
  gstCost: {type : String},
  trans_Status: {type : String},
  payment_mode: {type : String},
  full_name: {type : String},
  trans_date: {type : String},
  email: {type : String},
  actualAmount: {type: String, default: "0"},
  doneByAdmin : { type: Boolean, default: false},
  mobile: {
    type : String,
    required:true
  },
  
  created_at: {
    type : Date,
    default:Date.now
  }

  });

  //usersSchema.plugin(mongoosePaginate); //second step

  var paymentModel = mongoose.model('payment_success', paymentSchema);
  export default paymentModel;