export type IncidentType = 'injury' | 'spill' | 'fire' | 'equipment_damage' | 'near_miss';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'submitted' | 'under_review' | 'investigating' | 'closed';

export type PotentialConsequence = 'minor_injury' | 'lost_time_injury' | 'property_damage' | 'environmental_impact';
export type NearMissCause = 'slippery_floor' | 'missing_guard' | 'distraction' | 'poor_lighting' | 'other';

export interface PhotoAttachment {
  uri: string;
  name: string;
  type: string;
}

export interface ReportIncidentRequest {
  incident_type: IncidentType;
  date: string;
  time: string;
  location: string;
  location_station_id?: number;
  latitude?: number;
  longitude?: number;
  gps_latitude?: string;
  gps_longitude?: string;
  description: string;
  immediate_actions: string;
  severity: SeverityLevel;
  photos?: PhotoAttachment[];
  // Additional fields captured on-site
  number_persons_involved?: number;
  control_failure?: string;
  hazard_still_present?: string;
  injured_body_part?: string;
  witnesses_json?: string[];
  hazard_id?: number;
}

export interface ReportNearMissRequest {
  description: string;
  potential_consequence: PotentialConsequence;
  causes: NearMissCause[];
  location: string;
  location_station_id?: number;
  preventative_suggestion?: string;
  photos?: PhotoAttachment[];
  // Additional fields that map to backend NearMissReport schema
  underlying_cause?: string;
  control_failure?: string;
  hazard_still_present?: string;
  witnesses?: string[];
  gps_latitude?: string;
  gps_longitude?: string;
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
