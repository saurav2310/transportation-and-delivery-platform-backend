const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const blacklistTokenModel = require('../models/blacklistToken.model');


module.exports.authUser = async (req, res, next) => {
    const token = req.cookies.token||req.header('Authorization')?.replace('Bearer ', '');
    if(!token){
        return res.status(401).json({message:'Unauthorized'});
    }

    const blacklistedToken = await blacklistTokenModel.findOne({token});
    if(blacklistedToken){
        // return res.status(401).json({message:'Unauthorized'});
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded._id);
        if(!user){
            return res.status(401).json({message:'Unauthorized'});
        }    
        req.user = user;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({message:'Unauthorized'});
    }
};