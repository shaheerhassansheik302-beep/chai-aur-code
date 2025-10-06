import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { useSyncExternalStore } from "react";
const generateAccessAndRefereshTokens = async(userId) => {
    try {
        const user = await user.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ ValidateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "something went while generating tokens")
    }
}
const registerUser = asyncHandler(async(req, res) => {
    const { fullName, email, username, password } = req.body;
    console.log("email :", email);

    if ([fullName, username, email, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "username or email already exists");
    }

    // Classic checks for file paths
    let avatarLocalPath = "";
    let coverImageLocalPath = "";

    if (
        req.files &&
        req.files.avatar &&
        Array.isArray(req.files.avatar) &&
        req.files.avatar.length > 0 &&
        req.files.avatar[0].path
    ) {
        avatarLocalPath = req.files.avatar[0].path;
    }

    if (
        req.files &&
        req.files.coverImage &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0 &&
        req.files.coverImage[0].path
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // Make avatar and coverImage optional
    const avatar = avatarLocalPath ? await uploadOnCloudinary(avatarLocalPath) : null;
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    const user = await User.create({
        fullName,
        avatar: avatar && avatar.url ? avatar.url : "",
        coverImage: coverImage && coverImage.url ? coverImage.url : "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "something went wrong");
    }

    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "user registered successfully"));
});


const loginUser = asyncHandler(async(req, res) => {
    const { email, username, password } = req.body;
    if (!email && !username) {

        throw ApiError(400, "email or username is required")
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw ApiError(400, "user does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw ApiError(400, "password is incoorect ")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")


    const options = {
        httpOnly: true,
        secure: true

    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, {
        user: loggedInUser,
        accessToken,
        refreshToken
    }, "logged in user"))
});
const logoutUser = asyncHandler(async(req, res) => {
    User.findByIdAndUpdate(
        req.user._id, {
            $set: {
                refreshToken: undefined
            }
        }, {
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: true

    }
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {},
        "logged out successfully"));
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingrefreshToken) {
        throw new ApiError(401, "unauthorized accesss");
    }
    const decodedToken = jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken && decodedToken._id)
    if (!user) {
        throw new ApiError(401, "invalid user")
    }
    if (incomingrefreshToken !== user.refreshToken) {
        throw new ApiError(401, "invalid refresh token")
    }
    const options = {
        httpOnly: true,
        secure: true
    }
    const {
        accessToken,
        newRefreshToken
    } = await generateAccessAndRefereshTokens(user._id)
    return res
        .status(200).cookie("acessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options).json(new ApiResponse(200, {
                accessToken,
                refreshToken: newRefreshToken
            },
            "Access token refreshed"
        ))

})

const changeCurrentPassword = async(req, res) => {
    const { oldPassword, newPassword } = req.body;
    const User = User.findById(decodedToken && decodedToken._id);
    const isPasswordCorrect = await User.oldPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "old password is incorrect")
    }
    User.password = newPassword;
    await User.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "password changed  sucessfully"))
}

const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200).json(200, req.user, "current user fetched sucessfully")

})




const updateAcountDetails = asyncHandler(async(req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
        throw new ApiError(400, "fullName and email are required");
    }
    const userId = (req.user && req.user._id) ? req.user._id : null;

    if (!user) {
        throw new ApiError(400, "User ID not found");
    }

    const user = await User.findByIdAndUpdate(
        user, {
            $set: {
                fullName,
                email
            }
        }, { new: true }
    ).select("-password");

    return res.status(200).josn(200, user, "user updated sucessfully")
});
const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file && req.file.path ? req.file.path : "";
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatr is not available");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(500, "something went wrong while uploading avatar");
    }
    const User = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            avatar: avatar.url
        }
    }, {
        new: true
    }).select("-password")
    return res(200).json(new ApiResponse(200, User, "coverImage uploaded sucessfully"));
})
const updateUsercoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file && req.file.path ? req.file.path : "";
    if (!coverImageLocalPath) {
        throw new ApiError(400, "avatr is not available");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(500, "something went wrong while uploading avatar");
    }
    const User = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, {
        new: true
    }).select("-password")

    return res(200).json(new ApiResponse(200, User, "coverImage uploaded sucessfully"));
})
export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    changeCurrentPassword,
    updateAcountDetails,
    updateUserAvatar,
    updateUsercoverImage


}