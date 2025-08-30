export interface UserRole {
  id: string;
  name: 'admin' | 'manager' | 'analyst' | 'viewer';
  description: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  last_login?: string;
  mfa_enabled: boolean;
}

export interface AdminDashboardMetrics {
  total_users: number;
  active_users: number;
  total_matches: number;
  api_calls_today: number;
  system_health: 'healthy' | 'warning' | 'critical';
  database_size: number;
  response_time_avg: number;
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  created_at: string;
  acknowledged: boolean;
  resolved: boolean;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  updated_at: string;
  updated_by: string;
}