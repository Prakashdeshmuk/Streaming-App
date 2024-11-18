import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () =>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`Mongo DB is Connected !! DB Host:${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("Error in Mongodb Connection: ",error);
        process.exit(1);
    }
}

export default connectDB