class CommunicationCoachAgent extends BaseAgent {
    private openAI: OpenAIService;

    constructor(openAIService: OpenAIService) {
        super('Communication_Coach_Agent', ['1on1_script', 'feedback_advice', 'conflict_resolution']);
        this.openAI = openAIService;
    }

    processMessage(message: AgentMessage, context: Context): AgentResponse {
        if (message.messageType === 'request' && message.content.action === 'draft_feedback') {
            return this.draftFeedback(message.content.target, message.content.issue);
        }
        return { success: false, message: 'Unknown action' };
    }

    private draftFeedback(target: string, issue: string): AgentResponse {
        const systemPrompt = `You are an expert communication coach specializing in Non-Violent Communication (NVC) and psychological safety. 
    Draft a 1-on-1 feedback script.
    Recipient: ${target}
    Issue: ${issue}`;

        const userPrompt = `Please generate a structured script including:
    1. Opener (Set plain context)
    2. Observation (Objective facts)
    3. Impact (Why it matters)
    4. Question (Invite perspective)
    
    Keep it professional but empathetic.`;

        const script = this.openAI.generateCompletion(systemPrompt, userPrompt);

        return {
            success: true,
            data: { script },
            message: `Drafted feedback script for ${target} using AI.`
        };
    }
}
