import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };