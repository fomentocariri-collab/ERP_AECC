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

// Atualizado para incluir vínculos com Projetos e Prestadores
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  date: string;
  memberId?: string;
  memberName?: string;
  projectId?: string; // ID do Projeto vinculado
  projectName?: string; // Nome do Projeto
  providerId?: string; // ID do Prestador vinculado
  providerName?: string; // Nome do Prestador
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

// --- NOVOS MÓDULOS ---

export type ProjectStatus = 'Planning' | 'Active' | 'Completed' | 'Cancelled';

export interface Project {
  id: string;
  title: string;
  description: string; // Textão
  startDate: string;
  endDate: string | null;
  status: ProjectStatus;
  proponent: string;
  sponsor: string;
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
  code: string; // Tombamento
  acquisitionDate: string;
  value: number;
  condition: InventoryCondition;
  location: string;
  description?: string;
}