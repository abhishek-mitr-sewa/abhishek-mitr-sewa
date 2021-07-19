import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://mitrsewa:kqO9SbktMRYZZ117@cluster0.mau8k.mongodb.net/mitrsewa?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true});

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