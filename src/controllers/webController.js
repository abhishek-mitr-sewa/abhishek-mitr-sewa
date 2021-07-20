import Storage from "local-storage";
const { check, validationResult } = require('express-validator');
import contactModel from "../models/contactModel";
class webController {

  async index (req, res, next){
    res.render('website/index', {title: 'Mitr Sewa', status: 1, message: null });
  }

  async team (req, res, next){
    res.render('website/team', {title: 'Team', status: 1, message: null });
  }

  async jobs (req, res, next){
    res.render('website/jobs', {title: 'JObs', status: 1, message: null });
  }

  async blog (req, res, next){
    res.render('website/blog', {title: 'Blog', status: 1, message: null });
  }

  async contact (req, res, next){
    res.render('website/contact', {title:"Help|Contact Us", status:"a",message:"" });
  }



async contactPost (req,res,next){
    try{
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render('website/contact',{title:"Help|Contact Us",  message: errors.mapped(), status:0});
        }else{
            let insertContact = new contactModel({
                name: req.body.name,
                mobile: req.body.mobile,
                state: req.body.state,
                city: req.body.city,
                description: req.body.description
            });
            const result = await insertContact.save();
            //console.log(result);
            res.render('website/contact',{title:"Help|Contact Us",  message: 'Query submitted successfully.We will Contact you soon.', status:1});
        }

    }catch(error){
        console.log(error);
    }
}

  async documents (req, res, next){
    res.render('website/branches', {title: 'Teams', status: 1, message: null });
  }

  async blog_details (req, res, next){
    res.render('website/blog_details/bank_mitr_kaise_bnayen_details', {title: 'About', status: 1, message: null });
  }

  async services (req, res, next){
    res.render('website/services', {title: 'Services', status: 1, message: null });
  }

  async logout (req, res, next) {
    req.session.destroy(function(err) {
      if(err) {
        res.redirect('/login');
      }
      Storage.clear();
      res.clearCookie('sid');
      res.redirect('/login');
    }); 
  }

  //First  Blog 
  async mitr_sewa_kendra (req, res, next) {
    try{
      //console.log('hello');
      res.render('website/blog_details/how-to-open-mitr-sewa-kendra', {title: 'How to open mitr Sewa Kendra ?', status: 1, message: null })
    }catch(error){
      console.log(error);
    }
  }
//Second Blog
  async blog_start_own_business(req, res, next){
    try{
      res.render('website/blog_details/start-own-business', {title: ' Want to start your own business ?', status: 1, message: null })
    
    }catch (error){
      console.log(error);
    }
  }
  
  //Third Blog
  async blog_banker_of_area(req, res, next){
    try{
      res.render('website/blog_details/banker-of-area', {title: 'Banker of your Area: Bank Mitr', status: 1, message: null })
    
    }catch (error){
      console.log(error);
    }
  } 
  
}

export default new webController();