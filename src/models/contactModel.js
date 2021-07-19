import mongoose from 'mongoose';
import validator from 'validator';
const { Schema } = mongoose;

const contactModelSchema = new Schema({

    name:  {
        type: String,
        required:true,
    },
    mobile: {
        type:Number,
        required:true,
    },
    state:  {
        type:String,
        required:true,
    },
    city:  {
        type:String,
        required:true,
    },
    description: {
        type:String,
        required:true,
    },
    date: {
        type: Date, 
        default: Date.now 
       },
});

const contactModel = new mongoose.model("Contact",contactModelSchema);

export default contactModel;