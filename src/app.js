import express, { urlencoded } from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({
    limit:"16kb"
}))

// express.json is middleware and parse data in json format
// app.use is only used when we using some configuration or middlewares

app.use(urlencoded(
    {
        limit:"16kb",
        extended:true
    }
))

// urlencoded is middle that parse url data 

app.use(express.static("public"))
app.use(cookieParser())

//routes import

import userRouter from "./routes/user.routes.js"

app.use("/api/v1/users",userRouter)


export {app}