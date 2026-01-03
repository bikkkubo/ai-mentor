













// Global instances
const orchestrator = new Orchestrator();
const knowledgeBase = KnowledgeBase.getInstance();

// Services (Keys should be in ScriptProperties)
const scriptProperties = PropertiesService.getScriptProperties();
const OPENAI_API_KEY = scriptProperties.getProperty('OPENAI_API_KEY') || '';
const TRELLO_KEY = scriptProperties.getProperty('TRELLO_KEY') || '';
const TRELLO_TOKEN = scriptProperties.getProperty('TRELLO_TOKEN') || '';

const trelloService = new TrelloService(TRELLO_KEY, TRELLO_TOKEN);
const calendarService = new CalendarService();
const openAIService = new OpenAIService(OPENAI_API_KEY);

// Agents
const taskManager = new TaskManagerAgent(trelloService, calendarService);
const dailyStandup = new DailyStandupAgent(trelloService, calendarService, openAIService);
const middayCheck = new MiddayCheckAgent(trelloService, calendarService);
const eveningReview = new EveningReviewAgent(trelloService, calendarService);
const analytics = new AnalyticsAgent();
const psychology = new PsychologyCoachAgent();
const teamManagement = new TeamManagementAgent();
const communicationq = new CommunicationCoachAgent(openAIService);
const executiveAssistant = new ExecutiveAssistantAgent(calendarService);
const startupOps = new StartupOperationsAgent();
const vendorMgmt = new VendorManagementAgent();

orchestrator.registerAgent(taskManager);
orchestrator.registerAgent(dailyStandup);
orchestrator.registerAgent(middayCheck);
orchestrator.registerAgent(eveningReview);
orchestrator.registerAgent(analytics);
orchestrator.registerAgent(psychology);
orchestrator.registerAgent(teamManagement);
orchestrator.registerAgent(communicationq);
orchestrator.registerAgent(executiveAssistant);
orchestrator.registerAgent(startupOps);
orchestrator.registerAgent(vendorMgmt);

const SLACK_BOT_TOKEN = scriptProperties.getProperty('SLACK_BOT_TOKEN') || '';
const slackService = new SlackService(SLACK_BOT_TOKEN);

/**
 * Web App Entry Point
 */
