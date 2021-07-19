import mongoose from 'mongoose';

var conn = mongoose.Collection;
//const mongoosePaginate = require('mongoose-paginate-v2'); //first step
mongoose.set('useFindAndModify', false);
var marqMsgSchema = new mongoose.Schema({
  title: {type : String},
  message: {type : String},
  notification_file: {type : String},
  type: {type : String},
  status: {type : String},
  created_at: {
    type : Date,
    default:Date.now
  }
});

  //usersSchema.plugin(mongoosePaginate); //second step

  var marqMsgModel = mongoose.model('marque_message', marqMsgSchema);
  export default marqMsgModel;