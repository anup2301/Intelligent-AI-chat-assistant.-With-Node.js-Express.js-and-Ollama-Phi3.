const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Debug environment variables
console.log('🔧 Environment check:');
console.log('OLLAMA_BASE_URL:', process.env.OLLAMA_BASE_URL || 'NOT SET - using http://localhost:11434');
console.log('PHI3_MODEL:', process.env.PHI3_MODEL || 'NOT SET - using phi3:mini');
console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'SET' : 'NOT SET');

// Load knowledge base with error handling
let knowledgeBase;
try {
    knowledgeBase = require('./src/services/knowledgeBase');
    console.log('✅ Knowledge base loaded successfully');
} catch (error) {
    console.error('❌ Failed to load knowledge base:', error.message);
    // Create a fallback knowledge base
    knowledgeBase = {
        searchKnowledge: (query) => {
            console.log('📚 Using fallback knowledge base for:', query);
            const queryLower = query.toLowerCase();
            
            if (queryLower.includes('premade') || queryLower.includes('company') || queryLower.includes('what do you do')) {
                return 'Premade Innovation is a cutting-edge technology company focused on innovative software and AI solutions. Our mission is to revolutionize industries through intelligent automation and innovative software solutions.';
            }
            
            if (queryLower.includes('service') || queryLower.includes('what do you offer')) {
                return 'Our services include: AI Development (custom AI solutions), Software Development (full-stack applications), Data Analytics (business intelligence), Consulting (technology strategy), and Automation (process optimization).';
            }
            
            if (queryLower.includes('founder') || queryLower.includes('ceo') || queryLower.includes('manish')) {
                return 'Our CEO is Manish Chandra, a technology visionary with 15+ years in AI and software development.';
            }
            
            if (queryLower.includes('code') && queryLower.includes('space') && queryLower.includes('string')) {
                return `Here's code to find spaces in a string:

**JavaScript:**
\`\`\`javascript
function findSpaces(str) {
    let positions = [];
    for (let i = 0; i < str.length; i++) {
        if (str[i] === ' ') {
            positions.push(i);
        }
    }
    return positions;
}

// Example: findSpaces("Hello World") returns [5]
\`\`\`

**Python:**
\`\`\`python
def find_spaces(text):
    return [i for i, char in enumerate(text) if char == ' ']

# Example: find_spaces("Hello World") returns [5]
\`\`\``;
            }
            
            return null;
        }
    };
}

// In-memory storage for chat sessions and context
const chatSessions = new Map();
const sessionContexts = new Map();
const activeUsers = new Map();

// Ensure user-logs directory exists
const userLogsDir = path.join(__dirname, 'src/data/user-logs');
if (!fs.existsSync(userLogsDir)) {
    fs.mkdirSync(userLogsDir, { recursive: true });
    console.log('✅ Created user-logs directory');
}

// Utility functions
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password + 'salt_key_2024').digest('hex');
}

// File-based user management functions
async function loadUsers() {
    try {
        const usersFile = path.join(__dirname, 'src/data/users.json');
        if (fs.existsSync(usersFile)) {
            const data = await fsPromises.readFile(usersFile, 'utf8');
            return JSON.parse(data);
        } else {
            // Create default admin user
            const defaultUsers = [{
                id: generateUserId(),
                username: 'admin',
                password: hashPassword('admin'),
                name: 'Administrator',
                email: 'admin@premadeinnovation.com',
                role: 'admin',
                registeredAt: new Date().toISOString()
            }];
            await saveUsers(defaultUsers);
            console.log('✅ Created default admin user');
            return defaultUsers;
        }
    } catch (error) {
        console.error('❌ Error loading users:', error);
        return [];
    }
}

