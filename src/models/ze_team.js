import mongoose from 'mongoose';

var conn = mongoose.Collection;
//const mongoosePaginate = require('mongoose-paginate-v2'); //first step
mongoose.set('useFindAndModify', false);
var zeTeamSchema = new mongoose.Schema({
    user_id: {type : mongoose.Schema.Types.ObjectId, ref: 'users'},
    ze_referrer_code : {type:String},
    ze_user_id : {type : mongoose.Schema.Types.ObjectId, ref: 'users'},
    type:{type :String},
    status: {type : String},
    created_at: {
      type : Date,
      default:Date.now
    }
  });

  //usersSchema.plugin(mongoosePaginate); //second step

  var zeTeamModel = mongoose.model('ze_team', zeTeamSchema);
  export default zeTeamModel;