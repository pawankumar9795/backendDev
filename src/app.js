import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

//cookie -> text-based storage mechanism
// (err,req,res,next)     next is a flag used for middlewares


app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit : "20kb"}))
app.use(express.urlencoded({extended : true , limit : "20kb"}))
app.use(express.static("public"))
app.use(cookieParser())



// router
import userRouter from "./routes/user.model.js"

// route declaration
app.use("/api/v1/user",userRouter)
// http://localhost:8000/api/v1/users/register

export { app }