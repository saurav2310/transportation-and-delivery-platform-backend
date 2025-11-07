const captainModel = require('../models/captain.model');
const captainService = require('../services/caprain.service');
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

        const hashedPassword = await captainModel.prototype.hashPassword(password);
        const newCaptain = await captainService.createCaptain({
            firstname:fullname.firstname,
            lastname:fullname.lastname,
            email,
            password:hashedPassword,
            color:vehicle.color,
            plate:vehicle.plate,
            capacity:vehicle.capacity,
            vehicleType:vehicle.vehicleType,
        });
        const token = newCaptain.generateAuthToken();
        res.status(201).json({token,newCaptain});
    }
    
    catch(err){
        next(err);
    }
    
}