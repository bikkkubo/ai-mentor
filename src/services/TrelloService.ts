class TrelloService {
    private apiKey: string;
    private token: string;
    private baseUrl = 'https://api.trello.com/1';

    constructor(apiKey: string, token: string) {
        this.apiKey = apiKey;
        this.token = token;
    }

    /*
     * Helper to make authenticated requests
     */
    private fetch(endpoint: string, method: 'get' | 'put' | 'post' = 'get', payload?: any): any {
        const url = `${this.baseUrl}${endpoint}?key=${this.apiKey}&token=${this.token}`;
        const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
            method: method,
            muteHttpExceptions: true,
            contentType: 'application/json'
        };
        if (payload) {
            options.payload = JSON.stringify(payload);
        }

        try {
            const response = UrlFetchApp.fetch(url, options);
            const code = response.getResponseCode();
            const content = response.getContentText();

            if (code >= 400) {
                console.error(`Trello API Error (${code}): ${content}`);
                return null;
            }
            return JSON.parse(content);
        } catch (e) {
            console.error('Trello Request Failed:', e);
            return null;
        }
    }

    /**
     * Get all cards from a specific board
     * Note: For now, we might need a Board ID. 
     * As a fallback if no boardId is provided, we can fetch 'me/cards' (all assigned cards).
     */
    public getCardsWithDueDate(daysFromNow: number = 0): any[] {
        // Fetch all cards assigned to 'me'
        const cards = this.fetch('/members/me/cards');

        if (!cards || !Array.isArray(cards)) {
            return []; // Return empty if error
        }

        // Filter by due date
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysFromNow);
        targetDate.setHours(23, 59, 59, 999);

        return cards.map(card => {
            return {
                id: card.id,
                name: card.name,
                desc: card.desc,
                due: card.due,
                completed: card.dueComplete,
                url: card.shortUrl
            };
        }).filter(card => {
            if (!card.due) return false; // Ignore if no due date
            const cardDue = new Date(card.due);
            // Check if due date is today (or past due and not complete)
            // Logic: Due date is before end of target day && not completed
            return cardDue <= targetDate && !card.completed;
        });
    }

    public updateCardDueDate(cardId: string, dueDate: Date): void {
        const endpoint = `/cards/${cardId}`;
        this.fetch(endpoint, 'put', { due: dueDate.toISOString() });
        console.log(`Updated Trello card ${cardId} due date to ${dueDate}`);
    }
}
