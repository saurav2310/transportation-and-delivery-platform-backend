const captainModel = require('../models/captain.model');
const bcrypt = require('bcrypt');

module.exports.createCaptain = async ({firstname,lastname,email,password,color,capacity,plate, vehicleType})=>{

if(!firstname||!lastname||!email||!password||!color||!capacity||!plate||!vehicleType){
    throw new Error('All fields are required');
}
const captain = captainModel.create({
    fullname:{
        firstname,
        lastname
    },
    email,
    password:await bcrypt.hash(password,10),
    vehicle:{
        color,
        plate,
        capacity,
        vehicleType
    }
})
return captain;
}