import dotenv from "dotenv";
import dns from 'node:dns';
import express from "express"
dns.setServers(['8.8.8.8', '8.8.4.4']);

// import mongoose from "mongoose";
// import {DB_NAME} from "./constants";
import connectDB from "./db/index.js";

const app = express();

dotenv.config({
    path : "./env" // path: "./.env"
})

// console.log("DB URI:", process.env.MONGODB_URI);

connectDB()
.then(() => {
    app.listen((process.env.PORT || 8000),() => {
        console.log(`server is running at port:${process.env.PORT || 8000}`);
    })
})
.catch((err) => {
    console.log("Error occured",err);
})

/*
import express from "express";
const app = express();

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error",(error) => {
            console.log("Error:",error);
            throw error;
        })

        app.listen(process.env.PORT,() => {
            console.log(`app is running on port : ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("Error :",error);
        throw error;
    }
}) ()
*/



