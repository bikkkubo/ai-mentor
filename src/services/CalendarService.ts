class CalendarService {
    private calendar: GoogleAppsScript.Calendar.Calendar;

    constructor() {
        this.calendar = CalendarApp.getDefaultCalendar();
    }

    public createEvent(title: string, startTime: Date, endTime: Date, description?: string): string {
        const event = this.calendar.createEvent(title, startTime, endTime, {
            description: description
        });
        return event.getId();
    }

    public updateEventDeadline(eventId: string, newEndTime: Date): void {
        const event = this.calendar.getEventById(eventId);
        if (event) {
            const duration = event.getEndTime().getTime() - event.getStartTime().getTime();
            const newStartTime = new Date(newEndTime.getTime() - duration);
            event.setTime(newStartTime, newEndTime);
        }
    }

    public getEventsForDay(date: Date): GoogleAppsScript.Calendar.CalendarEvent[] {
        return this.calendar.getEventsForDay(date);
    }
}
