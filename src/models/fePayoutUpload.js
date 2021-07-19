import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://mitrsewa:kqO9SbktMRYZZ117@cluster0.mau8k.mongodb.net/mitrsewa?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true});

var conn = mongoose.Collection;
//const mongoosePaginate = require('mongoose-paginate-v2'); //first step
mongoose.set('useFindAndModify', false);
var fePayoutUploadSchema = new mongoose.Schema({
    user_id: {type : mongoose.Schema.Types.ObjectId, ref: 'users'},
    pan_number: {
      type : String,
      required:true
    },
    amount: {
      type : Number,
      required : true
    },
    type: {
      type : String,
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
    status: {type: String},
    created_at: {
      type : Date,
      default:Date.now
    }
  });

  //fePayoutUploadSchema.plugin(mongoosePaginate); //second step

  var fePayoutModel = mongoose.model('fe_payouts', fePayoutUploadSchema);
  export default fePayoutModel;