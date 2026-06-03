import { AVATAR_PALETTES } from '../constants';

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function avatarPalette(id: string | number): { bg: string; border: string; text: string } { 
  const numericId = typeof id === 'string' ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : id;
  return AVATAR_PALETTES[numericId % AVATAR_PALETTES.length]; 
}

export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  if (dateStr.includes('T')) return new Date(dateStr);
  
  const cleanStr = dateStr.replace(',', '').trim();
  const parts = cleanStr.split(' ');
  const datePart = parts[0];
  
  const [day, month, year] = datePart.split('/').map(Number);
  const d = new Date(year, month - 1, day);
  
  if (parts[1]) {
    const [h, m, s] = parts[1].split(':').map(Number);
    if (!isNaN(h)) d.setHours(h);
    if (!isNaN(m)) d.setMinutes(m || 0);
    if (!isNaN(s)) d.setSeconds(s || 0);
  }
  
  return isNaN(d.getTime()) ? new Date(0) : d;
}

export function daysSince(isoOrBr: string): number {
  try {
    const d = parseDate(isoOrBr);
    if (d.getTime() === 0) return 0;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  } catch { return 0; }
}

export function formatBRDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

export function formatBRDateTime(date: Date): string {
  return date.toLocaleString('pt-BR');
}
