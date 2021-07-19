import mongoose from 'mongoose';

var conn = mongoose.Collection;
//const mongoosePaginate = require('mongoose-paginate-v2'); //first step
mongoose.set('useFindAndModify', false);
var payoutUploadSchema = new mongoose.Schema({
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

  //usersSchema.plugin(mongoosePaginate); //second step

  var payoutUploadModel = mongoose.model('payout_upload', payoutUploadSchema);
  export default payoutUploadModel;