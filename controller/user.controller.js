const userModel = require("../models/user.model");
const userService = require("../services/user.service");
const { validationResult } = require("express-validator");
const blacklistTokenSchema = require("../models/blacklistToken.model");

module.exports.registerUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { fullname, email, password } = req.body;

    const existingUser = await userModel.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

  const hashedPassword = await userModel.hashPassword(password);

  const user = await userService.createUser({
    firstname:fullname.firstname,
    lastname:fullname.lastname,
    email:email,
    password:hashedPassword,
  });
  
  const token = user.generateAuthToken();
  res.status(201).json({token,user});
};

module.exports.loginUser = async (req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }

    const {email,password} = req.body;

    const user = await userModel.findOne({email}).select("+password");

    if(!user){
        return res.status(401).json({message:'Invalid email or password'});
    }

    const isPasswordValid = await user.comparePassword(password);

    if(!isPasswordValid){
        return res.status(401).json({message:'Invalid email or password'});
    }

    const token = user.generateAuthToken();
    res.cookie('token',token);
    res.status(200).json({token,user});

}


module.exports.getUserProfile = async (req,res,next)=>{
    // Assuming user is authenticated and user ID is available in req.userId
    // const userId = req.userId;
    res.status(200).json(req.user)
};

module.exports.logoutUser = async (req,res,next)=>{
    res.clearCookie('token');
    const token = req.cookies.token||req.header('Authorization')?.replace('Bearer ', '');
    if(token){
        const blacklistedToken = new blacklistTokenSchema({token});
        await blacklistedToken.save();
    }
    res.status(200).json({message:'Logged out successfully'});
}