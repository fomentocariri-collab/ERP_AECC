export type Page = 'Dashboard' | 'Members' | 'Financial' | 'Events' | 'Documents' | 'Communications' | 'Settings';

export type UserRole = 'Super Admin' | 'Financeiro' | 'Associado';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
}

export type MemberRole = 'Diretoria' | 'Membro Fundador' | 'Associado';

export interface Member {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive' | 'Pending';
  admissionDate: string;
  avatarUrl: string;
  cpf: string;
  address: string;
  city: string;
  state: string; // UF
  phone: string;
  birthDate: string | null;
  role: MemberRole;
}

export type EventType = 'Feira' | 'Reunião Ordinária' | 'Encontro' | 'Oficina' | 'Treinamento' | 'Outros';

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: EventType;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  date: string;
  memberId?: string;
  memberName?: string;
}

export type DocumentType = 'Statute' | 'Meeting Minutes' | 'Report' | 'Other';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  uploadDate: string;
  size: number; // in bytes
  url: string;
}

export interface Communication {
    id: string;
    subject: string;
    message: string;
    recipients: string;
    sentAt: string;
}
