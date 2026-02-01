# Decision Buddy - Local Setup 🎯

Decision Buddy is a web application that helps you analyze tough decisions by providing pros, cons, opportunity costs, and time estimates.

## Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Navigate to the project directory
cd /Users/anvi/Desktop/ICHACK26/ICHACK2026/decision-buddy

# Run the automated setup script
./start_local.sh
```

### Option 2: Manual Setup

#### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

#### Setup Steps

1. **Navigate to the project directory:**
   ```bash
   cd /Users/anvi/Desktop/ICHACK26/ICHACK2026/decision-buddy
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Start the backend server:**
   ```bash
   python app.py
   ```
   The backend will run on http://localhost:5003

5. **In a new terminal, start the frontend server:**
   ```bash
   cd ../frontend
   python3 -m http.server 8000
   ```
   The frontend will run on http://localhost:8000

6. **Open your web browser and go to:**
   ```
   http://localhost:8000
   ```

### 🧠 Multi-Stage Analysis
- **Stage 1**: Enter your decision scenario
- **Stage 2**: Answer contextual questions about priorities, stress levels, and decision type
- **Stage 3**: Complete decision-specific questions for personalized analysis

### 📊 Comprehensive Analysis
- **Pros & Cons**: Detailed advantages and considerations
- **Opportunity Cost**: What you might give up by choosing this path
- **Time Analysis**: Time investment and commitment insights
- **Contextual Insights**: Analysis tailored to your specific situation (career, study, money, health, relationships, time management)

### 🎯 Smart Features
- **Dynamic Questions**: Questions adapt based on your decision type (career, study, money, health, relationships, time)
- **Priority-Based Analysis**: Analysis considers your stated priorities (happiness, money, growth, etc.)
- **Stress-Level Awareness**: Recommendations adjusted for your current stress level
- **Real-time Feedback**: Character count, input validation, and helpful tips

### 💬 User Experience
- **Interactive UI**: Modern, responsive design with smooth animations
- **Feedback System**: 5-star rating with optional comments
- **Export Functionality**: Download your analysis as JSON
- **Accessibility**: Keyboard navigation and screen reader support

## 🚀 Quick Start

