import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req,res)=>{
    // take user input from fronend
    // validate the input
    // upload avatar on cloudnary
    // check if avatar is uploade correct
    // cloudnary give url of avatar and coverImage(optional)
    // check if user exist or not
    // user is not exist then create object of user and upload on db
    // user is created sucessfully then return responce
    //console.log(req.body);
    const {username,email,fullName,password} = req.body;

    //console.log(email);

    if([username,email,fullName,password].some((field)=>
        field?.trim() === ""
    ))
    {
        throw new ApiError(400,"All fields are required")
    }

    const userExist = await User.findOne({
        "$or":[{username},{email}]
    })

    if(userExist)
    {
        throw new ApiError(409,"User is Already Exist")
    }

    //console.log(req.files);

    const avatarLocalpath = req.files?.avatar[0]?.path
    //const coverImagepath = req.files?.coverImage[0]?.path;

    let coverImagepath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImagepath = req.files?.coverImage[0]?.path;
    }

    if(!avatarLocalpath)
    {
        throw new ApiError(400,"Avatar is Required");
    }

    const avatar  = await uploadOnCloudinary(avatarLocalpath);
    const coverImage = await uploadOnCloudinary(coverImagepath);

    if(!avatar)
    {
        throw new ApiError(400,"Avatar is not uploaded on cloudinary");
    }

    const user = await User.create({
        fullName,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while Registering user");
    }

    return res.status(200).json(
        new ApiResponse(200,createdUser,"User Registered Sucessfully")
    )


})

export {registerUser}