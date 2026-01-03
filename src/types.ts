interface AgentResponse {
  success: boolean;
  data?: any;
  message?: string;
  nextAction?: string;
}

interface AgentMessage {
  messageId: string;
  fromAgent: string;
  toAgent?: string;
  messageType: 'insight' | 'request' | 'response' | 'alert';
  content: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  requiresResponse: boolean;
  correlationId?: string;
}

interface UserProfile {
  userId: string;
  name: string;
  preferences: {
    workingHours: { start: string; end: string };
    timezone: string;
  };
  // To be expanded
}

interface Context {
  userId: string;
  platform: 'slack' | 'trello' | 'scheduler';
  sessionId: string;
}
