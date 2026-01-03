




class DailyStandupAgent extends BaseAgent {
    private trello: TrelloService;
    private calendar: CalendarService;
    private openai: OpenAIService;

    constructor(trelloService: TrelloService, calendarService: CalendarService, openAIService: OpenAIService) {
        super('Daily_Standup_Agent', ['planning', 'time_blocking', 'morning_briefing']);
        this.trello = trelloService;
        this.calendar = calendarService;
        this.openai = openAIService;
    }

    public processMessage(message: AgentMessage, context: Context): AgentResponse {
        if (message.messageType === 'request' && message.content.action === 'start_standup') {
            return this.runStandupSequence();
        }
        return { success: false, message: 'Unknown action' };
    }

    private runStandupSequence(): AgentResponse {
        // 1. Fetch Today's Tasks (and upcoming 6 months to ensure we have content for demo)
        const tasks = this.trello.getCardsWithDueDate(180);

        // 2. Fetch Today's Calendar
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59);
        const events = this.calendar.getEventsForDay(now);

        // 3. Simple Time Blocking Logic
        // Strategy: Find first available slot after 09:00 for each task
        // (This is a simplified algorithm)
        let currentTime = new Date();
        currentTime.setHours(9, 0, 0, 0); // Start day at 9 AM
        if (currentTime < now) currentTime = new Date(now.getTime() + 15 * 60000); // Or 15 mins from now

        const plannedBlocks: any[] = [];

        for (const task of tasks) {
            // Estimate duration: Default 60 mins (should come from AI estimation in future)
            const durationMs = 60 * 60 * 1000;

            // Find a slot
            const { start, end } = this.findNextSlot(currentTime, durationMs, events);

            if (start && end) {
                // Create Block
                const eventId = this.calendar.createEvent(
                    `[Focus] ${task.name}`,
                    start,
                    end,
                    `Task ID: ${task.id}\n${task.desc}`
                );
                plannedBlocks.push({ task: task.name, start: start.toLocaleTimeString(), end: end.toLocaleTimeString() });

                // Advance current time
                currentTime = new Date(end.getTime() + 15 * 60000); // 15 min buffer
            } else {
                plannedBlocks.push({ task: task.name, status: 'No time slot found' });
            }
        }

        // 4. Generate LLM Briefing
        const taskListString = tasks.map(t => `- ${t.name} (Due: ${t.due ? new Date(t.due).toLocaleDateString() : 'None'})`).join('\n');

        const systemPrompt = `You are an excellent Agile Coach running a Daily Standup.
        Current Date: ${now.toLocaleDateString()}
        
        Your Goal:
        1. Declare the start of the Daily Standup for ${now.toLocaleDateString()}.
        2. List the 'Doing' tasks (provided below) clearly.
        3. Ask the user a strategic question about subtasks, dependencies, or blockers relative to these tasks.
        
        Tone: Professional, energetic, and concise. Japanese language.`;

        const userPrompt = `Here are the tasks for today:\n${taskListString}`;

        const aiResponse = this.openai.generateCompletion(systemPrompt, userPrompt);

        return {
            success: true,
            data: { plannedBlocks },
            message: aiResponse
        };
    }

    private findNextSlot(startSearch: Date, durationMs: number, existingEvents: GoogleAppsScript.Calendar.CalendarEvent[]): { start?: Date, end?: Date } {
        // Very naive implementation: check if proposed slot conflicts with anything
        let proposedStart = new Date(startSearch);
        let proposedEnd = new Date(proposedStart.getTime() + durationMs);

        // Limit search to 10 attempts to avoid infinite loops
        for (let i = 0; i < 10; i++) {
            let conflict = false;
            for (const event of existingEvents) {
                const eStart = event.getStartTime();
                const eEnd = event.getEndTime();

                // Overlap check
                if (proposedStart < eEnd && proposedEnd > eStart) {
                    conflict = true;
                    // Jump to end of this conflict
                    proposedStart = new Date(eEnd.getTime() + 5 * 60000); // 5 min buffer
                    proposedEnd = new Date(proposedStart.getTime() + durationMs);
                    break;
                }
            }
            if (!conflict) {
                return { start: proposedStart, end: proposedEnd };
            }
        }

        return {}; // No slot found
    }
}
