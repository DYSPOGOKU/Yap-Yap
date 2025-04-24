import { useState, useEffect } from 'react';
import { IoClose, IoSearch } from 'react-icons/io5';
import useStore from '@/store';
import Avatar from './Avatar';
import { getUsers, createChat } from '@/services/api';
import toast from 'react-hot-toast';

const NewChatModal = ({ onClose }) => {
  const { currentUser, addChat, setActiveChat } = useStore();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await getUsers();
        // Filter out the current user
        const filteredUsers = response.data.filter(user => user.id !== currentUser?.id);
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser?.id]);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone.includes(searchQuery)
  );

  const handleStartChat = async (user) => {
    setIsLoading(true);
    try {
      // Create a new chat with the selected user
      const chatData = {
        participants: [currentUser.id, user.id],
        isGroup: false
      };
      
      const response = await createChat(chatData);
      const newChat = {
        ...response.data,
        participants: [currentUser, user]
      };
      
      // Add the new chat to the state
      addChat(newChat);
      setActiveChat(newChat);
      onClose();
      toast.success(`Chat started with ${user.name}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to start chat');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-medium">New Chat</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <IoClose size={24} />
          </button>
        </div>
        
        <div className="p-3 border-b">
          <div className="bg-gray-100 rounded-full flex items-center px-3 py-2">
            <IoSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search contacts"
              className="w-full bg-transparent outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b"
                onClick={() => handleStartChat(user)}
              >
                <Avatar user={user} />
                <div className="ml-3">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.phone}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? "No users found" : "No contacts available"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;