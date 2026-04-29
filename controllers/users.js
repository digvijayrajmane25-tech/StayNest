const User = require("../models/user.js");

module.exports.renderSignupFrom = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        req.login(registeredUser, (err)=>{
            if(err){
                return next(err);
            }
            req.flash("success", "Welcome to WonderLust!");
            res.redirect("/listings")
        })
        
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}

module.exports.renderLoginFrom = (req, res) => {
    res.render("users/login.ejs");
}

module.exports.login = async (req, res) => {
req.flash( "success", "Welcome to StayNest!");
res.redirect(res.locals.redirectUrl || "/listings");
}

module.exports.logout = (req, res)=>{
    req.logOut((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    })
}


