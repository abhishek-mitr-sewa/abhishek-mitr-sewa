import mongoose from 'mongoose';

var bimaSchema = new mongoose.Schema({
        name: {
            type : String,
            required:true,
        },
        mobile: {
            type : Number,
            required:true,
        },
        state: {
            type : String,
            required:true,
        },
        clients: {
            type : Number,
            required:true,
        },
        clientdata: {
            type : Array,
        },
        yesterday_clients: {
            type : Number,
            required:true,
        },
        previous_month_clients: {
            type : Number,
            required:true,
        },
  });


  var bimaModel = mongoose.model('bimadata', bimaSchema);
  export default bimaModel;