import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from "./app.js"

dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>
{

    app.on("error",(error)=>
    {
        console.log("Error in Express App Listening",error)
        throw error
    })
    
    app.listen(process.env.PORT || 8000,(req,res)=>
    {
        console.log(`App is Listening on Port ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("MongoDB Connection Error :",error)
})

// const app = express();

// ;(async ()=>{
//     try {
        
//         mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("Error: ",error)
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`App is Running on Port ${process.env.PORT}`)
//         })
    
//     } catch (error) {
//         console.error("Error: ",error);
//         throw error
//     }
// })()