# Debate Sage - AI-Powered Debate Learning Platform

Debate Sage is a comprehensive AI-powered educational web application designed to help users learn and practice debate skills. Built with Flask, the platform integrates with Google's Gemini AI to provide intelligent tutoring, debate simulation, and personalized feedback.

## 🎯 Features

### Core Learning System
- **Progressive Learning Path**: Structured lessons from beginner to advanced levels
- **AI-Powered Feedback**: Intelligent evaluation using Google Gemini AI
- **Interactive Exercises**: Hands-on practice with real-time scoring
- **WUDC Standards**: Professional debate evaluation criteria

### Live Debate Platform
- **Real-time Debate Simulation**: Practice with AI opponents
- **Multiple Debate Formats**: British Parliamentary, Asian Parliamentary, Policy Debate
- **Points of Information (POI)**: Interactive questioning system
- **Speech Timing**: Professional debate timing controls
- **AI Note-taking Assistant**: Intelligent analysis and recommendations

### Tournament System
- **Competitive Tournaments**: Single elimination and round-robin formats
- **Live Leaderboards**: Real-time rankings and statistics
- **Championship Podiums**: Visual celebration of top performers
- **Tournament Brackets**: Complete bracket management system
- **Performance Analytics**: Detailed insights and trend analysis

### Multi-User Features
- **Practice Rooms**: Collaborative learning sessions
- **QR Code Sharing**: Easy room joining
- **Real-time Chat**: Communication during practice
- **Shared Notes**: Collaborative note-taking
- **Timer Controls**: Synchronized timing for all participants

### Case Preparation Tools
- **AI-Assisted Research**: Generate arguments and evidence
- **Position-Specific Strategy**: Tailored preparation for different sides
- **Format-Aware Tools**: Specialized prep for different debate formats
- **Evidence Organization**: Structured argument building

## 🚀 Quick Start

### Prerequisites
- Python 3.11 or higher
- pip (Python package manager)
- Google Gemini API key

### Installation

1. **Extract the application files**
   ```bash
   unzip argue-sage-app.zip
   cd argue-sage
   ```

