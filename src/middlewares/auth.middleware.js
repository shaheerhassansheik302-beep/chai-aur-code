import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
export const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        const token =
            (req.cookies && req.cookies.accessToken) ||
            (req.header("authorization") && req.header("authorization").replace("Bearer ", ""));

        if (!token) {
            throw new ApiError(401, "Not authorized, token missing");
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken.userId).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(401, "invalid accesstoken")

        }
        req.user = user
        next();
    } catch (error) {
        throw new ApiError(401, "Not authorized, token failed");
    }

});