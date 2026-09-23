import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "")
    
        if(!token) {
            throw new ApiError(401,"unauthorized request")
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user) {
            throw new ApiError(401,"Invalid Access token")
        }
    
        req.user = user;

        //In JavaScript, objects are dynamic—
        // you can attach new properties to them at any time using dot notation (object.propertyName = value).
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
    }

})