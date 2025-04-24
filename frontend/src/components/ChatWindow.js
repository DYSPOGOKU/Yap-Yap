import { useState, useEffect, useRef } from 'react';
import { IoSend, IoArrowBack, IoEllipsisVertical } from 'react-icons/io5';
import useStore from '@/store';
import Avatar from './Avatar';
import { getChatMessages, sendMessage } from '@/services/api';
import toast from 'react-hot-toast';

const ChatWindow = () => {
  const { currentUser, activeChat, messages, setMessages, addMessage, isSidebarOpen, toggleSidebar } = useStore();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatId = activeChat?.id;
  
  const otherUser = activeChat?.isGroup 
    ? null 
    : activeChat?.participants?.find(p => p.id !== currentUser?.id);
  
  const chatName = activeChat?.isGroup ? activeChat.name : otherUser?.name || 'Unknown';
  const chatMessages = messages[chatId] || [];

  // Fetch messages when chat changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId) return;
      
      setIsLoading(true);
      try {
        const response = await getChatMessages(chatId);
        setMessages(chatId, response.data || []);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
  }, [chatId, setMessages]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;
    
    const messageData = {
      chatId,
      senderId: currentUser.id,
      content: newMessage.trim(),
      type: 'text'
    };
    
    // Create a temporary message with a unique ID for optimistic update
    const now = new Date();
    const tempMessage = {
      ...messageData,
      id: `temp-${now.getTime()}`,
      createdAt: now.toISOString(),
      sending: true
    };
    
    // Get current messages for this chat
    const currentChatMessages = [...(messages[chatId] || [])];
    
    // Add the temporary message to the chat
    const updatedMessages = [...currentChatMessages, tempMessage];
    setMessages(chatId, updatedMessages);
    
    // Clear the input field
    setNewMessage('');
    
    try {
      // Send the message to the backend
      const response = await sendMessage(messageData);
      
      // Update the messages list with the server response
      const serverMessage = response.data;
      
      // Get the latest messages again to ensure we have the most up-to-date list
      const latestMessages = [...(messages[chatId] || [])];
      
      // Replace the temporary message with the server response or add it if not found
      const finalMessages = latestMessages.map(msg => 
        msg.id === tempMessage.id ? { ...serverMessage } : msg
      );
      
      // If the temporary message wasn't found (unlikely but possible), add the server message
      if (!finalMessages.some(msg => msg.id === serverMessage.id)) {
        finalMessages.push(serverMessage);
      }
      
      // Update the messages in the store
      setMessages(chatId, finalMessages);
      
      // Update the chat's lastMessage in the store
      const { updateChat, chats } = useStore.getState();
      const currentChat = chats.find(c => c.id === chatId);
      
      if (currentChat) {
        // Create a valid lastMessage object that won't cause timestamp issues
        const lastMessage = {
          content: newMessage.trim(),
          senderId: currentUser.id,
          createdAt: new Date().toISOString()
        };
        
        updateChat({
          ...currentChat,
          lastMessage
        });
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Mark the temporary message as failed
      const failedMessages = (messages[chatId] || []).map(msg => 
        msg.id === tempMessage.id ? { ...msg, failed: true } : msg
      );
      setMessages(chatId, failedMessages);
    }
  };
  
  // Format message timestamp - fixing the invalid date issue
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // Handle different timestamp formats
      const date = typeof timestamp === 'string' ? new Date(timestamp) : 
                  (timestamp.toDate ? timestamp.toDate() : new Date());
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };
  
  return (
    <div className="flex-1 flex flex-col h-full bg-[#f0f2f5]">
      {/* Chat header */}
      <div className="flex items-center justify-between p-3 bg-gray-100 border-b shadow-sm">
        <div className="flex items-center">
          <button 
            className="md:hidden mr-2 text-gray-600 text-xl" 
            onClick={toggleSidebar}
          >
            <IoArrowBack />
          </button>
          <Avatar user={activeChat?.isGroup ? { name: activeChat.name } : otherUser} />
          <div className="ml-3">
            <div className="font-medium">{chatName}</div>
            {activeChat && activeChat.isGroup && (
              <div className="text-xs text-gray-500">
                {`${activeChat.participants?.length || 0} participants`}
              </div>
            )}
          </div>
        </div>
        <button className="text-xl text-gray-600 hover:text-gray-800">
          <IoEllipsisVertical />
        </button>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#efeae2] bg-opacity-30 bg-[url('/pattern.png')]">
        {!activeChat ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
            <p className="mb-2 font-medium">Select a chat to start messaging</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
            <p className="mb-2 font-medium">No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-2 pb-2">
            {chatMessages.map((msg, index) => {
              const isMine = msg.senderId === currentUser?.id;
              
              // Find the sender for group chats
              const sender = activeChat?.isGroup
                ? activeChat.participants?.find(p => p.id === msg.senderId)
                : null;
                
              return (
                <div 
                  key={msg.id || index} 
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      isMine 
                        ? 'bg-[#dcf8c6] rounded-tr-none' 
                        : 'bg-white rounded-tl-none'
                    }`}
                  >
                    {activeChat?.isGroup && !isMine && (
                      <div className="text-xs font-medium text-teal-600 mb-1">
                        {sender?.name || 'Unknown'}
                      </div>
                    )}
                    <div className="break-words">{msg.content}</div>
                    <div className="text-right text-xs text-gray-500 mt-1 flex justify-end items-center gap-1">
                      {formatTime(msg.createdAt)}
                      {msg.sending && <span className="text-gray-400">•</span>}
                      {msg.failed && <span className="text-red-500">!</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input */}
      {activeChat && (
        <form 
          onSubmit={handleSendMessage} 
          className="p-3 bg-gray-100 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type a message"
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-teal-500 bg-white"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()} 
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              newMessage.trim() ? 'bg-teal-500 text-white' : 'bg-gray-300 text-gray-500'
            }`}
          >
            <IoSend />
          </button>
        </form>
      )}
    </div>
  );
};

export default ChatWindow;