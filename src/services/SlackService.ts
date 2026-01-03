class SlackService {
    private token: string;
    private apiUrl = 'https://slack.com/api';

    constructor(token: string) {
        this.token = token;
    }

    public postMessage(channel: string, text: string, blocks?: any[]): any {
        const payload: any = { channel, text };
        if (blocks) {
            payload.blocks = JSON.stringify(blocks);
        }

        return this.callApi('chat.postMessage', payload);
    }

    public getChannelHistory(channel: string, limit: number = 5): any[] {
        const payload = { channel, limit };
        const result = this.callApi('conversations.history', payload);
        if (result && result.ok && result.messages) {
            return result.messages.map((m: any) => ({
                user: m.user,
                text: m.text,
                bot_id: m.bot_id
            })).reverse(); // Oldest first
        }
        return [];
    }

    private callApi(endpoint: string, payload: any): any {
        const url = `${this.apiUrl}/${endpoint}`;
        const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
            method: 'post',
            contentType: 'application/x-www-form-urlencoded',
            headers: { Authorization: `Bearer ${this.token}` },
            payload: payload
        };

        try {
            const response = UrlFetchApp.fetch(url, options);
            return JSON.parse(response.getContentText());
        } catch (e) {
            console.error(`Slack API Error (${endpoint}):`, e);
            return null;
        }
    }
}
