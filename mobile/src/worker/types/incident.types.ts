/**
 * Values here are the literal strings the KPI engine matches on
 * (backend/app/controllers/dashboard.py) — do not "tidy" them into slugs.
 * `Injury` gates the recordable count; `Lost Time` gates LTIFR/LTISR/DART.
 */
export type IncidentType =
  | 'Injury'
  | 'Dangerous Occurrence'
  | 'Property Damage'
  | 'Environmental';

export type SeverityLevel = 'Minor' | 'Moderate' | 'Severe' | 'Lost Time' | 'Fatal';

export type IncidentStatus = 'submitted' | 'under_review' | 'investigating' | 'closed';

export type YesNo = 'Yes' | 'No';

export type PotentialConsequence = 'minor_injury' | 'lost_time_injury' | 'property_damage' | 'environmental_impact';
export type NearMissCause = 'slippery_floor' | 'missing_guard' | 'distraction' | 'poor_lighting' | 'other';

export interface PhotoAttachment {
  uri: string;
  name: string;
  type: string;
}

export interface ReportIncidentRequest {
  incident_date_time: string;
  location_station_id: number;
  incident_type: IncidentType;
  severity: SeverityLevel;
  description: string;
  immediate_cause?: string;
  number_persons_involved?: number;
  anyone_injured: YesNo;
  injured_person_name?: string;
  injured_body_part?: string;
  hazard_id: number;
  permit_active?: YesNo;
  control_failure?: YesNo;
  hazard_still_present?: YesNo;
  immediate_actions_taken?: string;
  witnesses?: string[];
  gps_latitude?: number;
  gps_longitude?: number;
  photos?: PhotoAttachment[];
}

export interface ReportNearMissRequest {
  description: string;
  potential_consequence: PotentialConsequence;
  causes: NearMissCause[];
  location: string;
  preventative_suggestion?: string;
  photos?: PhotoAttachment[];
}

export interface ReportUnsafeActRequest {
  category: string;
  observation_details: string;
  intervention_performed: boolean;
  location: string;
  department: string;
  photos?: PhotoAttachment[];
}

export interface Incident {
  id: string;
  incident_ref: string;
  incident_type: IncidentType;
  date: string;
  location: string;
  description: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  reported_by: string;
  created_at: string;
}

export interface IncidentListResponse {
  items: Incident[];
  total: number;
}
