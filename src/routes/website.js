import { Router } from 'express';
import webController from '../controllers/webController';
import adminController from '../controllers/adminController';
const { check, validationResult } = require('express-validator');
export default Router()
    .get('/login', adminController.index.bind(adminController))
    .get('/', webController.index.bind(webController))
    .get('/index', webController.index.bind(webController))
    .get('/team', webController.team.bind(webController))
    .get('/blog', webController.blog.bind(webController))
    .get('/contact', webController.contact.bind(webController))
    .post('/contact',
       [
           check('name', 'Name is required').not().isEmpty(),
           check('mobile', 'Mobile Number is required').not().isEmpty(),
           check('state', 'State is required').not().isEmpty(),
           check('city', 'City is required').not().isEmpty(),
           check('description', 'Description is required').not().isEmpty(),
       ],
       webController.contactPost.bind(webController)
    )
    .get('/blog-details', webController.blog_details.bind(webController))
    .get('/documentation', webController.documents.bind(webController))
    // .get('/about', webController.about.bind(webController))
    // .get('/enquiry', webController.jobs.bind(webController))
    .get('/logout', webController.logout.bind(webController)
    );