async function saveUsers(users) {
    try {
        const usersFile = path.join(__dirname, 'src/data/users.json');
        await fsPromises.writeFile(usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('❌ Error saving users:', error);
    }
}

async function createUserLogFile(username) {
    try {
        const userLogFile = path.join(userLogsDir, `${username}.json`);
        const initialData = {
            username: username,
            createdAt: new Date().toISOString(),
            conversations: [],
            settings: {
                voiceEnabled: true,
                theme: 'light'
            },
            statistics: {
                totalQuestions: 0,
                totalSessions: 0,
                lastActivity: new Date().toISOString()
            }
        };
        await fsPromises.writeFile(userLogFile, JSON.stringify(initialData, null, 2));
        console.log(`✅ Created user log file for ${username}`);
    } catch (error) {
        console.error(`❌ Error creating user log file for ${username}:`, error);
    }
}

async function loadUserLogs(username) {
    try {
        const userLogFile = path.join(userLogsDir, `${username}.json`);
        if (fs.existsSync(userLogFile)) {
            const data = await fsPromises.readFile(userLogFile, 'utf8');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error(`❌ Error loading logs for ${username}:`, error);
        return null;
    }
}

async function saveUserLogs(username, logs) {
    try {
        const userLogFile = path.join(userLogsDir, `${username}.json`);
        await fsPromises.writeFile(userLogFile, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error(`❌ Error saving logs for ${username}:`, error);
    }
}

// Input validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateUsername(username) {
    return username && username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>\"'&]/g, '');
}

// Chat session management functions
function getUserChatData(userId) {
    if (!chatSessions.has(userId)) {
        chatSessions.set(userId, {
            currentSessionId: null,
            sessions: new Map()
        });
    }
    return chatSessions.get(userId);
}

function createNewChatSession(userId, title = null) {
    const sessionId = generateSessionId();
    const userData = getUserChatData(userId);
    
    if (!title) {
        const sessionCount = userData.sessions.size + 1;
        title = `Chat ${sessionCount}`;
    }
    
    userData.sessions.set(sessionId, {
        id: sessionId,
        title: title,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    
    userData.currentSessionId = sessionId;
    sessionContexts.set(sessionId, []);
    
    return sessionId;
}

async function addMessageToSession(userId, message, sender, metadata = {}) {
    const userData = getUserChatData(userId);
    
    if (!userData.currentSessionId) {
        createNewChatSession(userId);
    }
    
    const session = userData.sessions.get(userData.currentSessionId);
    if (session) {
        const messageObj = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            sender: sender,
            message: sanitizeInput(message),
            timestamp: new Date().toISOString(),
            ...metadata
        };
        
        session.messages.push(messageObj);
        session.updatedAt = new Date().toISOString();
        
        if (sender === 'user' && session.messages.filter(m => m.sender === 'user').length === 1) {
            session.title = message.length > 50 ? message.substring(0, 50) + '...' : message;
        }
        
        const context = sessionContexts.get(userData.currentSessionId) || [];
        context.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content: message
        });
        
        if (context.length > 20) {
            context.splice(0, context.length - 20);
        }
        
        sessionContexts.set(userData.currentSessionId, context);
        
        // Save to user logs
        await updateUserStatistics(userId, sender === 'user');
    }
}

async function updateUserStatistics(username, isQuestion = false) {
    try {
        const userLogs = await loadUserLogs(username);
        if (userLogs) {
            if (isQuestion) {
                userLogs.statistics.totalQuestions++;
            }
            userLogs.statistics.lastActivity = new Date().toISOString();
            await saveUserLogs(username, userLogs);
        }
    } catch (error) {
        console.error(`❌ Error updating statistics for ${username}:`, error);
    }
}

function getSessionContext(sessionId) {
    return sessionContexts.get(sessionId) || [];
}

// API Routes

// Test knowledge base endpoint
app.get('/api/test-knowledge', (req, res) => {
    try {
        console.log('🧪 Testing knowledge base...');
        const testResult = knowledgeBase.searchKnowledge('What does Premade Innovation do?');
        console.log('📚 Knowledge base test result:', testResult);
        res.json({ 
            knowledgeBase: 'loaded',
            testQuery: 'What does Premade Innovation do?',
            result: testResult 
        });
    } catch (error) {
        console.error('❌ Knowledge base test failed:', error);
        res.json({ 
            knowledgeBase: 'error',
            error: error.message 
        });
    }
});

// Enhanced test endpoint
app.get('/api/test', async (req, res) => {
    const users = await loadUsers();
    res.json({
        message: 'Learning AI Assistant Server is running',
        phi3Available: false,
        phi3Status: 'checking',
        googleSearch: process.env.GOOGLE_API_KEY ? 'enabled' : 'disabled',
        model: process.env.PHI3_MODEL || 'phi3:mini',
        knowledgeBase: 'loaded',
        nodeVersion: process.version,
        totalUsers: users.length,
        userLogsEnabled: true,
        timestamp: new Date().toISOString()
    });
});

// User registration endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        
        // Validation
        if (!name || !username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (!validateUsername(username)) {
            return res.status(400).json({ error: 'Username must be at least 3 characters and contain only letters, numbers, and underscores' });
        }
        
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const users = await loadUsers();
        
        if (users.find(u => u.username === username || u.email === email)) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        const newUser = {
            id: generateUserId(),
            username: sanitizeInput(username),
            password: hashPassword(password),
            name: sanitizeInput(name),
            email: sanitizeInput(email),
            role: 'user',
            registeredAt: new Date().toISOString()
        };
        
        users.push(newUser);
        await saveUsers(users);
        await createUserLogFile(username);
        
        console.log(`✅ New user registered: ${username}`);
        
        res.json({ 
            success: true, 
            message: 'Registration successful! Please login.',
            userId: newUser.id
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
});

// User login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        const users = await loadUsers();
        const user = users.find(u => 
            u.username === username && u.password === hashPassword(password)
        );
        
        if (user) {
            const sessionToken = crypto.randomBytes(32).toString('hex');
            activeUsers.set(sessionToken, {
                userId: user.id,
                username: user.username,
                role: user.role,
                loginTime: new Date().toISOString()
            });
            
            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                sessionToken: sessionToken
            });
            
            console.log(`✅ User logged in: ${username}`);
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

// Check Phi3 status
app.get('/api/phi3/status', async (req, res) => {
    try {
        const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const response = await axios.get(`${ollamaUrl}/api/tags`);
        const models = response.data.models || [];
        const phi3Available = models.some(model => model.name.includes('phi3'));
        
        res.json({
            status: 'healthy',
            phi3Available: phi3Available,
            models: models.map(m => m.name),
            ollamaUrl: ollamaUrl,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            status: 'error',
            phi3Available: false,
            error: error.message,
            ollamaUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            timestamp: new Date().toISOString()
        });
    }
});

// Enhanced search endpoint with comprehensive debugging
app.post('/api/search', async (req, res) => {
    const { query, userId, sessionId } = req.body;
    
    console.log(`🔍 Search request: "${query}" from user: ${userId}`);
    
    try {
        if (!query || query.trim().length === 0) {
            console.log('❌ Empty query received');
            return res.status(400).json({ error: 'Query cannot be empty' });
        }
        
        const sanitizedQuery = sanitizeInput(query.trim());
        let answer = '';
        let source = 'unknown';
        let confidence = 0;
        let model = process.env.PHI3_MODEL || 'phi3:mini';
        
        console.log(`📝 Processing sanitized query: "${sanitizedQuery}"`);
        
        const currentSessionId = sessionId || (userId ? getUserChatData(userId).currentSessionId : null);
        const context = currentSessionId ? getSessionContext(currentSessionId) : [];
        
        if (userId) {
            await addMessageToSession(userId, sanitizedQuery, 'user');
        }
        
        // Try Phi3 first
        console.log('🤖 Attempting Phi3 connection...');
        try {
            const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
            console.log(`🔗 Using Ollama URL: ${ollamaUrl}`);
            
            const contextPrompt = context.length > 0 
                ? `Previous conversation context:\n${context.map(c => `${c.role}: ${c.content}`).join('\n')}\n\nCurrent question: ${sanitizedQuery}`
                : sanitizedQuery;
                
            console.log(`📤 Sending to Phi3 model: ${model}`);
            
            const phi3Response = await axios.post(`${ollamaUrl}/api/generate`, {
                model: model,
                prompt: contextPrompt,
                stream: false
            }, { 
                timeout: 10000,
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (phi3Response.data && phi3Response.data.response) {
                answer = phi3Response.data.response.trim();
                source = 'phi3_model_with_context';
                confidence = 85;
                console.log('✅ Phi3 responded successfully');
            } else {
                console.log('⚠️ Phi3 returned empty response');
                throw new Error('Empty response from Phi3');
            }
        } catch (phi3Error) {
            console.log('❌ Phi3 failed:', phi3Error.message);
            console.log('📚 Falling back to knowledge base...');
            
            // Try knowledge base
            try {
                const knowledgeAnswer = knowledgeBase.searchKnowledge(sanitizedQuery);
                console.log('📖 Knowledge base result:', knowledgeAnswer ? 'Answer found' : 'No answer found');
                
                if (knowledgeAnswer) {
                    answer = knowledgeAnswer;
                    source = 'knowledge_base';
                    confidence = 70;
                    console.log('✅ Knowledge base provided answer');
                } else {
                    console.log('🔍 Trying Google Search fallback...');
                    // Try Google Search as fallback
                    if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
                        try {
                            const googleResponse = await axios.get('https://www.googleapis.com/customsearch/v1', {
                                params: {
                                    key: process.env.GOOGLE_API_KEY,
                                    cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
                                    q: sanitizedQuery,
                                    num: 3
                                },
                                timeout: 5000
                            });
                            
                            if (googleResponse.data.items && googleResponse.data.items.length > 0) {
                                const topResult = googleResponse.data.items[0];
                                answer = `Based on search results: ${topResult.snippet}\n\nSource: ${topResult.link}`;
                                source = 'google_search';
                                confidence = 60;
                                console.log('✅ Google search successful');
                            } else {
                                throw new Error('No Google search results');
                            }
                        } catch (googleError) {
                            console.log('❌ Google search failed:', googleError.message);
                            throw googleError;
                        }
                    } else {
                        console.log('⚠️ Google Search not configured (missing API keys)');
                        throw new Error('Google Search not available');
                    }
                }
            } catch (knowledgeError) {
                console.error('❌ Knowledge base error:', knowledgeError.message);
                
                // Final fallback
                answer = "I'm sorry, I couldn't find a specific answer to your question. Could you please rephrase or provide more details?";
                source = 'fallback';
                confidence = 30;
                console.log('📝 Using final fallback response');
            }
        }
        
        if (userId) {
            await addMessageToSession(userId, answer, 'ai', { source, confidence, model });
        }
        
        console.log(`✅ Sending response from ${source} with confidence ${confidence}%`);
        console.log(`📤 Response preview: ${answer.substring(0, 100)}...`);
        
        res.json({
            answer,
            source,
            confidence,
            model,
            contextUsed: context.length > 0,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('💥 Critical search endpoint error:', error);
        console.error('Stack trace:', error.stack);
        
        res.status(500).json({
            error: 'Internal server error',
            details: error.message,
            fallback: "I'm experiencing technical difficulties. Please try again later."
        });
    }
});

// Voice activity endpoint
app.post('/api/voice/activity', (req, res) => {
    const { isActive, userId } = req.body;
    console.log(`🎤 Voice activity for ${userId}: ${isActive ? 'started' : 'stopped'}`);
    res.json({ success: true, timestamp: new Date().toISOString() });
});

// Chat session management endpoints
app.get('/api/chat/sessions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userData = getUserChatData(userId);
        
        const sessions = Array.from(userData.sessions.values()).map(session => ({
            id: session.id,
            title: session.title,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            messageCount: session.messages.length,
            lastMessage: session.messages.length > 0 ? session.messages[session.messages.length - 1].message.substring(0, 100) : ''
        })).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        res.json({
            sessions,
            currentSessionId: userData.currentSessionId
        });
    } catch (error) {
        console.error('❌ Error loading chat sessions:', error);
        res.status(500).json({ error: 'Failed to load chat sessions' });
    }
});

app.get('/api/chat/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        
        let foundSession = null;
        for (const userData of chatSessions.values()) {
            if (userData.sessions.has(sessionId)) {
                foundSession = userData.sessions.get(sessionId);
                break;
            }
        }
        
        if (foundSession) {
            res.json(foundSession);
        } else {
            res.status(404).json({ error: 'Session not found' });
        }
    } catch (error) {
        console.error('❌ Error loading session:', error);
        res.status(500).json({ error: 'Failed to load session' });
    }
});

