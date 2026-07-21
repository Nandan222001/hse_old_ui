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
  latitude?: number;
  longitude?: number;
  description: string;
  immediate_actions: string;
  severity: SeverityLevel;
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
