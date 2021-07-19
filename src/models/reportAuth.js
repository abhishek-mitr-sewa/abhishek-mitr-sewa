import mongoose from 'mongoose';

var conn = mongoose.Collection;
//const mongoosePaginate = require('mongoose-paginate-v2'); //first step
mongoose.set('useFindAndModify', false);
var reportAuthSchema = new mongoose.Schema({
    mobile: {
      type : String,
      required:true
    },
    state: {
      type : String,
      required : true},
    type: {
      type : String,
      required : true
    },
    created_at: {
      type : Date,
      default:Date.now
    }
  });

  //usersSchema.plugin(mongoosePaginate); //second step

  var reportAuthModel = mongoose.model('report_auth', reportAuthSchema);
  export default reportAuthModel;