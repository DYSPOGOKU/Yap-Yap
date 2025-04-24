import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useStore from '@/store';
import Avatar from './Avatar';
import { IoSearch, IoEllipsisVertical, IoPersonAdd } from 'react-icons/io5';
import NewChatModal from './NewChatModal';

const ChatSidebar = () => {
  const router = useRouter();
  const { currentUser, chats, setActiveChat } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Filter chats by search query
  const filteredChats = chats.filter(chat => {
    const chatName = chat.isGroup ? chat.name : chat.participants.find(p => p.id !== currentUser?.id)?.name || '';
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Format date for last message - enhanced to handle various timestamp formats
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // Handle different timestamp formats
      const date = typeof timestamp === 'string' ? new Date(timestamp) : 
                  (timestamp.toDate ? timestamp.toDate() : new Date());
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const now = new Date();
      
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      if (now - date < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString([], { weekday: 'short' });
      }
      
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-100">
        <div className="flex items-center">
          <Avatar user={currentUser} size={40} />
          <div className="ml-3 font-semibold">{currentUser?.name || 'User'}</div>
        </div>
        <div className="flex items-center gap-4 text-gray-600">
          <button onClick={() => setShowNewChatModal(true)} className="text-xl hover:text-teal-600">
            <IoPersonAdd />
          </button>
          <button className="text-xl hover:text-gray-800">
            <IoEllipsisVertical />
          </button>
        </div>
      </div>
      
      {/* Search bar */}
      <div className="p-2 bg-gray-100">
        <div className="bg-white rounded-full flex items-center px-3 py-1">
          <IoSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full py-1 px-2 outline-none text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => {
            const otherUser = chat.isGroup 
              ? null 
              : chat.participants?.find(p => p.id !== currentUser?.id);
            
            const chatName = chat.isGroup ? chat.name : otherUser?.name || 'Unknown';
            const lastMessage = chat.lastMessage;
            
            return (
              <div
                key={chat.id}
                className="flex items-center p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setActiveChat(chat)}
              >
                <Avatar user={chat.isGroup ? { name: chat.name } : otherUser} />
                
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className="font-medium truncate">{chatName}</div>
                    {lastMessage && (
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(lastMessage.createdAt)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500 truncate">
                    {lastMessage ? (
                      currentUser?.id === lastMessage.senderId ? (
                        <span className="text-gray-400">You: {lastMessage.content}</span>
                      ) : (
                        lastMessage.content
                      )
                    ) : (
                      <span className="text-gray-400 italic">No messages yet</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
            <p className="mb-2 font-medium">No chats found</p>
            <p className="text-sm">
              {searchQuery 
                ? 'Try a different search' 
                : 'Start a new conversation by clicking the new chat icon'}
            </p>
          </div>
        )}
      </div>
      
      {showNewChatModal && (
        <NewChatModal onClose={() => setShowNewChatModal(false)} />
      )}
    </div>
  );
};

export default ChatSidebar;