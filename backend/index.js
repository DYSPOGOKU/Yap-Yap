require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin
// Important: Process the private key properly for different environments
let privateKey;
if (process.env.FIREBASE_PRIVATE_KEY) {
  privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
} else {
  console.error('FIREBASE_PRIVATE_KEY environment variable is not set');
  privateKey = '';
}

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: privateKey,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

// Add better error handling for Firebase initialization
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  process.exit(1);
}

const db = admin.firestore();
const app = express();
const corsOptions = {
  origin: ['https://yap-yap-orcin.vercel.app'], // Added as an array for flexibility
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'], // Added OPTIONS, DELETE, and PUT methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Added Authorization header
  credentials: true // Allow credentials
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Store active tokens (in a real app, you'd use Redis or another datastore)
const tokenStore = {};

// Generate a unique token for a user
const generateToken = (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  // Store token with userId and expiration (24 hours)
  tokenStore[token] = {
    userId,
    expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  return token;
};

// Validate a token
const validateToken = (token) => {
  const tokenData = tokenStore[token];
  if (!tokenData) {
    return null;
  }
  
  // Check if token is expired
  if (tokenData.expires < Date.now()) {
    delete tokenStore[token];
    return null;
  }
  
  return tokenData.userId;
};

// API Routes
// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Server Error');
  }
});

// Validate phone number and check if user exists
app.get('/api/users/validate/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    // Basic phone validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ valid: false, message: 'Invalid phone number format' });
    }
    
    // Check if user exists in the database
    const userQuery = await db.collection('users').where('phone', '==', phone).get();
    const exists = !userQuery.empty;
    
    res.status(200).json({ valid: true, exists });
  } catch (error) {
    console.error('Error validating phone:', error);
    res.status(500).send('Server Error');
  }
});

// Create a new user
app.post('/api/users', async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    
    // Validate phone number
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }
    
    // Check if user already exists
    const userQuery = await db.collection('users').where('phone', '==', phone).get();
    if (!userQuery.empty) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }
    
    const newUser = {
      name,
      phone,
      avatar: avatar || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const userRef = await db.collection('users').add(newUser);
    res.status(201).json({
      id: userRef.id,
      ...newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send('Server Error');
  }
});

// Get chats for a user
app.get('/api/chats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get individual chats where user is a participant
    const chatsSnapshot = await db.collection('chats')
      .where('participants', 'array-contains', userId)
      .get();
    
    const chats = [];
    chatsSnapshot.forEach(doc => {
      chats.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).send('Server Error');
  }
});

// Create a new chat
app.post('/api/chats', async (req, res) => {
  try {
    const { participants, isGroup, name } = req.body;
    
    if (!participants || participants.length < 2) {
      return res.status(400).json({ message: 'At least two participants are required' });
    }
    
    // For group chats, a name is required
    if (isGroup && !name) {
      return res.status(400).json({ message: 'Group name is required' });
    }
    
    const newChat = {
      participants,
      isGroup: isGroup || false,
      name: isGroup ? name : null,
      lastMessage: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const chatRef = await db.collection('chats').add(newChat);
    res.status(201).json({
      id: chatRef.id,
      ...newChat
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).send('Server Error');
  }
});

// Delete a chat
app.delete('/api/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Delete all messages in the chat
    const messagesSnapshot = await db.collection('messages')
      .where('chatId', '==', chatId)
      .get();
    
    const batch = db.batch();
    messagesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete the chat document
    batch.delete(db.collection('chats').doc(chatId));
    
    await batch.commit();
    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).send('Server Error');
  }
});

