import { create } from 'zustand';
import type { RoomRow, RoomMemberRow } from '../types/database';

interface RoomState {
  activeRoom: RoomRow | null;
  members: RoomMemberRow[];
  setActiveRoom: (room: RoomRow | null) => void;
  setMembers: (members: RoomMemberRow[]) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  activeRoom: null,
  members: [],
  setActiveRoom: (activeRoom) => set({ activeRoom }),
  setMembers: (members) => set({ members }),
}));
