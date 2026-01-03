




class EveningReviewAgent extends BaseAgent {
    private trello: TrelloService;
    private calendar: CalendarService;

    constructor(trelloService: TrelloService, calendarService: CalendarService) {
        super('Evening_Review_Agent', ['daily_review', 'reflection', 'metrics_tracking']);
        this.trello = trelloService;
        this.calendar = calendarService;
    }

    public processMessage(message: AgentMessage, context: Context): AgentResponse {
        if (message.messageType === 'request' && message.content.action === 'start_review') {
            return this.performEveningReview();
        }
        return { success: false, message: 'Unknown action' };
    }

    private performEveningReview(): AgentResponse {
        // 1. Analyze Today's Achievements
        const tasks = this.trello.getCardsWithDueDate(0);
        const completed = tasks.filter(t => t.completed); // Mock property
        const incomplete = tasks.filter(t => !t.completed);

        // 2. Generate Insight
        const completionRate = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0;

        let feedback = '';
        if (completionRate >= 80) {
            feedback = 'Outstanding work today! You maintained high focus.';
        } else if (completionRate >= 50) {
            feedback = 'Good effort. Let\'s see how we can improve focus tomorrow.';
        } else {
            feedback = 'It seems like a tough day. Remember to be kind to yourself.';
        }

        // 3. Reschedule Incomplete Tasks (Logic to be expanded)
        // For now, just listing them.

        return {
            success: true,
            data: {
                completionRate,
                completedCount: completed.length,
                incompleteCount: incomplete.length,
                feedback
            },
            message: `Evening Review: ${feedback}`
        };
    }
}
