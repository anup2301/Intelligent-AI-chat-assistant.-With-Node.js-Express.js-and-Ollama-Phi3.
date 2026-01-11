# Learning Voice AI Assistant with Phi3

A sophisticated AI assistant powered by Microsoft's Phi3 model with learning capabilities, voice interaction, and comprehensive admin features.

## 🚀 Features

- **Phi3 Integration**: Powered by Microsoft's Phi3 model via Ollama
- **Learning Capabilities**: AI learns from conversations and improves over time
- **Voice Interaction**: Speech-to-text and text-to-speech functionality
- **Knowledge Base**: Built-in company knowledge with intelligent fallbacks
- **Admin Dashboard**: Comprehensive analytics and user insights
- **User Management**: Registration, login, and user-specific conversation logs
- **Real-time Status**: Live monitoring of Phi3 model availability

## 🛠️ Setup Instructions

### Prerequisites

1. **Node.js** (v14 or higher)
2. **Ollama** - Download from [https://ollama.ai](https://ollama.ai)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install and Setup Ollama**
   ```bash
   # Install Ollama (follow instructions from ollama.ai)
   
   # Pull the Phi3 model
   ollama pull phi3:mini
   
   # Start Phi3 (keep this running)
   ollama run phi3:mini
   ```

3. **Start the Application**
   ```bash
   npm start
   ```

4. **Access the Application**
   - Open your browser to `http://localhost:3000`
   - Default admin login: `admin` / `admin`

## 🤖 Phi3 Model

This application uses Microsoft's Phi3-mini model, which provides:
- High-quality responses for general questions
- Efficient performance on local hardware
- Integration with company-specific knowledge base
- Learning from user interactions

### Model Configuration

The Phi3 configuration can be customized in `.env`:

```env
OLLAMA_BASE_URL=http://localhost:11434
PHI3_MODEL=phi3:mini
PORT=3000
```

## 📊 Features Overview

### For Users
- **Natural Conversations**: Chat with the AI using text or voice
- **Company Knowledge**: Get information about Premade Innovation
- **Learning AI**: The system learns from your questions and improves
- **Voice Commands**: Use speech-to-text for hands-free interaction

### For Administrators
- **System Overview**: Monitor user activity and system health
- **Phi3 Status**: Real-time monitoring of the AI model
- **Knowledge Gaps**: See what questions users ask that need better answers
- **Popular Questions**: Track most frequently asked questions
- **User Insights**: Detailed analytics for each user
- **Conversation Logs**: Complete history of all interactions

## 🔧 Technical Architecture

### Backend Components
- **Express.js Server**: RESTful API endpoints
- **Phi3Service**: Integration with Ollama and Phi3 model
- **KnowledgeBase**: Learning system with persistent storage
- **Admin APIs**: Analytics and monitoring endpoints

### Frontend Components
- **Responsive UI**: Modern, mobile-friendly interface
- **Real-time Status**: Live connection monitoring
- **Voice Integration**: Web Speech API for voice commands
- **Admin Dashboard**: Comprehensive management interface

### Data Flow
1. User asks a question
2. System checks knowledge base for existing answers
3. If high-confidence answer exists, return it
4. Otherwise, query Phi3 model with context
5. Learn from the interaction for future improvements
6. Log conversation for analytics

## 🚨 Troubleshooting

### Common Issues

**Phi3 Not Available**
- Ensure Ollama is installed and running
- Run: `ollama pull phi3:mini`
- Start: `ollama run phi3:mini`
- Check the status in the admin dashboard

**Server Connection Failed**
- Make sure the Node.js server is running: `npm start`
- Check if port 3000 is available
- Verify no firewall is blocking the connection

**Voice Recognition Not Working**
- Use a modern browser (Chrome, Firefox, Safari)
- Allow microphone permissions
- Ensure you're on HTTPS or localhost

## 📈 Performance

- **Response Time**: Typically 1-3 seconds for Phi3 responses
- **Memory Usage**: ~2-4GB RAM for Phi3-mini model
- **Concurrent Users**: Supports multiple simultaneous conversations
- **Learning**: Improves accuracy over time through user interactions

## 🔒 Security

- User authentication and session management
- Input sanitization and validation
- Secure API endpoints
- Local model execution (no data sent to external services)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the admin dashboard for system status
- Review the troubleshooting section
- Ensure Ollama and Phi3 are properly installed
- Contact the development team

---

**Powered by Microsoft Phi3 🤖 | Built with ❤️ for Premade Innovation**