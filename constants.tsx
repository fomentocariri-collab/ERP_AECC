import React from 'react';
import { Home, Users, DollarSign, Calendar, FileText, Send, Settings } from 'lucide-react';

export const NAV_ITEMS = [
  { name: 'Dashboard', icon: <Home size={20}/> },
  { name: 'Members', icon: <Users size={20}/> },
  { name: 'Financial', icon: <DollarSign size={20}/> },
  { name: 'Events', icon: <Calendar size={20}/> },
  { name: 'Documents', icon: <FileText size={20}/> },
  { name: 'Communications', icon: <Send size={20}/> },
  { name: 'Settings', icon: <Settings size={20}/> },
];

export const LOGO_BASE64 = "[PLACEHOLDER_LOGO]"; // Use um placeholder ou o caminho para um arquivo
