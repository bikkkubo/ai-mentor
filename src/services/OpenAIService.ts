class OpenAIService {
    private apiKey: string;
    private model: string = 'gpt-4';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    public generateCompletion(systemPrompt: string, userPrompt: string): string {
        const url = 'https://api.openai.com/v1/chat/completions';

        const payload = {
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7
        };

        const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
            method: 'post',
            contentType: 'application/json',
            headers: {
                Authorization: `Bearer ${this.apiKey}`
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        };

        try {
            const response = UrlFetchApp.fetch(url, options);
            const json = JSON.parse(response.getContentText());

            if (json.error) {
                console.error('OpenAI Error:', json.error);
                return `Error: ${json.error.message}`;
            }

            return json.choices[0].message.content;
        } catch (e) {
            console.error('OpenAI Request Failed:', e);
            return 'Failed to generate response.';
        }
    }
}