app.post('/api/chat/new-session', (req, res) => {
    try {
        const { userId, title } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const sessionId = createNewChatSession(userId, title);
        const userData = getUserChatData(userId);
        const session = userData.sessions.get(sessionId);
        
        res.json({
            sessionId,
            session: {
                id: session.id,
                title: session.title,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                messageCount: 0
            }
        });
    } catch (error) {
        console.error('❌ Error creating new session:', error);
        res.status(500).json({ error: 'Failed to create new session' });
    }
});

app.post('/api/chat/switch-session', (req, res) => {
    try {
        const { userId, sessionId } = req.body;
        
        if (!userId || !sessionId) {
            return res.status(400).json({ error: 'User ID and Session ID are required' });
        }
        
        const userData = getUserChatData(userId);
        
        if (userData.sessions.has(sessionId)) {
            userData.currentSessionId = sessionId;
            res.json({ success: true, currentSessionId: sessionId });
        } else {
            res.status(404).json({ error: 'Session not found' });
        }
    } catch (error) {
        console.error('❌ Error switching session:', error);
        res.status(500).json({ error: 'Failed to switch session' });
    }
});

app.delete('/api/chat/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const userData = getUserChatData(userId);
        
        if (userData.sessions.has(sessionId)) {
            userData.sessions.delete(sessionId);
            sessionContexts.delete(sessionId);
            
            if (userData.currentSessionId === sessionId) {
                createNewChatSession(userId);
            }
            
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Session not found' });
        }
    } catch (error) {
        console.error('❌ Error deleting session:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

// Admin endpoints
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await loadUsers();
        const usersWithStats = [];
        
        for (const user of users) {
            if (user.role !== 'admin') {
                const userLogs = await loadUserLogs(user.username);
                usersWithStats.push({
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    registeredAt: user.registeredAt,
                    statistics: userLogs ? userLogs.statistics : {
                        totalQuestions: 0,
                        totalSessions: 0,
                        lastActivity: 'Never'
                    }
                });
            }
        }
        
        res.json({ users: usersWithStats });
    } catch (error) {
        console.error('❌ Error loading users for admin:', error);
        res.status(500).json({ error: 'Failed to load users' });
    }
});

