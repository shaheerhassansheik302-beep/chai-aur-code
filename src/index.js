import dotenv from "dotenv"


import { app } from "./app.js";
import connectDB from "./db/index.js";



dotenv.config({
    path: "./.env"
})

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`server is running at port ${process.env.PORT || 8000}`)
        })
    })
    .catch((err) => {

        console.log("mongobd is connection is failed", err);

    })