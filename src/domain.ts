export type ClientStatus = 'Triagem' | 'Evolução';
export type EventType = 'Consulta' | 'Nota' | 'Alerta' | 'Encaminhamento';

export interface Attachment {
  name: string;
  type: string;
  data: string; // base64
  size: number;
}

export interface TimelineEvent {
  id: string; 
  clientId: string;
  date: string; // ISO String
  type: EventType;
  content: string;
  attachment?: Attachment;
}

export interface Client {
  id: string;
  name: string;
  status: ClientStatus;
  isEncaminhado: boolean;
  lastAction: string;
  case: string;
  area: string;
  chanceOfSuccess?: number;
  costOfWaiting?: number;
  missingProofs?: string;
  isPaperLead?: boolean;
  createdAt: string; // ISO String
}
