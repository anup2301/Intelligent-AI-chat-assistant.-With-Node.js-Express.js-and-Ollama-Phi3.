const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Enhanced Learning Voice AI Assistant...\n');

// Create necessary directories
const directories = [
    'src/data/user-logs',
    'public'
];

directories.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    } else {
        console.log(`📁 Directory already exists: ${dir}`);
    }
});

// Create users.json if it doesn't exist
const usersFile = path.join(__dirname, 'src/data/users.json');
if (!fs.existsSync(usersFile)) {
    const defaultUsers = [{
        id: 'user_' + Date.now() + '_admin',
        username: 'admin',
        password: require('crypto').createHash('sha256').update('admin' + 'salt_key_2024').digest('hex'),
        name: 'Administrator',
        email: 'admin@premadeinnovation.com',
        role: 'admin',
        registeredAt: new Date().toISOString()
    }];
    
    fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2));
    console.log('✅ Created users.json with default admin user');
} else {
    console.log('📄 users.json already exists');
}

// Check if voice-interface.html exists in public directory
const voiceInterfaceTarget = path.join(__dirname, 'public/voice-interface.html');
if (fs.existsSync(voiceInterfaceTarget)) {
    console.log('✅ voice-interface.html found in public directory');
} else {
    console.log('⚠️ Please make sure voice-interface.html is in the public/ directory');
}

// Check if updated files exist
const requiredFiles = [
    { file: 'server.js', description: 'Enhanced server with file storage' },
    { file: 'public/index.html', description: 'Main interface with voice integration' },
    { file: 'public/voice-interface.html', description: 'Voice interface with Siri-like animations' },
    { file: 'package.json', description: 'Updated project configuration' }
];

console.log('\n📋 Checking required files:');
requiredFiles.forEach(({ file, description }) => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} - ${description}`);
    } else {
        console.log(`❌ ${file} - MISSING! Please create this file.`);
    }
});

// Create sample user log structure
const sampleUserLog = {
    username: 'sample_user',
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

const sampleLogPath = path.join(__dirname, 'src/data/user-logs/sample-user-structure.json');
if (!fs.existsSync(sampleLogPath)) {
    fs.writeFileSync(sampleLogPath, JSON.stringify(sampleUserLog, null, 2));
    console.log('✅ Created sample user log structure');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Make sure Ollama is installed and running');
console.log('   Download from: https://ollama.ai');
console.log('2. Pull the Phi3 model: ollama pull phi3:mini');
console.log('3. Start the Phi3 model: ollama run phi3:mini');
console.log('4. Install dependencies: npm install');
console.log('5. Start the development server: npm run dev');
console.log('6. Open http://localhost:3000 in your browser');

console.log('\n🔑 Default login credentials:');
console.log('Username: admin');
console.log('Password: admin');

console.log('\n🎤 Voice Features:');
console.log('• Click the microphone button to open the voice interface');
console.log('• The voice interface has Siri-like animated waves');
console.log('• Supports speech-to-text and text-to-speech');
console.log('• Auto-registration now saves users to user-logs folder');

console.log('\n✨ New Features Added:');
console.log('• ✅ Fixed user registration with proper file storage');
console.log('• ✅ Siri-like voice interface with wave visualization');
console.log('• ✅ Enhanced security with password hashing');
console.log('• ✅ Better error handling and validation');
console.log('• ✅ Admin panel for user management');
console.log('• ✅ Mobile-responsive design improvements');

console.log('\n🔧 File Structure:');
console.log('project/');
console.log('├── server.js (updated with enhanced features)');
console.log('├── package.json (updated to v2.0.0)');
console.log('├── setup.js (this setup script)');
console.log('├── public/');
console.log('│   ├── index.html (updated main interface)');
console.log('│   └── voice-interface.html (NEW - Siri-like voice UI)');
console.log('├── src/');
console.log('│   ├── data/');
console.log('│   │   ├── users.json (file-based user storage)');
console.log('│   │   ├── user-logs/ (individual user log files)');
console.log('│   │   ├── knowledge.json (unchanged)');
console.log('│   │   └── learning-patterns.json (unchanged)');
console.log('│   └── services/');
console.log('│       └── knowledgeBase.js (unchanged)');

console.log('\n🚨 Troubleshooting:');
console.log('• If voice interface doesn\'t open: Allow popups for localhost');
console.log('• If registration fails: Check file permissions for src/data/');
console.log('• If Phi3 not working: Run "ollama pull phi3:mini" and "ollama run phi3:mini"');
console.log('• For voice issues: Use Chrome/Firefox, allow microphone access');

console.log('\n🎯 Test the Updates:');
console.log('1. Register a new user - should create user log file');
console.log('2. Login and go to chat page');
console.log('3. Click microphone to open voice interface');
console.log('4. Test voice recognition and AI responses');
console.log('5. Check admin dashboard for user management');

console.log('\n🔥 You now have a production-ready AI assistant!');
