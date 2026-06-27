import { create } from 'zustand';
import { persist } from 'zustand/middleware';


export const useChatStore = create(
  persist(
    (set, get) => ({
      messages: [],
      status: 'disconnected',
      setStatus: (status) => set({ status }),
      addMessage: (message) => set({ messages: [...get().messages, message] }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
