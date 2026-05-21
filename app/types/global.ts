import type { Database } from './supabase';

type Tables = Database['public']['Tables'];

export type Profile = Tables['user_profiles']['Row'];
export type Brand = Tables['brands']['Row'];
export type Template = Tables['templates']['Row'];
export type TemplateLocale = Tables['template_locales']['Row'];
export type Team = Tables['teams']['Row'];
export type TeamMember = Tables['team_members']['Row'];

export interface TemplateWithLocales extends Template {
  template_locales: TemplateLocale[];
}

export interface TeamWithMembers extends Team {
  team_members: TeamMember[];
}

export interface TemplateWithTeam extends Template {
  team?: Team;
}

export interface TemplateWithBrand extends Template {
  brand?: Brand;
}

export type TeamRole = TeamMember['role'];
