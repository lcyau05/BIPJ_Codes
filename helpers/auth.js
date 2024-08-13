const ensureAuthenticated = (req,res,next) =>{
    console.log("In ensureAuthenticated!!")
    if(req.isAuthenticated()){ //if user is authenticated
        return next(); //calling next() to proceed to the next statement
    }
    console.log("Access Denied")
    res.redirect('/');
};
module.exports = ensureAuthenticated;