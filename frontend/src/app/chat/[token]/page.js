'use client';

import { useEffect, useState,use } from 'react';
import { useRouter } from 'next/navigation';
import { validateToken, getUserChats, getUsers } from '@/services/api';
import useStore from '@/store';
import ChatSidebar from '@/components/ChatSidebar';
import ChatWindow from '@/components/ChatWindow';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

export default function ChatPage({ params }) {
  const router = useRouter();
  const { token } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const { setCurrentUser, isAuthenticated, currentUser, setChats, isSidebarOpen } = useStore();
  
  // Validate token and fetch user data
  useEffect(() => {
    const validateAndFetchData = async () => {
      try {
        setIsLoading(true);
        
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Validate token - now using token from localStorage through interceptor
        const response = await validateToken();
        
        if (response.data.valid) {
          const { user } = response.data;
          setCurrentUser(user);
          
          // Now fetch user's chats
          const chatsResponse = await getUserChats(user.id);
          
          // Get all users to enrich chat data
          const usersResponse = await getUsers();
          const allUsers = usersResponse.data;
          
          // Enrich chat data with full user objects
          const enrichedChats = chatsResponse.data.map(chat => {
            // Extract participant IDs from the chat
            const participantIds = Array.isArray(chat.participants) 
              ? chat.participants 
              : [];
            
            // Find the full user objects for each participant
            const participants = participantIds.map(participantId => {
              // Find the participant in our users list
              const userObj = allUsers.find(user => user.id === participantId) || { id: participantId };
              return userObj;
            });

            return {
              ...chat,
              participants,
            };
          });
          
          setChats(enrichedChats);
        } else {
          // Token is invalid, redirect to login
          toast.error('Your session has expired. Please login again.');
          router.replace('/');
        }
      } catch (error) {
        console.error('Error validating token:', error);
        toast.error('Authentication error. Please login again.');
        router.replace('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    validateAndFetchData();
  }, [token, setCurrentUser, setChats, router]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mb-4"></div>
          <p className="text-gray-600">Loading your chats...</p>
        </div>
        <Toaster position="top-center" />
      </div>
    );
  }
  
  // If authenticated and not loading, show the chat UI
  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5]">
      <Toaster position="top-center" />
      
      <header className="bg-teal-600 text-white px-4 py-2 shadow-md">
        <h1 className="text-xl font-bold">YapYap</h1>
      </header>
      
      <main className="flex-1 flex overflow-hidden">
        {/* Mobile-responsive layout */}
        <div
          className={`w-full md:w-1/3 lg:w-1/4 h-full ${
            isSidebarOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <ChatSidebar />
        </div>
        
        <div
          className={`w-full md:w-2/3 lg:w-3/4 h-full ${
            isSidebarOpen ? 'hidden md:block' : 'block'
          }`}
        >
          <ChatWindow />
        </div>
      </main>
    </div>
  );
}