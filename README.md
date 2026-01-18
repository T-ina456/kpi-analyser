# AI-Powered KPI Analyser 🚀

An intelligent KPI Analyser web application that automatically analyzes datasets and recommends relevant KPIs based on data patterns and business context.

## ✨ Features
- CSV/Excel dataset upload
- Automatic data profiling
- KPI creation & calculation
- AI-powered KPI recommendations (no paid APIs)
- Dashboard-based KPI suggestions
- One-click KPI application

## 🛠 Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- NLP: Natural
- Charts & KPIs: Custom logic

## 📂 Project Structure

backend/
├── src/
│   ├── controllers/
│   │   ├── uploadController.js
│   │   ├── kpiController.js
│   │   └── recommendationController.js
│   │
│   ├── routes/
│   │   ├── uploadRoutes.js
│   │   ├── kpiRoutes.js
│   │   ├── dataRoutes.js
│   │   └── recommendationRoutes.js
│   │
│   ├── utils/
│   │   ├── csvParser.js
│   │   ├── excelParser.js
│   │   ├── kpiCalculator.js
│   │   └── dataAnalyzer.js
│   │
│   ├── middleware/
│   │   └── errorHandler.js
│   │
│   └── server.js
│
├── uploads/        (ignored – user data)
├── .env            (ignored – secrets)
├── package.json
└── package-lock.json


frontend/
├── src/
│   ├── components/
│   │   └── KPIRecommendations.jsx
│   │
│   ├── services/
│   │   └── kpiService.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── public/
├── package.json
└── package-lock.json
