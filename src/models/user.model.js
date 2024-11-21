import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const userSchema = new Schema(
    {

        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            index : true,
            trim:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        fullName:{
            type:String,
            required:true,
            index : true,
            trim:true
        },
        avatar:{
            type:String,
            required:true,
        },
        coverImage:
        {
            type:String,
        },
        watchHistory:
        [
            {
                type : Schema.Types.ObjectId,
                ref :"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"Password is Required"]
        },
        refreshToken:{
            type:String,
        }
    },
    {
        timestamps:true
    }
)


// we saved encrypted password on database , before we saved data of database we encrypted the password
// if we do this every time we saved document password gets encrypted so we want to encryted the password only if its first time saving password or 
// we making changes in the password(forget password)

userSchema.pre("save",async function(next)
{   
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10);
    next();
})


// we add method check is password is correct or not 

userSchema.methods.isPasswordcorrect = async function (password) {
    return await bcrypt.compare(password,this.password);
}

// this enough fast we do not added async before the fuction
userSchema.methods.generateAccessToken = function()
{
    return jwt.sign(
        {
            _id : this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function()
{
    return jwt.sign(
        {
            _id : this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



export const  User = mongoose.model("User",userSchema);