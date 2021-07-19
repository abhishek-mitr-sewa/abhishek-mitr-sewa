import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://mitrsewa:kqO9SbktMRYZZ117@cluster0.mau8k.mongodb.net/mitrsewa?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true});


var conn = mongoose.Collection;
//const mongoosePaginate = require('mongoose-paginate-v2'); //first step
mongoose.set('useFindAndModify', false);
var usersDetailSchema = new mongoose.Schema({
    user_id: {type : mongoose.Schema.Types.ObjectId, ref: 'users'},
    f_name: {type : String},
    m_name: {type : String},
    l_name: {type : String},
    relative_name: {type : String},
    house_number: {type : String},
    street: {type : String},
    village_locality: {type : String},
    post_office: {type : String},
    city: {type : String},
    state: {type : String},
    blood_group: {type: String},
    fino_cif: {type : String},
    fino_pool_ac: {type : String},
    pin_code: {type : String},
    gender: {type : String},
    created_at: {
      type : Date,
      default:Date.now
    },
    status: String
  });

  //usersDetailSchema.plugin(mongoosePaginate); //second step

  var usersDetailModel = mongoose.model('users_detail', usersDetailSchema);
  export default usersDetailModel;