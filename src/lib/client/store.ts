import { create } from 'zustand';

interface ConsoleState {
  selectedEndpointId: string | null;
  selectedEventId: string | null;
  live: boolean;
  selectEndpoint: (id: string | null) => void;
  selectEvent: (id: string | null) => void;
  setLive: (live: boolean) => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  selectedEndpointId: null,
  selectedEventId: null,
  live: true,
  selectEndpoint: (id) => set({ selectedEndpointId: id, selectedEventId: null }),
  selectEvent: (id) => set({ selectedEventId: id }),
  setLive: (live) => set({ live }),
}));
