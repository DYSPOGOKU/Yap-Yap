import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Create store with persistence
const useStore = create(
  persist(
    (set) => ({
      // User state
      currentUser: null,
      isAuthenticated: false,
      setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
      
      // Chats state
      chats: [],
      activeChat: null,
      setChats: (chats) => set({ chats }),
      setActiveChat: (activeChat) => set({ activeChat }),
      addChat: (chat) => set((state) => ({ chats: [...state.chats, chat] })),
      updateChat: (updatedChat) => set((state) => ({
        chats: state.chats.map(chat => 
          chat.id === updatedChat.id ? updatedChat : chat
        ),
        activeChat: state.activeChat?.id === updatedChat.id ? updatedChat : state.activeChat
      })),
      removeChat: (chatId) => set((state) => ({
        chats: state.chats.filter(chat => chat.id !== chatId),
        activeChat: state.activeChat?.id === chatId ? null : state.activeChat
      })),
      
      // Messages state
      messages: {},
      setMessages: (chatId, messagesArray) => set((state) => ({
        messages: { ...state.messages, [chatId]: messagesArray }
      })),
      addMessage: (chatId, message) => set((state) => {
        const chatMessages = state.messages[chatId] || [];
        return {
          messages: {
            ...state.messages,
            [chatId]: [...chatMessages, message]
          }
        };
      }),
      
      // UI state
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      
      // Logout function
      logout: () => set({ 
        currentUser: null, 
        isAuthenticated: false,
        activeChat: null
      })
    }),
    {
      name: 'yapyap-storage', // Name for the localStorage key
      partialize: (state) => ({ 
        // Only persist these properties to localStorage
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useStore;