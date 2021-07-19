export default {
    checkAdminAuthentication: (req, res, next)=> { 
       
        if(typeof req.session.user !== "undefined") {
            if((req.session.user.user_type.toUpperCase() == "ADMIN") || (req.session.user.user_type.toUpperCase() == "COMPANY") || (req.session.user.user_type.toUpperCase() == "AM")){
                next();
            }
            
        } else {
            res.redirect("/login");
        }
    },

    checkUserAuthentication: (req, res, next)=> { 
        if(typeof req.session.user !== "undefined") {
            if(req.session.user.user_type.toUpperCase() == "USER" || req.session.user.user_type.toUpperCase() == "BC" || req.session.user.user_type.toUpperCase() == "EWS" || req.session.user.user_type.toUpperCase() == "NEWEWS") {
                next();
            }
        }else {
            res.redirect("/login");
        }
    },

    checkAgentAuthentication: (req, res, next)=> {  
        if(typeof req.session.user !== "undefined") {
            if(req.session.user.user_type.toUpperCase() == "AGENT") {
                next();
            }  
        } 
         else {
            res.redirect("/login");
        }
    },

    // checkOtherAuthentication: (req, res, next)=> {   
    //     if((req.session && req.session.user && req.session.user.user_type.toUpperCase() == "ACCOUNT") || (req.session.user.user_type.toUpperCase() == "MARKETING")) {
    //         next();
    //     } else {
    //         console.log(req.session.user.user_type.toUpperCase());
    //         res.redirect("/login");
    //     }
    // },

    checkIfAuthenticated: (req) => {
        if(req.session && req.session.user) {
            return true;
        } else {
            return false;
        }
    },

    checkTokenAuthentication: (req) => {
    try {
        if(req =='430F966CBAA9032DD200BEF3D6C2B0704399A6830E4B6F448512D36B435358B5') {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log('Auth error'+error.message);
    }
        
    }
}