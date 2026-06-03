import axios from 'axios';
import type { Client, TimelineEvent } from '../domain';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const storage = {
  // Maelstrom: Agora buscando dados REAIS da API
  getClients: async (): Promise<Client[]> => {
    try {
      const response = await axios.get(`${API_URL}/clients`);
      return response.data;
    } catch (e) {
      console.error('Maelstrom: Erro ao buscar clientes da API', e);
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

  nuclearReset: async (): Promise<void> => {
    // Sage: O Reset agora exige cautela, mas por enquanto limparemos o local para sincronizar
    localStorage.clear();
    window.location.reload();
  }
};
