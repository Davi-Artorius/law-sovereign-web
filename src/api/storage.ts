import axios from 'axios';
import type { Client, TimelineEvent } from '../domain';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ─── AUTENTICAÇÃO JWT ─────────────────────────────────────────────────────────
// Ao fazer login, token é armazenado no sessionStorage e axios é configurado
// para enviar Authorization: Bearer <token> em toda requisição protegida.
// sessionStorage limpa automaticamente ao fechar a aba (melhor segurança).

export const setToken = (token: string) => {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const logout = () => {
  sessionStorage.removeItem('auth');
  delete axios.defaults.headers.common['Authorization'];
  window.location.reload();
};

export const storage = {
  setToken,
  logout,

  // Maelstrom: Agora buscando dados REAIS da API com JWT
  getClients: async (): Promise<Client[]> => {
    try {
      const response = await axios.get(`${API_URL}/clients`);
      return response.data;
    } catch (e) {
      console.error('Erro ao buscar clientes da API', e);
      return [];
    }
  },

  createClient: async (client: Omit<Client, 'id' | 'createdAt' | 'isEncaminhado'>): Promise<Client> => {
    const response = await axios.post(`${API_URL}/clients`, client);
    return response.data;
  },

  updateClient: async (id: string, data: Partial<Client>): Promise<Client> => {
    const response = await axios.patch(`${API_URL}/clients/${id}`, data);
    return response.data;
  },

  deleteClient: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/clients/${id}`);
  },

  createEvent: async (event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> => {
    const response = await axios.post(`${API_URL}/events`, event);
    return response.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/events/${id}`);
  },

  getClientEvents: async (clientId: string): Promise<TimelineEvent[]> => {
    const response = await axios.get(`${API_URL}/clients/${clientId}/events`);
    return response.data;
  },

  nuclearReset: async (): Promise<void> => {
    logout();
  },

  runOCR: async (imageDataUrl: string): Promise<{ name?: string; phone?: string; area?: string; case?: string }> => {
    const base64 = imageDataUrl.split(',')[1];
    const response = await axios.post(`${API_URL}/ocr`, { image: base64, mimeType: imageDataUrl.split(';')[0].split(':')[1] });
    return response.data;
  }
};
