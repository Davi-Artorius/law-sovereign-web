export type ClientStatus =
  | 'TRIAGEM'        // Lead novo, avaliando
  | 'PROPOSTA'       // Orçamento enviado, aguardando resposta
  | 'CONTRATO'       // Contrato assinado, pronto pra começar
  | 'ATIVO'          // Caso em andamento
  | 'DESFECHO'       // Ganhou, perdeu ou transou
  | 'ENCAMINHADO'    // Enviado pro colega
  | 'INATIVO';       // Não converteu, dormiu

export type EventType = 'Consulta' | 'Nota' | 'Alerta' | 'Encaminhamento' | 'Proposta' | 'Contrato';

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
  phone?: string;
  createdAt: string; // ISO String
}
