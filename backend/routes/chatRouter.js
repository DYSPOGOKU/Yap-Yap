const express = require('express');
const chatController = require('../controllers/chat');
const router = express.Router();

router.post('/createChat', chatController.createChat);
router.post('/sendMessage', chatController.sendMessage);
router.get('/getMessages/:senderId/:receiverId', chatController.getMessages);
router.put('/editMessage', chatController.editMessage);
router.delete('/deleteMessage', chatController.deleteMessage);

module.exports = router;
