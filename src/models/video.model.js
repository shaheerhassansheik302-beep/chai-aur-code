import mongoose, { Schema } from "mongoose"


const videoSchema = new Schema({
    videoFile: {
        type: String,
        required: true
    },
    thumnails: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: number,
        required: true
    },
    views: {
        type: number,
        default: 0
    },
    isPublished: {
        type: bolean,
        default: true

    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "user"
    }

}, { timestamps: true })


export const video = mongoose.model("video", videoSchema)