🌟 LifeSync AI

LifeSync AI is a personal productivity and expense management application that brings everyday activities together in one place. It helps users manage tasks, track expenses, set reminders, and interact with an AI assistant through text or voice commands.

The application has a React-based frontend and a Flask backend. It also supports multiple AI providers and can work with local JSON storage when MongoDB is unavailable.

✨ Features

📝 1. Task Management

- Create, update, and delete tasks.
- Set task priorities and due dates.
- Mark tasks as completed.
- Filter tasks by status and priority.
- Search for specific tasks.

💰 2. Expense Management

- Add and manage daily expenses.
- Organize expenses into categories such as Food, Travel, Shopping, and Utilities.
- Set a monthly budget and track spending.
- View expense breakdowns through charts.
- Use quick options to add frequently recorded expenses.

🤖 3. AI Assistant

- Create tasks and record expenses using natural language.
- Set reminders through text or voice commands.
- Ask questions about expenses and available budget.
- Review suggested actions before confirming them.
- Supports OpenAI, Google Gemini, and a rule-based NLP fallback.

📊 4. Dashboard

- View task completion and expense summaries.
- Track daily productivity and activity streaks.
- View budget usage and expense categories.
- Access upcoming tasks and reminders.

📅 5. Reminders and Calendar

- Create and manage reminders.
- View upcoming deadlines.
- Track tasks and reminders in a single timeline.

📂 6. Document Management

- Upload and manage documents.
- View document details and file sizes.
- Use the AI Scan feature to identify invoice or receipt information.
- Add extracted expense details to the finance section.

🌙 7. Additional Features

- Dark and light themes.
- Load sample data for testing and demonstration.
- Export workspace information as a JSON file.
- MongoDB integration with automatic local JSON storage fallback.

🛠️ Technologies Used

Frontend

- React.js
- Vite
- Tailwind CSS
- JavaScript
- Recharts
- Lucide React
- Web Speech API

Backend

- Python
- Flask
- Flask-CORS
- PyMongo

AI and NLP

- OpenAI API
- Google Gemini API
- Rule-based NLP

Database and Storage

- MongoDB
- Local JSON storage

📁 Project Structure

LifeSync-AI/
│
├── backend/
│   ├── app.py
│   ├── ai_service.py
│   ├── db.py
│   ├── requirements.txt
│   └── uploads/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
│
└── README.md

🚀 Running the Project Locally

Prerequisites

- Python 3.10 or later
- Node.js and npm
- MongoDB (optional)

1. Clone the Repository

git clone <https://github.com/tejaswibhavanitangella/LifeSync-AI>
cd LifeSync-AI

2. Start the Backend

cd backend
python -m venv venv

Activate the virtual environment.

Windows:

venv\Scripts\activate

macOS / Linux:

source venv/bin/activate

Install dependencies and start the server:

pip install -r requirements.txt
python app.py

Backend URL: "http://localhost:5000"

Health check: "http://localhost:5000/api/health"

3. Start the Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Frontend URL: "http://localhost:5173"

📖 Using the Application

1. Open the application in your browser.
2. Use the dashboard to view tasks, expenses, and reminders.
3. Add tasks with priorities and deadlines.
4. Record expenses and monitor your budget.
5. Open the AI Assistant to create tasks or expenses using text or voice commands.
6. Manage reminders and uploaded documents.
7. Switch between dark and light themes.
8. Export your workspace data when needed.

💾 Storage

LifeSync AI supports MongoDB for storing application data. If MongoDB is unavailable, the backend uses local JSON storage as a fallback.

🔮 Future Improvements

- Improve AI-based task and expense recognition.
- Add recurring tasks and reminders.
- Introduce more detailed financial reports.
- Improve document data extraction.
- Add user authentication and personalized accounts.
- Support cloud-based data synchronization.

🎯 Project Goal

The goal of LifeSync AI is to make everyday task management and expense tracking easier by bringing these features together in a single application, with an AI assistant to simplify common actions.