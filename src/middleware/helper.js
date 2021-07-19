var fs = require('fs');
var path = require ('path');
const session = require("express-session");
const axios = require("axios");
import Storage from "local-storage";
import crypto from "crypto";
import base64 from "base-64";
import utf8 from "utf8";
import app from "../app";
import usersModel from "../models/users";
import usersDetailModel from "../models/usersDetail";
const { encode } = require('punycode');

var OPENSSL_CIPHER_NAME = "aes-128-cbc";
var CIPHER_KEY_LEN = 16;
var fs = require('fs');

export default {

    getYesterdayDTFN: function (type) {
        if(type== 'yesterday'){
            // ---------- Get Yesterday Start Date ---------------------- 
            const ydt1 = new Date(new Date().setDate(new Date().getDate() - 1));
            const withoutTimeydt1 = ydt1.toJSON().split("T")[0];
            const yestrdyStartDT = withoutTimeydt1 + "T00:00:00.0Z";

        // ---------- Get Yestreday End Date ----------------------
            const cdt1 = new Date(new Date().setDate(new Date().getDate() - 1));
            const withoutTimecdt1 = cdt1.toJSON().split("T")[0];
            const ytsEndDT = withoutTimecdt1 + "T23:59:59.0Z";

            return {'startDate': yestrdyStartDT, 'endDate': ytsEndDT};
        }else if(type== 'monthFirstDay'){
             // ---------- Get Month First Date ----------------------
          var date = new Date();
          var montFirstDay = new Date(date.getFullYear(), date.getMonth(), 1);
          const withoutTimemontFirstDay = montFirstDay.toJSON().split("T")[0];
          const monthFirstDay = withoutTimemontFirstDay + "T23:59:59.0Z";
          return {"date": monthFirstDay};
        }
        
        
    },

    newFileUploadsFN : function (uploadFile, dir){
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        let uploadPath;
        let check = true;
        let imgList = ['.png','.jpg','.jpeg','.pdf', '.PNG','.JPG','.JPEG'];

        /* if (!fileData || Object.keys(fileData).length === 0) {
                return {"status" : "error", "message" : 'No files were uploaded.'};
                check = false;
        } */

        //uploadFile = fileData.profile_image;
        uploadPath = dir+'/'+uploadFile.name;

        let extName = path.extname(uploadFile.name);
        //let baseName = path.basename(uploadFile.name, extName);
        // return {"status" : "error", "message" : 'Only JPG and PNG file type is allowed.'};
        if(!imgList.includes(extName)){
            return {"status" : "error", "message" : 'Only JPG and PNG file type is allowed.'};
            check = false;
        }else if(uploadFile.size > 10485760){
            //fs.unlinkSync(uploadFile.tempFilePath);
            return {"status" : "error", "message" :'Please upload less than 1 MB file size.'};
            check = false;
            //return res.status(413).send("File is too Large");
        }

        if(check){
            uploadFile.mv(uploadPath);
            return {"status" : "success", 'message': uploadFile.name};
        }
    },
    fileUploadsFN : function (fileData, uploadFile, dir){
        try {
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir, { recursive: true });
            }
            let uploadPath;
            let check = true;
            let imgList = ['.png','.jpg','.jpeg','.pdf', '.PNG','.JPG','.JPEG', '.PDF'];
    
            if (!fileData || Object.keys(fileData).length === 0) {
                    return {"status" : "error", "message" : 'No files were uploaded.'};
                    check = false;
            }
    
            //uploadFile = fileData.profile_image;
            uploadPath = dir+'/'+uploadFile.name;
    
            let extName = path.extname(uploadFile.name);
            //let baseName = path.basename(uploadFile.name, extName);
            // return {"status" : "error", "message" : 'Only JPG and PNG file type is allowed.'};
            if(!imgList.includes(extName)){
                return {"status" : "error", "message" : 'Only JPG and PNG file type is allowed.'};
                check = false;
            }else if(uploadFile.size > 10485760){
                //fs.unlinkSync(uploadFile.tempFilePath);
                return {"status" : "error", "message" :'Please upload less than 1 MB file size.'};
                check = false;
                //return res.status(413).send("File is too Large");
            }
    
            if(check){
                uploadFile.mv(uploadPath);
                return {"status" : "success", 'message': uploadFile.name};
            }
        } catch (error) {
            console.log(error);
        }
        
    },

    allFileTypeUploadsFN : function (fileData, uploadFile, dir){
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        let uploadPath;
        let check = true;
       
        let imgList = ['.png','.jpg','.jpeg','.pdf', '.doc', '.xls', '.txt', '.PNG','.JPG','.JPEG'];

        if (!fileData || Object.keys(fileData).length === 0) {
                return {"status" : "error", "message" : 'No files were uploaded.'};
                check = false;
        }

        //uploadFile = fileData.profile_image;
        uploadPath = dir+'/'+uploadFile.name;

        let extName = path.extname(uploadFile.name);
        //let baseName = path.basename(uploadFile.name, extName);
        // return {"status" : "error", "message" : 'Only JPG and PNG file type is allowed.'};
        if(!imgList.includes(extName)){
            return {"status" : "error", "message" : 'Only JPG and PNG file type is allowed.'};
            check = false;
        }else if(uploadFile.size > 10485760){
            //fs.unlinkSync(uploadFile.tempFilePath);
            return {"status" : "error", "message" :'Please upload less than 1 MB file size.'};
            check = false;
            //return res.status(413).send("File is too Large");
        }

        if(check){
            uploadFile.mv(uploadPath);
            return {"status" : "success", 'message': uploadFile.name};
        }
    },

    csvFileUploadsFN : function (fileData, uploadFile, dir){
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        let uploadPath;
        let check = true;
        let imgList = ['.csv'];

        if (!fileData || Object.keys(fileData).length === 0) {
                return {"status" : "error", "message" : 'No files were uploaded.'};
                check = false;
        }

        //uploadFile = fileData.profile_image;
        uploadPath = dir+'/'+uploadFile.name;
        
        let extName = path.extname(uploadFile.name);
        //let baseName = path.basename(uploadFile.name, extName);
        // return {"status" : "error", "message" : 'Only JPG and PNG file type is allowed.'};
        if(!imgList.includes(extName)){
            return {"status" : "error", "message" : 'Only JPG and PNG file type is allowed.'};
            check = false;
        }else if(uploadFile.size > 10485760){
            //fs.unlinkSync(uploadFile.tempFilePath);
            return {"status" : "error", "message" :'Please upload less than 1 MB file size.'};
            check = false;
            //return res.status(413).send("File is too Large");
        }
        if(check){
            uploadFile.mv(uploadPath);
            return {"status" : "success", 'message': uploadFile.name};
        }else{
            console.log(' Fix this issu --- '+check);
        }
    },
    
    isEmpty: function (value) {
        return (
        value === undefined ||
        value === null ||
        (typeof value === 'object' && Object.keys(value).length === 0) ||
        (typeof value === 'string' && value.trim().length === 0))
        
    },
    
    sendSMSFN : function (number, otp){
        let message = 'Dear Member, '+otp+' is your one-time password (OTP). Please enter the OTP to preceded. Thank you, MitrSewa';
       

        var url = 'http://sms.textmysms.com/app/smsapi/index.php?key=36023BF912B118&campaign=0&routeid=13&type=text&contacts='+number+'&senderid=MITRSE&msg='+message;
        
        axios.get(url).then(function (response) {
            //console.log(response);
        }).catch(function (error) {
           console.log('Enter in send message cath section- '+error);
        });

        return true;
    },

    getFormattedDateFN(admin_date) {
        let current_datetime = new Date(admin_date);
        let formatted_date = (current_datetime.getDate()).toString() + "." + (current_datetime.getMonth() + 1).toString() + "." + current_datetime.getFullYear(); // + " " + formatAMPM(current_datetime);
        return formatted_date;
    },

    
    checkLeftMenuFN : function (req, res){
        try {
            let usertyp = req.session.user.user_type;
            if(usertyp){
                if(usertyp.toUpperCase() === 'ADMIN'){
                    return 'layouts/leftmenu';
                }else if(usertyp.toUpperCase() === 'USER'){
                    return 'layouts/inner-leftmenu';
                } else if(usertyp.toUpperCase() === 'AGENT' || usertyp.toUpperCase() === 'BC'){ 
                    return 'layouts/agents-leftmenu';
                } else {
                   return false;
                }
            }else{
                return false;
            }
        } catch(e) {
            return false;
        }      
        
    },
    
    
    // check USER is ligin or not -- 
    checkLogin : function (req, res, next){
        try {
        if(!req.session.token)
            res.redirect('/login');
        } catch(err) {
       
        }
        next();
    },

    checkAreaManagerFN : function (mobile){
        try {
            //console.log(mobile);
            const assignState = [
                "ASSAM", 
                'BIHAR', 
                "JHARKHAND",
                "CHHATTISGARH", 
                'MADHYA PRADESH', 
                 "RAJASTHAN", 
                "UTTARAKHAND", 
                 "UTTAR PRADESH", 
                 "UTTAR PRADESH", 
                 "WEST BENGAL",
                 "ODISHA", 
                 "PUNJAB", 
                 "HARYANA", 
                 "DELHI", 
                 "HIMACHAL PRADESH",
                 "UTTAR PRADESH"
            ];
            const mobileNmbr = [
                "9707380268", 
                "8651095250", 
                "9151005283", 
                "9151154175", 
                "9151154180", 
                "9602943434", 
                "9151154167", 
                "9628880669",
                "7007122626", 
                "8972185211", 
                "9151154179", 
                "9151154161", 
                "9151154161", 
                "5000000000",
                "9151154161",
                "8400020189"
            ];
            const areaManageName = [
                 "Pintu Sarkar", 
                 "Ganesh Kumar", 
                 "Manoj Kumar Ram", 
                 "Shivam Chitransh", 
                 "Prashant Singh", 
                 "Pradeep Mehta", 
                 "Madan Gopal", 
                 "Ravindra Chauhan", 
                 "Abhay Tripathi", 
                 "Shubhasis Mukherjee", 
                 "JAGNYA RAJGURU", 
                 "Babu Lal Singh", 
                 "Babu Lal Singh", 
                 "Prashant Singh",
                 "Babu Lal Singh",
                 "Arvind Singh"
            ];
            var areaManagerNameMobile = '';
            
            for(var i=0; i<mobileNmbr.length; i++){
               
                if(mobileNmbr[i]==mobile){
                areaManagerNameMobile = areaManageName[i]+'__'+mobileNmbr[i]+'__'+assignState[i];
                    break;
                }
            }
            
            return areaManagerNameMobile;

        } catch(error) {
            console.log(error.message);
        }      
        
    },

    getAreaManagerImageByState : function (state){
        try{
            let sate;
            switch (state) {
            case "ASSAM":
                sate = "pintu_sarkar.png";
                break;
            case "BIHAR":
                sate = "ganesh.png";
                break;
            case "JHARKHAND":
                sate = "manoj_kumar.png";
                break;
            case "CHHATTISGARH":
                sate = "ravindra_chauhan.png";
                break;
            case "MADHYA PRADESH":
                sate = "prasant_singh.png";
                break;
            case "RAJASTHAN":
                sate = "gaurav_vasisth.png";
                break;
            case "UTTARAKHAND":
                sate = "manmohan.png";
                break;
            case "UTTAR PRADESH EAST1":
                sate = "ravindra_chauhan.png";
                break;
            case "UTTAR PRADESH EAST2":
                    sate = "abhay.png";
                    break;
            case "WEST BENGAL":
                sate = "subhaashish.png";
                break;
            case "ODISHA":
                sate = "ravindra_chauhan.png";
                break;
            case "PUNJAB":
                sate = "ravindra_chauhan.png";
                break;
            case "HARYANA":
                sate = "ravindra_chauhan.png";
                break;
            case "DELHI":
                sate = "prasant_singh.png";
                break;
            case "HIMACHAL PRADESH":
                sate = "ravindra_chauhan.png";
                break;
            case "UTTAR PRADESH WEST":
                sate = "arvind_singh.png";
                break;
            default:
                sate = "ravindra_chauhan.png";
            }

            return sate;
            
        }catch(error){
            console.log(error);
        }
    },

    // --------------   SAB PAISA Payment Gatway AUTH Code Here ------------------
    jointimes : function (char, len) {
        var i = 0;
        var str = char;
        while (i < len) {
            str += char;
            i++;
        }
        return str;

    },
    pad : function (str, char, len) {

        if (str.length >= len)
            return str;
        else {

            return str + (char + this.jointimes(char, len - str.length));
        }
    },

    encrypt : function (plain_text, encryptionMethod, secret, iv) {
        var encryptor = crypto.createCipheriv(encryptionMethod, secret, iv);
        return encryptor.update(plain_text, 'ascii', 'base64') + encryptor.final('base64');
    },

    decrypt : function (encryptedMessage, encryptionMethod, secret, iv) {
        var decryptor = crypto.createDecipheriv(encryptionMethod, secret, iv);
        return decryptor.update(encryptedMessage, 'base64', 'ascii') + decryptor.final('ascii');
    },
    
    underScoreFixpay : function (key) {
        if (key.length < CIPHER_KEY_LEN) {
            return this.pad(key, "0", CIPHER_KEY_LEN);

        }
        else if (key.length > CIPHER_KEY_LEN) {
            return key.substring(0, OPENSSL_CIPHER_NAME,);
        }
        else
            return key;
    },

    underScoreEncrypt : function (key, iv, data) {
        //console.log(`Data value is : ${data}`)
        // var encodedEncryptedData = base64.encode(utf8.encode(Auth.encrypt(data, Auth.OPENSSL_CIPHER_NAME, key, iv)));
        var encodedEncryptedData = new Buffer.from(this.encrypt(data, OPENSSL_CIPHER_NAME, key, iv));
        var encodedIV = base64.encode(utf8.encode(iv));
        var encryptedPayload = encodedEncryptedData + ":" + encodedIV;
        //console.log(`$encryptedPayload value is :' ${encryptedPayload}`);
        // console.log(`$decrypted data value is :' ${Auth.decrypt(encodedEncryptedData, Auth.OPENSSL_CIPHER_NAME, key, iv)}`);
        while (encryptedPayload.includes('+')) { // replace + with %2B
            encryptedPayload = encryptedPayload.replace('+', "%2B")
        }
        return encryptedPayload;
    },

    underScoreDecrypt : function (key, iv, data) {
        while (data.includes('%2B')) { // replace + with %2B
            data = data.replace('%2B', "+")
        }
        var parts = data.split(':');                      //Separate Encrypted data from iv.
        var encrypted = parts[0];
        // iv = parts[1];
        var $decryptedData = this.decrypt(encrypted, OPENSSL_CIPHER_NAME, key,iv);
        // var $decryptedData = Auth.decrypt(Buffer.from(encrypted, 'base64').toString('ascii'), Auth.OPENSSL_CIPHER_NAME, key, Buffer.from(iv));
        return $decryptedData;
    },

    underScoreChecksum : function (secretKey, postData) {
       // console.log('client side postData before checksum String'.postData)

        //creating hmac object 
        var hmac = crypto.createHmac('sha256', secretKey);
        //passing the data to be hashed
        var data = hmac.update(postData);
        //Creating the hmac in the required format
        var gen_hmac = data.digest('base64');
        //Printing the output on the console
        //console.log("hmac : " + gen_hmac);

        return gen_hmac;
    }

    // ------------------------  END  --------------------


}