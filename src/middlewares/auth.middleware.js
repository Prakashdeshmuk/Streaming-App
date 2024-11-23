import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"

const verifyJWT = asyncHandler(async (req,_,next)=>{
    try {
        console.log(req);
        const token = req.cookies?.accessToken || req.header("Authorization").replace("Bearer ","");
    
        if(!token)
        {
            throw new ApiError(409,"unauthoized request");
        }
    
        const decodetoken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        // to decode the token give token and its secreat 
    
        const user = await User.findById(decodetoken?._id).select("-password -refreshtoken");
    
        if(!user)
        {
            throw new ApiError(404,"Invalid token");
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(400,"Something went wrong while verify the user token")
    }
})

export {verifyJWT}