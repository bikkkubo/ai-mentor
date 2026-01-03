

abstract class BaseAgent {
    readonly agentId: string;
    readonly specialization: string[];

    constructor(agentId: string, specialization: string[]) {
        this.agentId = agentId;
        this.specialization = specialization;
    }

    /**
     * Process an incoming message or event
     */
    abstract processMessage(message: AgentMessage, context: Context): AgentResponse;

    /**
     * Log an activity or insight to the console/system
     */
    protected log(message: string, data?: any): void {
        console.log(`[${this.agentId}] ${message}`, data ? JSON.stringify(data) : '');
    }
}
