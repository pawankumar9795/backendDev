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

const changeCurrentPassword = asyncHandler(async (req,res) => {
    const { oldPassword , newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400,"Invalid Old password")
    }

    user.password = newPassword

    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"password changed successfully"))


})

const getCurrentUser = asyncHandler(async (req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req,res) => {
    const { fullName , email} = req.body

    if(!fullName || !email) {
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndDelete(
        req.user?._id,
        {
            $set : {
                // fullName: fullName
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req,res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(400,"avatar file is missing")
    }

    // ToDo delete old image assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(400,"Error while uploading the avatar")
    }

    const user = await User.findByIdAndDelete(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req,res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400,"cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url) {
        throw new ApiError(400,"Error while uploading the cover image")
    }

    const user = await User.findByIdAndDelete(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req,res) => {
    const { username } = req.params

    /*
    req.params always parsed as Strings

    You set up a blank variable in the link:
    "/users/:username" (the colon : means "this part will change")
    A user clicks a link:
    "/users/alex"
    params grabs that value:
    params = "alex"
    */

    if(!username?.trim()) {
        throw new ApiError(400,"username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
            // it screens the documents in your collection and 
            // passes only the ones that match the specified condition to the next stage of the pipeline

            /*
            OUTPUT OF STAGE 1
            {
                "_id": "user_101",
                "username": "alexdev"
            }
            */
        },
        {
            $lookup: {
                from: "subscriptions",   //Subscription -> this will converted to subscriptions
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
            /*
            {
                "_id": "user_101",
                "username": "alexdev",
                "subscribers": [
                    { "subscriber": "user_202", "channel": "user_101" }
                ]
            }           
            */
        },
        {
            $lookup: {
                from: "subscriptions",   //Subscription -> this will converted to subscriptions
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
            /*
            {
                "_id": "user_101",
                "username": "alexdev",
                "subscribers": [
                    { "subscriber": "user_202", "channel": "user_101" } 
                ],
                "subscribedTo": [
                    { "subscriber": "user_101", "channel": "user_202" }
                ]
            }
            */
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        // subscribers contains the subscribers of the user whose profile you are viewing,
                        //  not the logged-in user
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length) {
        throw new ApiError(404,"channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
    
})

const getWatchHistory = asyncHandler(async (req,res) => {
    // req.user._id  will give us a string ->{'59b99db9cfa9a34dcd7885bf'} 
    // but actual object ID is ->_id: ObjectId('59b99db9cfa9a34dcd7885bf')
    //  But when we use .findById()  mongoose internally convert it from string to object


    // .aggregate() always returns an array 

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",     // The target collection to look inside
                localField: "watchHistory",     //Field in the CURRENT collection (users)
                foreignField: "_id",        // Field in the TARGET collection (videos)
                as: "watchHistory",     // Where to put the matched results
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",    // now , for this the current collection is videos
                            foreignField: "_id",
                            as: "owner",    // is owner ke andar pura ka pura user aa gaya hai
                            //  aur hame sare fields nhi dene hai 
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].getWatchHistory,"watch history fetched successfully")
    )
})

export {
        registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
        getWatchHistory
    }
