import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { verify } from "jsonwebtoken"

const generateAccessTokenandRefershToken = async (userId)=>{

    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refershToken = user.generateRefreshToken();
    
        user.refreshToken = refershToken;
    
        await user.save({validateBeforeSave: false})
    
        return {accessToken,refershToken}
    } catch (error) {
        throw new ApiError(500,"There is Error while Creating generating refresh token and access token");
    }
}

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
    console.log(req);
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

const loginUser = asyncHandler(async (req,res)=>{
    // get data from ->req.body
    // check if empty or not
    // find user in db
    // check password correct or not
    // add access and refresh token and access token
    // send cookie
    console.log(req);
    const {username,email,password} = req.body;
    console.log(req.body);

    if(!username && !email) throw new ApiError(400,"Username or email required");

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user) throw new ApiError(404,"User not Exist register Yourself first");

    const passwordvalid = await user.isPasswordcorrect(password);

    if(!passwordvalid) throw new ApiError(405,"Password is Invalid");

    const {accessToken,refershToken} = await generateAccessTokenandRefershToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refershToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refershToken
            },
            "user logged in Sucessfully"
        )
    )
})

const logoutUser = asyncHandler(async (req,res)=>{
    

    // find user by its id update the refresh token
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refershToken:1
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refershToken",options)
    .json(new ApiResponse(200,{},"User logout Sucessfully"))
})

const refershAccessToken = asyncHandler(async(req,res)=>{

    // hit the endpoint and referesh the access token
    // user having in cookies 
    // user having doken than decode 

    const incomingToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingToken)
    {
        throw new ApiError(400,"Unauthorized Token(from cookies)");
    }

    try {
        const decodetoken = await verify.jwt(incomingToken,process.env.REFRESH_TOKEN_SECRET)
    
        if(!decodetoken) throw new ApiError(400,"Invalid refresh Token or token is Expired");
    
        const user= await User.findById(decodetoken?._id);
    
        if(!user)
        {
            throw new ApiError(400,"Token is Invalid");
        }
    
        if(user?.AccessToken!==incomingToken)
        {
            throw new ApiError("400","Token is Invalid or Expired");
        }
    
        const {accessToken,newrefershToken} = await generateAccessTokenandRefershToken(userId);
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refershToken",newrefershToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,refershToken:newrefershToken
                },
                "Access Token Is refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(400,"Something went wrong while Refershing Token");
    }

})

const changeCurrentPassword = asyncHandler(async (req,res)=>
{
    // get old password and new password from user
    // as we are changing password of login user 
    // we have information user via access token
    // find user in the database based id of user
    // check user password with old password

    const {oldPassword,newPassword} = req.body;

    // verify jwt add req.user.id

    const user = await User.findById(req.user?._id);

    const passwordcorrect = await user.isPasswordcorrect(oldPassword);

    if(!passwordcorrect)
    {
        throw new ApiError("Invalid Old Password");
    }

    user.password = newPassword;

    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password is Updated")
    )
})

const getCurrentUser = asyncHandler(async(req,res)=>
{
    return res
    .status(200)
    .json(
        new ApiResponse(200,req.user,"User Feteched Sucessfully")
    )
})

const updateAccontDetails = asyncHandler(async (req,res)=>
{
    // updating email and fullName of User
    // req.body->fullName,email
    // we already user id with us because updating details of user who logged in

    const {fullName,email} = req.body;

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:
            {
                fullName,email
            }
        },
        {
            new:true
        }
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(
        200,user,"Update The Account Details"
    ));

})

const updateUserAvatar = asyncHandler(async(req,res)=>
{
    const avatarpath = req.file?.path;

    if(!avatarpath)
    {
        throw new ApiError(400,"First Upload new Avatar");
    }

    const avatar = await uploadOnCloudinary(avatarpath);

    if(!avatar.url)
    {
        throw new ApiError(400,"There isssue to uploading Avatar on cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            avatar:avatar.url
        },
        {
            new:true
        }
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Avatar is Updated"));
})

const updateUserCoverImage = asyncHandler(async(req,res)=>
    {
        const coverImagepath = req.file?.path;
    
        if(!coverImagepath)
        {
            throw new ApiError(400,"Cover Image is not found in Files, first upload the cover Image");
        }
    
        const coverImage = await uploadOnCloudinary(coverImagepath);
    
        if(!coverImage.url)
        {
            throw new ApiError(400,"There isssue to uploading Cover Image on cloudinary");
        }
    
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                coverImage:coverImage.url
            },
            {
                new:true
            }
        ).select("-password")
    
        return res.status(200)
        .json(new ApiResponse(200,user,"Cover Image is Updated"));
    })



export
 {
    registerUser,
    loginUser,
    logoutUser,
    refershAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccontDetails,
    updateUserAvatar,
    updateUserCoverImage
  }