### Prerequisites
- Python 3.9 or higher
- Node.js (for development server, optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/decision-buddy.git
   cd decision-buddy
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Start the Backend Server**
   ```bash
   python app.py
   ```
   The API will be available at `http://localhost:5003`

4. **Start the Frontend Server**
   ```bash
   cd ../frontend
   python -m http.server 8001
   ```
   The app will be available at `http://localhost:8001`

## 🏗️ Project Structure

```
decision-buddy/
├── backend/
│   ├── app.py                 # Flask API server
│   ├── requirements.txt       # Python dependencies
│   ├── feedback_data.json     # User feedback storage
│   └── venv/                  # Python virtual environment
├── frontend/
│   ├── index.html            # Main HTML file
│   ├── script.js             # JavaScript application logic
│   ├── styles.css            # CSS styles
│   └── styles_backup.css     # Backup styles
└── README.md                 # This file
```

## 🔧 API Endpoints

### Analysis Endpoint
```http
POST /analyze
Content-Type: application/json

{
  "decision": "Should I switch careers to data science?",
  "user_context": {
    "decisionType": "career",
    "priorities": ["happiness", "money"],
    "timeCommitment": "high",
    "stressLevel": "medium",
    "specificAnswers": {...}
  }
}
```

### Feedback Endpoint
```http
POST /feedback
Content-Type: application/json

{
  "analysis_id": "unique-analysis-id",
  "decision": "Decision text",
  "analysis": {
    "pros": ["Advantage 1", "Advantage 2"],
    "cons": ["Consideration 1"],
    "opportunity_cost": "What you give up",
    "time": "Time analysis"
  },
  "rating": 4,
  "feedback_text": "Optional feedback"
}
```

### Health Check
```http
GET /health
```

## 💻 Development

### Frontend Development
The frontend is a vanilla JavaScript application with no build process required. Key files:

- **`script.js`**: Main application logic, API calls, UI interactions
- **`index.html`**: HTML structure with multi-stage form
- **`styles.css`**: Modern CSS with animations and responsive design

### Backend Development
The backend is a Flask application with the following key components:

- **Analysis Engine**: Generates pros/cons and insights based on decision context
- **Feedback System**: Collects and stores user ratings and feedback
- **Context-Aware Logic**: Different analysis strategies for different decision types

### Testing Functions
The app includes built-in testing functions accessible via browser console:

```javascript
// Test the complete analyze flow
testAnalyzeFlow()

// Debug analyze button issues
debugAnalyzeButton()

// Test feedback submission
testFeedbackSubmission()

// Quick form auto-fill for testing
quickFillForm()
```

## 🎨 Decision Types & Analysis

The app provides specialized analysis for different decision categories:

### 📈 Career Decisions
- Salary vs. fulfillment considerations
- Long-term career alignment
- Professional growth opportunities

### 📚 Study/Education
- Time commitment during term vs. breaks
- Workload impact assessment
- Learning vs. immediate goals

### 💰 Financial Decisions
- One-time vs. recurring costs
- Essential expenses impact
- Budget allocation strategies

### 🏥 Health Decisions
- Long-term health improvements
- Risk assessment
- Wellness vs. other priorities

### 👥 Relationship Decisions
- Impact on others consideration
- Boundary setting guidance
- Social vs. personal needs

### ⏰ Time Management
- Deadline pressure assessment
- Opportunity cost analysis
- Priority balancing strategies

## API Response Format

The backend returns structured JSON with the following format:

```json
{
  "success": true,
  "analysis": {
    "pros": [
      "Gain new knowledge and skills",
      "Improve future career prospects",
      "Personal development and growth"
    ],
    "cons": [
      "Significant financial investment required",
      "Time commitment required",
      "Uncertain outcome"
    ],
    "opportunity_cost": "Choosing to pursue education means sacrificing valuable time that could be spent working and earning immediate income...",
    "time": "Several months to years"
  }
}
```

## Setup Instructions

### Quick Start

1. **Make the setup script executable and run it:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

### Manual Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Start the backend server:**
   ```bash
   python app.py
   ```
   The server will run on `http://localhost:5001`

3. **Open the frontend:**
   Open `frontend/index.html` in your web browser

## Usage Examples

### Career Decisions
"Should I quit my job to start my own business?"

### Education Choices
"Should I go back to school for a master's degree?"

### Investment Decisions
"Should I invest in real estate or the stock market?"

### Life Changes
"Should I move to a new city for better opportunities?"

## API Endpoints

- **POST /analyze**: Analyze a decision
  - Body: `{"decision": "your decision text"}`
  - Response: Structured analysis with pros, cons, opportunity cost, and time

- **GET /health**: Health check endpoint
  - Response: `{"status": "healthy", "message": "Decision Buddy API is running"}`

## Development

### Backend Development
The backend uses a custom `DecisionAnalyzer` class that:
- Identifies keywords to categorize decisions
- Generates contextual pros and cons
- Estimates opportunity costs with detailed explanations
## 🔒 Privacy & Data

- **No Personal Data Storage**: Only anonymized feedback and analysis metadata
- **Local Processing**: Decision text processed server-side but not permanently stored
- **Feedback Only**: Only ratings and optional feedback comments are saved
- **Export Feature**: Users can download their analysis data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add comments for complex logic
- Test thoroughly with the built-in testing functions
- Ensure responsive design for new UI elements

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**
- Check Python version: `python --version`
- Ensure virtual environment is activated
- Install dependencies: `pip install -r requirements.txt`

**Frontend can't connect to backend**
- Verify backend is running on port 5003
- Check console for CORS errors
- Ensure API_BASE_URL in script.js matches backend port

**Analyze button not working**
- Open browser console and run `debugAnalyzeButton()`
- Check if all multi-stage questions are answered
- Verify decision text is at least 10 characters

**Feedback submission fails**
- Run `testFeedbackSubmission()` in console for detailed debugging
- Check network tab for request/response details
- Verify backend is accepting requests

## 📱 Browser Compatibility

- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Built for enhanced decision-making and personal growth
- Inspired by decision science and behavioral psychology principles
- Designed with accessibility and user experience in mind
- Created for ICHACK2026 🚀

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Use the built-in debugging functions in the browser console
3. Open an issue on GitHub with detailed error information
4. Include browser console logs and network requests if applicable

---

**Happy Decision Making! 🎯**
>>>>>>> 5c4ae1d (Initial commit for Decision Buddy)
