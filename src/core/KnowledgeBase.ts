

class KnowledgeBase {
    private static instance: KnowledgeBase;
    // In a real GAS app, this might cache to ScriptProperties or a Spreadsheet
    private memoryCache: { [key: string]: any } = {};

    private constructor() { }

    public static getInstance(): KnowledgeBase {
        if (!KnowledgeBase.instance) {
            KnowledgeBase.instance = new KnowledgeBase();
        }
        return KnowledgeBase.instance;
    }

    public getUserProfile(userId: string): UserProfile | null {
        // Mock implementation
        return {
            userId: userId,
            name: 'User',
            preferences: {
                workingHours: { start: '09:00', end: '18:00' },
                timezone: 'Asia/Tokyo'
            }
        };
    }

    public storeInsight(key: string, value: any): void {
        this.memoryCache[key] = value;
        // Persist to PropertiesService in production
        // PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(value));
    }

    public getInsight(key: string): any {
        return this.memoryCache[key];
    }
}
