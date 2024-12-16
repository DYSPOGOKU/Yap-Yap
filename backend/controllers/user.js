const User=require('../models/userSchema');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

exports.signup=(req,res,next)=>{
  bcrypt.hash(req.body.password,10)
  .then(hash=>{
    const user=new User({
      email:req.body.email,
      password:hash,
      name:req.body.name,
      phone:req.body.phone,
      about:req.body.about
    })
    user.save()
    .then(result=>{
      res.status(201).json({
        message:'User created',
        result:result
      })
    })
    .catch(err=>{
      res.status(500).json({
        error:err
      })
    })
  })
}

exports.login=(req,res,next)=>{
  let fetchedUser;
  User.findOne({
    email:req.body.email,
  })
  .then(user=>{
    if(!user){
      return res.status(401).json({
        message:'Auth failed'
      })
    }
    fetchedUser=user;
    return bcrypt.compare(req.body.password,user.password)
  })
  .then(isMatch=>{
    if(!isMatch){
      return res.status(401).json({
        message:'Auth failed'
      })
    }
    const token=jwt.sign({
      email:fetchedUser.email,
      userId:fetchedUser._id
    },'secret_this_should_be_longer')
    res.status(200).json({
      token:token,
      userId:fetchedUser._id
    })
  })
  .catch(err=>{
    return res.status(401).json({
      message:'Auth failed'
    })
  })
}

exports.getUserDetails=async(req,res,next)=>{
  try{
    const user=await User.findById(req.params.id);
    if(!user){
      return res.status(404).json({message:"User not found"})
    }
    return res.status(200).json({user:user})
  }
  catch(err){
    return res.status(500).json({error:'Something went wrong'})
  }
}

exports.updateUserDetails=async(req,res,next)=>{
  try{
    const user=await User.findById(req.params.id);
    if(!user){
      return res.status(404).json({message:"User not found"})
    }
    user.name=req.body.name;
    user.phone=req.body.phone;
    user.email=req.body.email;
    user.about=req.body.about;
    await user.save();
    return res.status(200).json({message:"User updated",user:user})
  }
  catch(err){
    return res.status(500).json({error:'Something went wrong'})
  }
}

exports.changeDisplayPicture=async(req,res,next)=>{
  try{
    const user=await User.findById(req.params.id);
    if(!user){
      return res.status(404).json({message:"User not found"})
    }
    user.profilePicture=req.file.path;
    await user.save();
    return res.status(200).json({message:"Profile picture updated",user:user})
  }
  catch(err){
    return res.status(500).json({error:'Something went wrong'})
  }
}

exports.deleteUser=async(req,res,next)=>{
  try{
    const user=await User.findById(req.params.id);
    if(!user){
      return res.status(404).json({message:"User not found"})
    }
    await user.remove();
    return res.status(200).json({message:"User deleted"})
  }
  catch(err){
    return res.status(500).json({error:'Something went wrong'})
  }
}