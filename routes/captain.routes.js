const express = require("express");
const router = express.Router();
const captainController = require("../controller/captain.controller");
const authMiddleware = require("../middlewares/auth.middleware");
//express validator

const { body } = require("express-validator");

router.post(
  "/register",
  [
    body("fullname.firstname")
      .isLength({ min: 3 })
      .withMessage("firstname must be at least 3 characters long"),
    body("email").isEmail().withMessage("Please provide a valid email address"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("vehicle.color")
      .isLength({ min: 3 })
      .withMessage("Color must be at least 3 characters long"),
    body("vehicle.plate")
      .isLength({ min: 3 })
      .withMessage("Plate must be at least 3 characters long"),
    body("vehicle.capacity")
      .isInt({ min: 1 })
      .withMessage("Capacity must be at least 1"),
    body("vehicle.vehicleType")
      .isIn(["bike", "car", "auto"])
      .withMessage("Invalid vehicle type"),
  ],
  captainController.registerCaptain
);

router.post("/login",[
  body("email").isEmail().withMessage("Please provide a valid email address"),
  body("password").isLength({min:6}).withMessage("Password must be at least 6 characters long")
],captainController.loginCaptain);

router.get("/profile",authMiddleware.authCaptain,captainController.getCaptainProfile);
router.get("/logout",authMiddleware.authCaptain,captainController.logoutCaptain);
module.exports = router;
