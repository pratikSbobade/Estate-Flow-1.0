import { supabase } from './supabase';
import { UserProfile } from '../types';

// users table uses snake_case columns; the app uses camelCase.
export const userFromDb = (u: any): UserProfile => ({
  id: u.id,
  name: u.name || u.email || 'User',
  email: u.email || '',
  role: u.role || 'role_agent',
  approvalStatus: u.approval_status || 'Pending',
  mobile: u.mobile || undefined,
  whatsapp: u.whatsapp || undefined,
  reraId: u.rera_id || undefined,
  territory: u.territory || undefined,
  joinDate: u.join_date || undefined,
  photo: u.photo || undefined,
  region: u.region || undefined,
  managerId: u.manager_id || undefined,
  createdAt: u.created_at || undefined,
});

export const userToDb = (u: Partial<UserProfile>) => {
  const row: Record<string, any> = {};
  if (u.id !== undefined) row.id = u.id;
  if (u.name !== undefined) row.name = u.name;
  if (u.email !== undefined) row.email = u.email;
  if (u.role !== undefined) row.role = u.role;
  if (u.approvalStatus !== undefined) row.approval_status = u.approvalStatus;
  if (u.mobile !== undefined) row.mobile = u.mobile;
  if (u.whatsapp !== undefined) row.whatsapp = u.whatsapp;
  if (u.reraId !== undefined) row.rera_id = u.reraId;
  if (u.territory !== undefined) row.territory = u.territory;
  if (u.joinDate !== undefined) row.join_date = u.joinDate;
  if (u.photo !== undefined) row.photo = u.photo;
  if (u.region !== undefined) row.region = u.region;
  if (u.managerId !== undefined) row.manager_id = u.managerId || null;
  return row;
};

export const updateUser = async (id: string, changes: Partial<UserProfile>) => {
  const { error } = await supabase.from('users').update(userToDb(changes)).eq('id', id);
  if (error) alert(`Could not update user: ${error.message}`);
  return !error;
};
