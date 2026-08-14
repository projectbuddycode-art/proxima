export type AppMode = 'DEMO' | 'REAL';

export interface ProximaConfig {
  app_name: string;
  app_tagline: string;
  app_mode: AppMode;
  zero_fabrication_strict: boolean;
  min_verification_confidence: number;
  titan_email_enabled: boolean;
  map_offline_enabled: boolean;
  security_scouts_enabled: boolean;
}

export const PROXIMA_DEFAULT_CONFIG: ProximaConfig = {
  app_name: 'PROXIMA',
  app_tagline: 'PROXIMA by Project Buddy — Autonomous Client Acquisition & Verified Business Intelligence OS',
  app_mode: 'REAL',
  zero_fabrication_strict: true,
  min_verification_confidence: 80,
  titan_email_enabled: true,
  map_offline_enabled: true,
  security_scouts_enabled: true
};

export function getProximaConfig(): ProximaConfig {
  return PROXIMA_DEFAULT_CONFIG;
}
