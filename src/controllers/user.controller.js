import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = generateAccessToken()
        const refreshToken = generateRefreshToken()

        user.refreshToken = refreshToken
        await refreshToken.save({validateBeforeSave : false})


        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(400,"Something went wrong while generating Access token and refresh token")
    }
}

const registerUser = asyncHandler(async (req,res) => {
    res.status(200).json({
        message : "ok"
    })


    // get user detail from frontend
    // validation - not empty
    // check if user already exist - username , email
    // check for images , check for avatar
    // upload them into cloudinary , avatar
    // create user object - entry in user db
    // remove password and refresh token feild from response
    // check for user creation
    // return response

    const {fullName, email, username, password} = registerUser.body
    if(
        [fullName, email, username, password].some((field) => 
        field?.trim === "")
    ) {
        throw new ApiError(400,"all fields are required")
    }

    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })

    if(existedUser) {
        throw new ApiError(409,"User with email or username already exist");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400,"Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(User._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500,"something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )

})

const loginUser = asyncHandler(async (req,res) => {
    //req body - data
    //username or email
    //find the user
    //check password
    //access and refresh token
    //send cookie

    const {username, email, password} = req.body

    if(!email && !username) {
        throw new ApiError(400,"email and username is required")
    }

    const user = await User.findOne({
        $or : [{email},{username}]
    })

    if(!user) {
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401,"invalid user credentials")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser , accessToken , refreshToken
            },
            "user loggedIn successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken : undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("refreshToken",options)
    .clearCookie("accessToken",options)
    .json(new ApiResponse(200, {}, "user loggedout"))
})

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401,"unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        /* It(jwt.verify) performs three checks simultaneously:
        1 -> signature verificaiton
        2 -> expiry check
        3 -> payload decoding
        */

        

        //decodedToken is a plain JavaScript object containing whatever payload data you put inside the token 
        // when you created it using jwt.sign(), along with automatic metadata added by JWT.
    
        const user = await User.findById(decodedToken?._id)

        // decodedToken?._id   ->  A plain JavaScript String extracted from the decoded JWT payload.
    
        if(!user) {
            throw new ApiError(401,"invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"refresh token is expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken , newRefreshToken} = await generateAccessAndRefreshTokens(user?._id)

        // user?._id  -> A Mongoose ObjectId object retrieved directly from MongoDB.
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken , newRefreshToken},
                "access token refreshed successfully"
            )
        )
    } catch (error) {
        new ApiError(400,error?.message || "Invalid refresh token")
    }



})


export {registerUser , loginUser , logoutUser , refreshAccessToken}
