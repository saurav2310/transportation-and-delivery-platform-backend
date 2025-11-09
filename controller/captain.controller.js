const captainModel = require('../models/captain.model');
const blacklistTokenModel = require('../models/blacklistToken.model');
const captainService = require('../services/captain.service');
const {validationResult} = require('express-validator');



module.exports.registerCaptain = async (req,res,next)=>{
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const {fullname,email,password,vehicle} = req.body;
    try{
        const existingCaptain = await captainModel.findOne({email:email});
        if(existingCaptain){
            return res.status(400).json({message:'Captain with this email already exists'});
        }

        
        const newCaptain = await captainService.createCaptain({
            firstname: fullname.firstname,
            lastname: fullname.lastname,
            email,
            password, // raw password - service will hash it
            color: vehicle.color,
            plate: vehicle.plate,
            capacity: vehicle.capacity,
            vehicleType: vehicle.vehicleType,
        });
        const token = newCaptain.generateAuthToken();
        res.status(201).json({token,newCaptain});
    }
    
    catch(err){
        next(err);
    }
    
}

module.exports.loginCaptain = async (req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const {email,password} = req.body;
    try{
        const captain = await captainModel.findOne({email:email}).select('+password');
        if(!captain){
            return res.status(400).json({message:'Invalid email or password'});
        }
        const isMatched = await captain.comparePassword(password);

        if(!isMatched){
            return res.status(401).json({message:'Invalid email or password'});
        }
        const token = captain.generateAuthToken();
        res.cookie('token',token);
        res.status(200).json({token,captain});
    }catch(err){
    }
}

module.exports.getCaptainProfile = async (req,res,next)=>{
    try{
        const captain = req.captain;
        res.status(200).json({captain});
    }catch(err){
        next(err);
    }
}

module.exports.logoutCaptain = async (req,res,next)=>{
    try{
        const token = req.cookies.token||req.header('Authorization')?.replace('Bearer ','');
        await blacklistTokenModel.create({token});
        res.clearCookie('token');
        res.status(200).json({message:'Logged out successfully'});
    }catch(err){
        next(err);
    }
}