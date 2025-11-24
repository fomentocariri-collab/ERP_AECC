export type Page = 'Dashboard' | 'Members' | 'Financial' | 'Events' | 'Documents' | 'Communications' | 'Projects' | 'ServiceProviders' | 'Inventory' | 'Settings';

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
  projectId?: string; // Novo: Vínculo com Projeto
  projectName?: string;
  providerId?: string; // Novo: Vínculo com Prestador
  providerName?: string;
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

// --- NOVOS TIPOS ---

export type ProjectStatus = 'Planning' | 'Active' | 'Completed' | 'Cancelled';

export interface Project {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string | null;
  status: ProjectStatus;
  proponent: string; // Quem propôs
  sponsor: string; // Patrocinador
  budget: number;
}

export type ProviderType = 'Artist' | 'Workshop Facilitator' | 'Designer' | 'Consultant' | 'Other';

export interface ServiceProvider {
  id: string;
  name: string;
  type: ProviderType;
  email: string;
  phone: string;
  cpfCnpj: string;
  portfolioUrl?: string;
  notes?: string;
}

export type InventoryCondition = 'New' | 'Good' | 'Fair' | 'Poor' | 'Broken';

export interface InventoryItem {
  id: string;
  name: string;
  code: string; // Código de tombamento
  acquisitionDate: string;
  value: number;
  condition: InventoryCondition;
  location: string;
  description?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  user_id: string;
  timestamp: string;
  details: string;
}