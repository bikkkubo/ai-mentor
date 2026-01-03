


class Orchestrator {
    private agents: Map<string, BaseAgent> = new Map();

    constructor() { }

    public registerAgent(agent: BaseAgent): void {
        this.agents.set(agent.agentId, agent);
        console.log(`Registered agent: ${agent.agentId}`);
    }

    public routeMessage(message: AgentMessage, context: Context): AgentResponse {
        console.log(`Routing message to: ${message.toAgent}`);

        if (!message.toAgent) {
            return { success: false, message: 'Broadcast not implemented yet' };
        }

        const agent = this.agents.get(message.toAgent);
        if (!agent) {
            return { success: false, message: `Agent not found: ${message.toAgent}` };
        }

        return agent.processMessage(message, context);
    }

    public getAgent(agentId: string): BaseAgent | undefined {
        return this.agents.get(agentId);
    }
}
