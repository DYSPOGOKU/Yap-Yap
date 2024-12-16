const mongoose=require('mongoose');

const Schema=mongoose.Schema;

const user=new Schema({
    name:{
      type:String,
      required:true
    },
    email:{
      type:String,
      required:true,
    },
    password:{
      type:String,
      required:true
    },
    about:{
      type:String,
      default:""
    },
    profilePicture:{
      type:String,
      default:""
    },
    timeStamps:{
      type:Date,
      default:Date.now
    },
    online:{
      type:Boolean,
      default:false
    },
    phone:{
      type:String,
      default:""
    }
})

module.exports=mongoose.model('user',user);