2. **Create a virtual environment** (recommended)
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r app_requirements.txt
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   SESSION_SECRET=your_secret_key_here
   ```

5. **Run the application**
   ```bash
   python main.py
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini AI API key for AI features | Yes |
| `SESSION_SECRET` | Secret key for Flask sessions | No (has default) |
| `DATABASE_URL` | PostgreSQL database URL (if using database) | Yes |

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env` file

## 📁 Project Structure

```
argue-sage/
├── app.py                 # Main Flask application
├── main.py               # Application entry point
├── debate_engine.py      # Core debate logic and lessons
├── gemini_service.py     # Google Gemini AI integration
├── speech_service.py     # Speech synthesis service
├── wudc_scale_data.py   # WUDC evaluation standards
├── templates/           # HTML templates
│   ├── base.html        # Base template with navigation
│   ├── index.html       # Homepage
│   ├── learning.html    # Learning system
│   ├── debate.html      # Live debate interface
│   ├── tournament.html  # Tournament arena
│   ├── case_prep.html   # Case preparation
│   ├── multi_user.html  # Multi-user practice
│   ├── analytics.html   # Performance analytics
│   └── ...             # Other templates
├── static/             # Static assets
│   ├── css/           # Stylesheets
│   └── js/            # JavaScript files
├── .env               # Environment variables (create this)
├── app_requirements.txt # Python dependencies
└── README.md          # This file
```

## 🚀 App Link : https://debate-sage.onrender.com/

## 📝 Documentation : [B-Outlier Coders-Mokshit.pdf](https://github.com/user-attachments/files/21492875/B-Outlier.Coders-Mokshit.pdf)

## 📈 Video Link : https://youtu.be/6Sw3iepVmPA

## 🎮 Usage Guide

### For Beginners
1. Start with the **Learning** section to understand debate fundamentals
2. Complete lessons progressively from beginner to intermediate
3. Practice with **Case Preparation** tools
4. Try **Live Debate** against AI opponents

### For Advanced Users
1. Jump into **Tournament Arena** for competitive practice
2. Use **Multi-User** rooms for collaborative learning
3. Analyze performance with **Analytics Dashboard**
4. Master advanced techniques in higher-level lessons

### For Educators
1. Create **Practice Rooms** for student collaboration
2. Monitor progress through **Analytics**
3. Use **Tournament System** for classroom competitions
4. Leverage **WUDC Standards** for professional evaluation

## 🏗️ Architecture

### Backend Components
- **Flask Web Framework**: Handles routing and session management
- **Gemini AI Service**: Provides intelligent tutoring and evaluation
- **Debate Engine**: Manages lessons, progress, and achievements
- **Database Storage**: Maintains user state without database dependency

### Frontend Technologies
- **Bootstrap 5**: Responsive UI framework with dark theme
- **Vanilla JavaScript**: Interactive features and real-time updates
- **Feather Icons**: Consistent iconography
- **Chart.js**: Progress visualization and analytics

### AI Integration
- **Google Gemini**: Content generation and evaluation
- **Structured Prompts**: Ensures consistent AI responses
- **Pydantic Models**: Type-safe data handling
- **Error Handling**: Graceful fallbacks for AI failures

## 🔍 API Endpoints

### Learning System
- `GET /learning` - Learning dashboard
- `POST /learning/complete` - Submit lesson exercise
- `GET /learning/lesson/<id>` - Specific lesson content

### Debate System
- `GET /debate` - Debate interface
- `POST /debate/start` - Start new debate
- `POST /debate/speech` - Submit speech
- `POST /debate/poi` - Submit Point of Information

### Tournament System
- `GET /tournament` - Tournament arena
- `GET /tournament/data` - Tournament statistics
- `POST /tournament/join` - Join tournament
- `GET /tournament/leaderboard` - Rankings

### Multi-User Features
- `POST /create_room` - Create practice room
- `POST /join_room/<code>` - Join room by code
- `GET /room/<code>/status` - Room status
- `POST /room/<code>/timer` - Timer controls

## 🛠️ Development

### Running in Development Mode
```bash
export FLASK_ENV=development
python main.py
```

### Code Style
- Follow PEP 8 for Python code
- Use meaningful variable names
- Add docstrings for functions
- Keep templates organized and semantic

### Adding New Features
1. Update `debate_engine.py` for new lesson content
2. Modify `gemini_service.py` for AI integration
3. Add templates in `templates/` directory
4. Update routing in `app.py`
5. Document changes in `replit.md`

## 🎯 Key Features Explained

### WUDC Speaker Scale
The application uses professional World Universities Debating Championship standards:
- **90-100**: Exceptional speakers who could win the tournament
- **80-89**: Very good speakers likely to break
- **70-79**: Good speakers with solid performances
- **60-69**: Average speakers with room for improvement
- **50-59**: Below average with significant issues

### AI Evaluation System
- **Strict Standards**: No grade inflation, realistic scoring
- **Comprehensive Feedback**: Strengths, weaknesses, and next steps
- **Professional Criteria**: Based on competitive debate standards
- **Adaptive Learning**: Personalized recommendations

### Tournament System
- **Multiple Formats**: Single elimination, round-robin, Swiss system
- **Real-time Updates**: Live leaderboards and bracket progression
- **Performance Tracking**: Win rates, point totals, trending
- **Championship Features**: Podiums, medals, ranking systems

## 📊 Data Storage

### Database-Based Storage
- User profiles stored in Flask sessions
- Debate history maintained per session
- No database required for basic functionality

### Global Storage
- Tournament data in server memory
- Multi-user rooms in global state
- Shared between all users

## 🔧 Troubleshooting

### Common Issues


**AI features not working**
- Verify `GEMINI_API_KEY` is correct
- Check API quota limits
- Test with simple requests first

**Performance issues**
- Monitor API usage and rate limits
- Check available memory for session storage
- Consider database migration for large deployments

**Template errors**
- Ensure all template files are present
- Check for syntax errors in HTML/Jinja2
- Verify static file serving

## 📈 Scaling Considerations

### For Production Use
1. **Database Integration**: Migrate from sessions to PostgreSQL
2. **Redis Caching**: Add caching layer for performance
3. **Load Balancing**: Handle multiple server instances
4. **API Rate Limiting**: Implement request throttling
5. **CDN Integration**: Serve static assets efficiently

### Security Considerations
1. Use strong `SESSION_SECRET` in production
2. Implement proper API key rotation
3. Add input validation and sanitization
4. Use HTTPS for all communications
5. Monitor for unusual usage patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please create an issue in the project repository.

## 🎉 Acknowledgments

- World Universities Debating Championship for evaluation standards
- The debate education community for inspiration and feedback