app.get('/api/admin/knowledge-gaps', (req, res) => {
    res.json({
        knowledgeGaps: [
            { question: "How to deploy to production?", count: 5, lastAsked: new Date().toISOString() },
            { question: "What is machine learning?", count: 3, lastAsked: new Date().toISOString() }
        ]
    });
});

app.get('/api/admin/popular-questions', (req, res) => {
    res.json({
        popularQuestions: [
            { question: "What does Premade Innovation do?", count: 15 },
            { question: "How can I join the team?", count: 12 },
            { question: "What services do you offer?", count: 10 }
        ]
    });
});

app.get('/api/admin/user-insights/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const userLogs = await loadUserLogs(username);
        
        if (userLogs) {
            res.json({
                userInsights: {
                    totalQuestions: userLogs.statistics.totalQuestions,
                    uniqueQuestions: userLogs.conversations.length,
                    mostAskedQuestions: [
                        { question: "Sample question", count: 1 }
                    ],
                    firstInteraction: userLogs.createdAt,
                    lastInteraction: userLogs.statistics.lastActivity
                }
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('❌ Error loading user insights:', error);
        res.status(500).json({ error: 'Failed to load user insights' });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Learning AI Assistant Server running on port ${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}`);
    console.log(`🤖 Phi3 Model: ${process.env.PHI3_MODEL || 'phi3:mini'}`);
    console.log(`🔍 Google Search: ${process.env.GOOGLE_API_KEY ? 'Enabled' : 'Disabled'}`);
    console.log(`📁 User Logs Directory: ${userLogsDir}`);
    
    // Initialize users on startup
    await loadUsers();
    console.log(`✅ Enhanced server initialized successfully with comprehensive debugging`);
});
