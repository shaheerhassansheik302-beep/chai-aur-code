import mongoose, { Schema } from "mongoose"

import jwt from "jsonwebtoken"

import brcypt from "bcrypt"


const userSchema = new Schema({
    username: {
        type: String,
        requiured: true,
        unique: true,
        lowercase: true,
        index: true,
        trim: true

    },
    email: {
        type: String,
        requiured: true,
        unique: true,
        lowercase: true,
        trim: true,

    },
    fullName: {

        type: String,
        required: true,
    },
    avatar: {
        type: String,
        required: true,
    },
    coverImage: {
        type: String,

    },
    WatchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "video"
    }],
    password: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
    }
}, { timestamps: true })


userSchema.pre("save", async function(next) {


    if (!this.isModified("password")) return next();


    this.password = brcypt.hash(this.password, 10)
    next()
})


userSchema.methods.isPasswordCorrect = async function(password) {
    return await brcypt.compare(password, this.password)
}


userSchema.methods.generateAccessToken = function() {
    return jwt.sign({
            id: this.id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,

        },
        process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        })
}
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({
            id: this.id,


        },
        process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        })

}
export const User = mongoose.model("User", userSchema)