const Chat = require('../models/chatSchema');
const User = require('../models/userSchema');

// Send a message between sender and receiver
const mongoose = require('mongoose');


exports.createChat = async (req, res) => {
  const { sender, receiver } = req.body;

  try {
    let chat = await Chat.findOne({ sender, receiver });

    if (!chat) {
      chat = new Chat({ sender, receiver });
      await chat.save();
    }

    res.status(201).json({ message: 'Chatroom created', chat });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong', details: err.message });
  }
};


exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ error: 'Invalid sender or receiver ID' });
    }

    // Convert IDs to ObjectId
    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    // Validate users
    const sender = await User.findById(senderObjectId);
    const receiver = await User.findById(receiverObjectId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'Sender or Receiver not found' });
    }

    // Find existing chat or create a new one
    let chat = await Chat.findOne({
      $or: [
        { sender: senderObjectId, receiver: receiverObjectId },
        { sender: receiverObjectId, receiver: senderObjectId }
      ]
    });

    if (!chat) {
      // Create a new chat if not found
      return res.status(404).json({ message: 'Chatroom not found' });
    }

    // Add the new message to the messages array
    chat.messages.push({
      text: text,
      timestamp: new Date(),
      read: false
    });

    // Update lastUpdated timestamp
    chat.lastUpdated = new Date();

    // Save the chat
    await chat.save();

    return res.status(201).json({ message: 'Message sent', chat });
  } catch (err) {
    console.error('Error in sendMessage:', err); // Log the error
    return res.status(500).json({ error: 'Something went wrong', details: err.message });
  }
};


// Fetch all messages between sender and receiver
exports.getMessages = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    // Find the chat between sender and receiver
    const chat = await Chat.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (!chat) {
      return res.status(404).json({ message: 'No chat found between the users' });
    }

    // Return the messages
    return res.status(200).json({ messages: chat.messages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.editMessage = async (req, res) => {
  const { chatId, messageId, newText } = req.body;

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chatroom not found' });
    }

    const message = chat.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.text = newText;
    await chat.save();

    res.status(200).json({ message: 'Message updated', chat });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong', details: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  const { chatId, messageId } = req.body;

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chatroom not found' });
    }

    chat.messages.pull({ _id: messageId });
    await chat.save();

    res.status(200).json({ message: 'Message deleted', chat });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong', details: err.message });
  }
};

