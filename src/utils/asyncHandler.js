
//Async handler takes as async function return promise
const asyncHandler = (requestHandler)=>
{
    return (req,res,next)=>
    {
        Promise.resolve(requestHandler(req,res,next)).catch((error)=>next(error))
    }
}

export {asyncHandler}


// const asyncHandler = (fn) =>async(req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.send(error.code || 500).json({
//             sucess : false,
//             message:error.message
//         })
//     }
// }