




class TaskManagerAgent extends BaseAgent {
    private trello: TrelloService;
    private calendar: CalendarService;

    constructor(trelloService: TrelloService, calendarService: CalendarService) {
        super('Task_Manager_Agent', ['trello', 'task_management', 'calendar_sync']);
        this.trello = trelloService;
        this.calendar = calendarService;
    }

    public processMessage(message: AgentMessage, context: Context): AgentResponse {
        this.log(`Processing message: ${message.messageType}`, message.content);

        if (message.messageType === 'request' && message.content.action === 'sync_deadline') {
            return this.handleSyncDeadline(message.content);
        }

        return { success: false, message: 'Unknown action' };
    }

    private handleSyncDeadline(content: any): AgentResponse {
        const { cardId, taskTitle, dueDate } = content;
        const date = new Date(dueDate);

        // Update Trello
        this.trello.updateCardDueDate(cardId, date);

        // Update Calendar (Create a 1 hour block ending at due date as a placeholder)
        const startTime = new Date(date.getTime() - 60 * 60 * 1000);
        const eventId = this.calendar.createEvent(`Due: ${taskTitle}`, startTime, date, `Trello Card: ${cardId}`);

        return {
            success: true,
            data: { eventId },
            message: `Synced deadline for ${taskTitle} to ${date}`
        };
    }
}
