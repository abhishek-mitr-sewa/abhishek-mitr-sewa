import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://mitrsewa:kqO9SbktMRYZZ117@cluster0.mau8k.mongodb.net/mitrsewa?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true});

var conn = mongoose.Collection;
//const mongoosePaginate = require('mongoose-paginate-v2'); //first step
mongoose.set('useFindAndModify', false);
var chooseDevicesSchema = new mongoose.Schema({
  user_id: {type : mongoose.Schema.Types.ObjectId, ref: 'users'},
  device_id: {type : String},
  device_quantity: {type : String},
  device_actual_amount: {type : String},
  device_total_amount: {type : String},
  created_at: {
    type : Date,
    default:Date.now
  }
});

  //usersSchema.plugin(mongoosePaginate); //second step

  var chooseDevicesModel = mongoose.model('choose_devices', chooseDevicesSchema);
  export default chooseDevicesModel;