function doGet(e: GoogleAppsScript.Events.DoGet) {
    return HtmlService.createTemplateFromFile('web/index')
        .evaluate()
        .setTitle('AI Mentor Web')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * API: Get Initial Data for Web App
 */
function api_getData() {
    // 1. Get Tasks (180 days)
    const tasks = trelloService.getCardsWithDueDate(180);

    // 2. Get Events
    const now = new Date();
    const events = calendarService.getEventsForDay(now);

    return {
        tasks: tasks.map(t => ({ id: t.id, name: t.name, due: t.due, listId: t.idList || 'unknown' })), // Mock listId for now
        events: events.map(e => ({ title: e.getTitle(), start: e.getStartTime().toString(), end: e.getEndTime().toString() }))
    };
}

/**
 * API: Chat Handler
 */
function api_chat(text: string) {
    // Reuse the existing Orchestrator/OpenAI logic
    const systemPrompt = "あなたはWebダッシュボードのアシスタントAIです。簡潔に、日本語で回答してください。";
    const response = openAIService.generateCompletion(systemPrompt, text);
    return { text: response };
}

/**
 * Entry point for Slack events
 */
function doPost(e: GoogleAppsScript.Events.DoPost) {
    try {
        const postData = JSON.parse(e.postData.contents);

        // 1. URL Verification (Required for Slack App Setup)
        if (postData.type === 'url_verification') {
            return ContentService.createTextOutput(postData.challenge);
        }

        // 2. Event Callback (Messages)
        if (postData.type === 'event_callback') {
            const event = postData.event;

            // Ignore bot messages to prevent loops
            if (event.bot_id) {
                return ContentService.createTextOutput('OK');
            }

            // Handle App Mentions or DMs
            if (event.type === 'app_mention' || event.type === 'message') {
                processSlackEvent(event);
            }
        }

        return ContentService.createTextOutput('OK');
    } catch (error) {
        console.error('doPost Error:', error);
        return ContentService.createTextOutput('Error');
    }
}

function processSlackEvent(event: any) {
    const userId = event.user;
    const channelId = event.channel;
    // Remove mention (<@U...>) and trim whitespace
    const text = event.text.replace(/<@[^>]+>/g, '').trim().toLowerCase();

    // Simple routing for testing
    let responseText = '';

    if (text.includes('standup') || text.includes('stand up') || text.includes('朝会')) {
        const context: Context = { userId, platform: 'slack', sessionId: channelId };
        const msg: AgentMessage = {
            messageId: `msg-${Date.now()}`,
            fromAgent: 'user',
            toAgent: 'Daily_Standup_Agent',
            messageType: 'request',
            content: { action: 'start_standup' },
            priority: 'high',
            timestamp: new Date(),
            requiresResponse: true
        };
        const resp = orchestrator.routeMessage(msg, context);
        responseText = resp.message || 'Standup started.';
    } else if (text.includes('help') || text.includes('助けて')) {
        responseText = "How can I help?\n- Say 'standup' or 'stand up' for daily briefing\n- Say 'deadline' for task list";
    } else {
    } else {
        // Default: Chat with Psychology Coach (using OpenAI) WITH CONTEXT

        // 1. Fetch recent history to understand context (e.g., previous standup posts)
        const history = slackService.getChannelHistory(channelId, 5); // Get last 5 messages
        const historyText = history.map(h => `${h.bot_id ? '[Bot]' : '[User]'}: ${h.text}`).join('\n');

        const systemPrompt = `You are an Agile Coach and AI Mentor acting as a facilitator.
        
        Current Context (Recent Chat History):
        ${historyText}

        User's New Message:
        "${text}"

        Your Goal:
        - If the user is replying to a Daily Standup (e.g., updating tasks), acknowledge it and facilitate further (e.g., "Understood, updating priority.").
        - If it's a general question, answer acting as a mentor.
        - Keep responses short, encouraging, and in Japanese.`;

        // We pass empty user prompt because the context is already in system prompt
        responseText = openAIService.generateCompletion(systemPrompt, '');
    }

    slackService.postMessage(channelId, responseText);
}

/**
 * Test OpenAI Connection
 */
function testOpenAIConnection() {
    console.log('Testing OpenAI Connection...');
    const result = openAIService.generateCompletion('You are a helpful assistant.', 'Say "OpenAI is connected!"');
    console.log('OpenAI Response:', result);
}

/**
 * Test Trello Connection
 */
function testTrelloConnection() {
    console.log('Testing Trello Connection...');
    // Fetch cards due within next 6 months (to catch future tasks)
    const cards = trelloService.getCardsWithDueDate(180);
    console.log(`Found ${cards.length} active cards assigned to you (due within 180 days).`);
    if (cards.length > 0) {
        console.log('Sample Card:', cards[0].name);
    } else {
        console.log('No cards found. (Check if you have assigned cards with due dates)');
    }
}

/**
 * Manual test function to verify full system cycle
 */
function testFullCycle() {
    const context: Context = {
        userId: 'test-user',
        platform: 'scheduler',
        sessionId: 'test-session-full'
    };

    console.log('=== STARTING SYSTEM TEST ===');

    // 1. Morning Standup
    console.log('\n--- 1. Morning Standup ---');
    let msg: AgentMessage = {
        messageId: 'msg-morning',
        fromAgent: 'system',
        toAgent: 'Daily_Standup_Agent',
        messageType: 'request',
        content: { action: 'start_standup' },
        priority: 'high',
        timestamp: new Date(),
        requiresResponse: true
    };
    let resp = orchestrator.routeMessage(msg, context);
    console.log('Standup Result:', JSON.stringify(resp));

    // 2. Communication Coach (AI Powered)
    console.log('\n--- 2. Communication Coach (AI) ---');
    msg = { ...msg, messageId: 'msg-comm', toAgent: 'Communication_Coach_Agent', content: { action: 'draft_feedback', target: 'Alice', issue: 'Missing deadlines' } };
    resp = orchestrator.routeMessage(msg, context);
    console.log('Comm Coach Result:', JSON.stringify(resp));

    console.log('=== TEST COMPLETE ===');
}

/**
 * --- TRIGGER SETUP ---
 * Run 'setupTriggers' manually once to schedule these agents.
 */

function setupTriggers() {
    clearTriggers(); // Clean up old triggers first

    // 1. Morning Standup (09:00 AM)
    ScriptApp.newTrigger('triggerMorningStandup')
        .timeBased()
        .everyDays(1)
        .atHour(9) // 9:00 - 10:00 range
        .create();

    // 2. Midday Check (12:00 PM)
    ScriptApp.newTrigger('triggerMiddayCheck')
        .timeBased()
        .everyDays(1)
        .atHour(12)
        .create();

    // 3. Evening Review (18:00 PM)
    ScriptApp.newTrigger('triggerEveningReview')
        .timeBased()
        .everyDays(1)
        .atHour(18)
        .create();

    console.log('Triggers set up successfully for 9:00, 12:00, and 18:00.');
}

function clearTriggers() {
    const triggers = ScriptApp.getProjectTriggers();
    for (const trigger of triggers) {
        ScriptApp.deleteTrigger(trigger);
    }
    console.log('Old triggers cleared.');
}

/**
 * --- TRIGGER CALLBACKS ---
 * These are called automatically by GAS at the scheduled times.
 * We hardcode a 'default-channel' for now, but ideally this comes from UserProfile.
 */

// We need a target channel for proactive messages. 
// For now, let's look for a property or default to the first channel active.
const DEFAULT_CHANNEL_ID = scriptProperties.getProperty('DEFAULT_CHANNEL_ID') || '';

// Helper to run agent cleanly
function runScheduledAgent(agentName: string, action: string) {
    if (!DEFAULT_CHANNEL_ID) {
        console.error('No DEFAULT_CHANNEL_ID set. Cannot send proactive message.');
        return;
    }

    const context: Context = { userId: 'scheduler', platform: 'slack', sessionId: DEFAULT_CHANNEL_ID };
    const msg: AgentMessage = {
        messageId: `msg-sched-${Date.now()}`,
        fromAgent: 'system',
        toAgent: agentName,
        messageType: 'request',
        content: { action: action },
        priority: 'high',
        timestamp: new Date(),
        requiresResponse: true
    };

    const resp = orchestrator.routeMessage(msg, context);
    // Send response to Slack
    if (resp.message) {
        slackService.postMessage(DEFAULT_CHANNEL_ID, resp.message);
    }
}

// 1. Morning
function triggerMorningStandup() {
    runScheduledAgent('Daily_Standup_Agent', 'start_standup');
}

// 2. Midday
function triggerMiddayCheck() {
    runScheduledAgent('Midday_Check_Agent', 'check_progress');
}

// 3. Evening
function triggerEveningReview() {
    runScheduledAgent('Evening_Review_Agent', 'start_review');
}
