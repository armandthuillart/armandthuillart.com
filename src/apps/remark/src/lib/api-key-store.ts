import { create } from 'zustand';

interface ApiKeyStore {
  apiKey: null | string;
  open: Dialog;
  selectedApiKeyId: null | string;
  setApiKey: (apiKey: null | string) => void;
  setOpen: (open: Dialog) => void;
  setSelectedApiKeyId: (selectedApiKeyId: null | string) => void;
}

type Dialog = 'create' | 'delete' | 'update' | 'view' | null;

export const useApiKeyStore = create<ApiKeyStore>((set) => ({
  apiKey: null,
  open: null,
  selectedApiKeyId: null,
  setApiKey: (apiKey) => {
    set({ apiKey });
  },
  setOpen: (open) => {
    set({ open });
  },
  setSelectedApiKeyId: (selectedApiKeyId) => {
    set({ selectedApiKeyId });
  },
}));
