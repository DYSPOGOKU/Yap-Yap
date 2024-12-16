const express=require('express');
const router=express.Router();
const userController=require('../controllers/user');

router.post('/signup',userController.signup);
router.post('/login',userController.login);
router.get('/getUserDetails/:userId',userController.getUserDetails);
router.put('/updateUserDetails',userController.updateUserDetails);
router.put('/updateProfilePicture',userController.updateProfilePicture);
router.delete('/deleteUser',userController.deleteUser);

module.exports=router;
