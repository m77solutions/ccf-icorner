import type { JourneyStage } from './ccfBrand';

export type Division = 'GLC' | 'Ministries' | 'Pastoral Areas';
export type NextStepType =
  | 'register_online'
  | 'pay_at_booth'
  | 'visit_booth'
  | 'call_pastoral_rep'
  | 'walk_in';

export interface CCFEvent {
  id: string;
  title: string;
  description: string;
  ministry: string;
  pastoral_area?: string;
  division: Division;
  journey_stage: JourneyStage | 'N/A';
  start_datetime: string;
  end_datetime: string;
  venue: string;
  is_online: boolean;
  cost: string;
  capacity?: number;
  registration_link?: string;
  poster_image?: string;
  contact_person: string;
  contact_number: string;
  next_step_type: NextStepType;
  is_featured: boolean;
  status: 'Published' | 'Draft' | 'Cancelled';
}

export interface PastoralRep {
  rep_id: string;
  pastoral_area: string;
  rep_name: string;
  rep_contact: string;
  on_call_today: boolean;
}
