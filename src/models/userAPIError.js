import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://mitrsewa:kqO9SbktMRYZZ117@cluster0.mau8k.mongodb.net/mitrsewa?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true});

var conn = mongoose.Collection;
//const mongoosePaginate = require('mongoose-paginate-v2'); //first step
mongoose.set('useFindAndModify', false);
var userAPIErrorSchema = new mongoose.Schema({
    mobile_email: {
      type : String,
      required:true
    },
    error_message: {
      type : String,
      required : true,
    },
    api_name: {
      type : String,
    },
    created_at: {
      type : Date,
      default:Date.now
    }
  });

  //usersSchema.plugin(mongoosePaginate); //second step

  var userAPIErrorModel = mongoose.model('userAPIError', userAPIErrorSchema);
  export default userAPIErrorModel;