import { select, signedPhotoUrls } from '@/lib/supabase';
import { ageFromBirthdate } from '@/lib/mappers';

export interface StaffMember {
  id: number; name: string; role: string; nationality: string; age: number; license: string; photoUrl?: string;
}

/** The members table holds staff too (role COACHES); this is everyone who is not a player. */
export function staffFromDb(r: any): StaffMember {
  return {
    id: Number(r.id), name: r.name || 'Unnamed', role: String(r.position || '').trim(), nationality: r.nationality || '',
    age: ageFromBirthdate(r.birthdate), license: r.nat_matches != null ? String(r.nat_matches) : '',
    photoUrl: typeof r.image_url === 'string' && /^https?:/.test(r.image_url) ? r.image_url : undefined,
  };
}

export async function fetchStaff(): Promise<StaffMember[]> {
  const rows = await select<any>('members', 'select=id,role,name,position,nationality,birthdate,nat_matches,image_url,image_path&role=neq.PLAYERS&order=name.asc');
  const urls = await signedPhotoUrls(rows.map((r) => r.image_path).filter(Boolean));
  return rows.map((r) => {
    const s = staffFromDb(r);
    if (r.image_path && urls[r.image_path]) s.photoUrl = urls[r.image_path];
    return s;
  });
}
