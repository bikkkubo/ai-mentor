




class MiddayCheckAgent extends BaseAgent {
    private trello: TrelloService;
    private calendar: CalendarService;

    constructor(trelloService: TrelloService, calendarService: CalendarService) {
        super('Midday_Check_Agent', ['progress_check', 'rescheduling', 'energy_management']);
        this.trello = trelloService;
        this.calendar = calendarService;
    }

    public processMessage(message: AgentMessage, context: Context): AgentResponse {
        if (message.messageType === 'request' && message.content.action === 'check_progress') {
            return this.performMiddayCheck();
        }
        return { success: false, message: 'Unknown action' };
    }

    private performMiddayCheck(): AgentResponse {
        // 1. Check Morning Tasks (Mock logic: assume tasks due today are the scope)
        const todaysTasks = this.trello.getCardsWithDueDate(0);

        // In a real scenario, we would filter for tasks that were explicitly planned for the morning
        // For now, we simulate finding incomplete tasks
        const delayedTasks = todaysTasks.filter(t => !t.completed); // Mock property 'completed' doesn't exist yet on raw Trello data

        // 2. Check Calendar for afternoon availability
        const now = new Date();
        const afternoonStart = new Date(now);
        afternoonStart.setHours(13, 0, 0, 0); // 1 PM
        const events = this.calendar.getEventsForDay(now);

        const reschedulingSuggestions: any[] = [];

        if (delayedTasks.length > 0) {
            reschedulingSuggestions.push({
                message: `You have ${delayedTasks.length} incomplete tasks from the morning.`,
                suggestion: 'Would you like to push non-critical meetings to tomorrow?'
            });

            // Attempt to find slots for them in the afternoon
            // (Reusing similar logic to DailyStandup, but scoped to afternoon)
        }

        return {
            success: true,
            data: {
                status: delayedTasks.length === 0 ? 'On Track' : 'Behind Schedule',
                delayedTasks: delayedTasks.map(t => t.name),
                suggestions: reschedulingSuggestions
            },
            message: delayedTasks.length === 0
                ? 'Great job! Morning goals achieved.'
                : 'Checkpoint: Some morning tasks are pending.'
        };
    }
}