// Send a message
app.post('/api/messages', async (req, res) => {
  try {
    const { chatId, senderId, content, type } = req.body;
    
    if (!chatId || !senderId || !content) {
      return res.status(400).json({ message: 'ChatId, senderId and content are required' });
    }
    
    const newMessage = {
      chatId,
      senderId,
      content,
      type: type || 'text',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add the message
    const messageRef = await db.collection('messages').add(newMessage);
    
    // Update lastMessage in chat
    await db.collection('chats').doc(chatId).update({
      lastMessage: {
        content,
        senderId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({
      id: messageRef.id,
      ...newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send('Server Error');
  }
});

// Get messages for a chat
app.get('/api/messages/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const lastMessageId = req.query.lastMessageId;
    
    // Validate chatId first
    const chatDoc = await db.collection('chats').doc(chatId).get();
    if (!chatDoc.exists) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    let messagesSnapshot;
    
    try {
      let query = db.collection('messages')
        .where('chatId', '==', chatId)
        .orderBy('createdAt', 'desc'); // Order by descending to get newest first
      
      // If lastMessageId is provided, use it for pagination
      if (lastMessageId) {
        const lastMessageDoc = await db.collection('messages').doc(lastMessageId).get();
        if (lastMessageDoc.exists) {
          query = query.startAfter(lastMessageDoc);
        }
      }
      
      // Limit the number of messages returned
      query = query.limit(limit);
      
      messagesSnapshot = await query.get();
    } catch (error) {
      // Check if the error is about missing index
      if (error.code === 9 && error.details && error.details.includes('index')) {
        console.log("Missing index error detected. Trying alternative query approach...");
        console.warn("===== WARNING: MISSING FIRESTORE INDEX =====");
        console.warn("Your query requires a composite index. Follow the link below to create it:");
        console.warn(error.details);
        console.warn("==========================================");
        
        // Fallback: Get all messages for the chat without sorting (less efficient)
        const allMessagesSnapshot = await db.collection('messages')
          .where('chatId', '==', chatId)
          .get();
        
        const allMessages = [];
        allMessagesSnapshot.forEach(doc => {
          allMessages.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Sort manually in memory
        allMessages.sort((a, b) => {
          const timeA = a.createdAt ? 
            (typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
          const timeB = b.createdAt ? 
            (typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
          return timeB - timeA; // Descending order
        });
        
        // Apply pagination logic in memory
        let startIndex = 0;
        if (lastMessageId) {
          const lastMessageIndex = allMessages.findIndex(msg => msg.id === lastMessageId);
          if (lastMessageIndex !== -1) {
            startIndex = lastMessageIndex + 1;
          }
        }
        
        const paginatedMessages = allMessages.slice(startIndex, startIndex + limit);
        
        // Format dates
        paginatedMessages.forEach(message => {
          if (message.createdAt && typeof message.createdAt.toDate === 'function') {
            message.createdAt = message.createdAt.toDate().toISOString();
          } else if (message.createdAt) {
            message.createdAt = new Date(message.createdAt).toISOString();
          } else {
            message.createdAt = new Date().toISOString();
          }
        });
        
        // Return the manually paginated messages in reverse order (oldest first)
        return res.status(200).json(paginatedMessages.reverse());
      } else {
        // Re-throw if it's not an index error
        throw error;
      }
    }
    
    const messages = [];
    messagesSnapshot.forEach(doc => {
      const data = doc.data();
      // Ensure createdAt is properly serialized
      const createdAt = data.createdAt ? 
                         (typeof data.createdAt.toDate === 'function' ? 
                           data.createdAt.toDate().toISOString() : 
                           data.createdAt) : 
                         new Date().toISOString();
                           
      messages.push({
        id: doc.id,
        ...data,
        createdAt
      });
    });
    
    // Return in reverse order to get oldest first (for display)
    res.status(200).json(messages.reverse());
    
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message,
      details: error.details || null,
      code: error.code || null
    });
  }
});

// Generate a token for a user
app.post('/api/auth/token', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Verify user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const token = generateToken(userId);
    
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).send('Server Error');
  }
});

// Validate a token and get user
app.get('/api/auth/validate', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ valid: false, message: 'No token provided' });
    }
    
    const userId = validateToken(token);
    
    if (!userId) {
      return res.status(401).json({ valid: false, message: 'Invalid or expired token' });
    }
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ valid: false, message: 'User not found' });
    }
    
    res.status(200).json({
      valid: true,
      user: {
        id: userDoc.id,
        ...userDoc.data()
      }
    });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).send('Server Error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));