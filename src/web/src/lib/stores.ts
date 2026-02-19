import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface Ticket {
  id: string;
  type: 'task' | 'bug';
  title: string;
  description?: string;
  status: 'todo' | 'progress' | 'done';
  assignee?: string;
  sprint?: string;
  estimate?: number;
  labels?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  author: string; // User ID
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  goal?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

// Create dark mode store with localStorage persistence
function createDarkModeStore() {
  // Get initial value from localStorage or default to false
  const initialValue = browser ? localStorage.getItem('tkxr-dark-mode') === 'true' : false;
  
  const { subscribe, set, update } = writable<boolean>(initialValue);
  
  // Apply initial dark mode class if needed
  if (browser && initialValue) {
    document.documentElement.classList.add('dark');
  }
  
  return {
    subscribe,
    set: (value: boolean) => {
      if (browser) {
        localStorage.setItem('tkxr-dark-mode', value.toString());
        // Update the document class
        if (value) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      set(value);
    },
    toggle: () => update(n => {
      const newValue = !n;
      if (browser) {
        localStorage.setItem('tkxr-dark-mode', newValue.toString());
        // Update the document class
        if (newValue) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return newValue;
    })
  };
}

export const ticketStore = writable<Ticket[]>([]);
export const sprintStore = writable<Sprint[]>([]);
export const userStore = writable<User[]>([]);
export const darkMode = createDarkModeStore();