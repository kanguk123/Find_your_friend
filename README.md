# 🪐 Planet Scope

> 🚀 AI-powered interactive 3D exoplanet discovery platform for NASA Space Apps Challenge 2025

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-blue?logo=react)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.180-orange?logo=three.js)](https://threejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-green?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)

Planet Scope is an interactive 3D web application that visualizes exoplanet candidates using machine learning predictions. Built for NASA's "A World Away 🎯 Hunting for Exoplanets with AI" challenge, it provides both an engaging exploration experience and powerful research tools for analyzing potential habitable planets.

## ✨ Features

### 🎮 Dual-Mode Experience

#### 🎯 Player Mode

- **🚀 Interactive Space Exploration**: Navigate the cosmos with an intuitive spaceship interface
- **🎮 Gamified Learning**: Collect coins by discovering exoplanets and unlock rocket upgrades
- **⚡ Warp Speed Animation**: Cinematic entry with starfield effects
- **🎵 Sound Effects & Music**: Immersive audio experience with background music and rocket sounds
- **📚 Tutorial System**: Step-by-step guidance for new explorers
- **🔍 Planet Discovery**: Click on exoplanets to reveal detailed information cards

#### 🔬 Expert Mode

- **📊 Scientific Analysis**: Detailed planet data with 122 NASA Kepler dataset features
- **🤖 AI Model Insights**: Real-time model accuracy and prediction confidence metrics
- **📁 CSV Upload & Processing**: Upload your own planet data for AI predictions
- **⚡ Batch Planet Identification**: Process multiple planet candidates simultaneously
- **🔍 Search & Filter**: Advanced search by planet name, coordinates (RA/Dec), and favorites
- **📈 Model Comparison**: Compare pre-trained vs. fine-tuned model performance

### 🌌 3D Interactive Universe

- **🎨 WebGL-Powered Rendering**: High-performance 3D visualization using Three.js
- **🌍 Solar System Simulation**: Accurate orbital mechanics with realistic planet textures
- **🪐 Exoplanet Mapping**: 8+ confirmed exoplanets visualized in 3D space (Kepler-186f, Proxima Centauri b, TRAPPIST-1e, etc.)
- **📷 Dynamic Camera Controls**: Smooth transitions, orbit controls, and keyboard navigation (WASD)
- **🌠 Skybox Background**: Immersive starfield using custom space textures
- **✨ Bloom Effects**: Post-processing effects for enhanced visual quality

### 🤖 AI-Powered Planet Detection

- **🧠 Machine Learning Classification**: Random Forest model trained on NASA Kepler exoplanet data
- **⚖️ Binary Classification**: CONFIRMED vs. FALSE POSITIVE predictions
- **📊 Confidence Scoring**: Probability scores (0.0-1.0) for each prediction
- **🔧 Feature Engineering**: 122 features including orbital period, stellar properties, and transit characteristics
- **⚡ Real-time Inference**: Fast predictions via FastAPI backend
- **📦 Batch Processing**: Handle multiple planet candidates in a single upload

### 📊 Data Management

- **📁 CSV Import/Export**: Download sample datasets and upload custom planet data
- **🔧 Data Preprocessing**: Automatic handling of missing values and outlier removal
- **📏 Feature Standardization**: Normalize input data for consistent predictions
- **💾 Prediction Results**: Download labeled CSV files with AI predictions
- **🗄️ Planet Database**: Store and retrieve planet information with metadata

## 🏗️ Architecture

```
planet-scope/
├── front/                  # Next.js Frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   │   ├── page.tsx           # Main 3D scene (Player/Expert mode)
│   │   │   └── training/page.tsx  # AI training & CSV upload
│   │   ├── components/    # React components
│   │   │   ├── Scene.tsx          # Main 3D canvas & camera rig
│   │   │   ├── SolarSystem.tsx    # Solar system visualization
│   │   │   ├── ExoplanetPoints.tsx # Exoplanet markers
│   │   │   ├── Rocket.tsx         # Player mode spaceship
│   │   │   ├── PlanetCard.tsx     # Planet detail panel
│   │   │   ├── ModeSwitch.tsx     # Player/Expert mode toggle
│   │   │   ├── GameHUD.tsx        # Player mode UI
│   │   └── ModelAccuracy.tsx  # Expert mode AI metrics
│   ├── state/         # Zustand global state management
│   ├── data/          # Planet & solar system data
│   ├── types.ts       # TypeScript type definitions
│   └── utils/         # Helper functions
├── public/
│   ├── textures/      # Planet textures & skybox
│   ├── audio/         # Sound effects & background music
│   └── data/          # JSON planet datasets
└── package.json

├── back/                   # FastAPI Backend
│   ├── app/
│   │   ├── main.py        # FastAPI application entry
│   │   ├── routers/       # API route handlers
│   │   │   ├── upload.py          # CSV upload & processing
│   │   │   ├── predict.py         # AI prediction endpoints
│   │   │   ├── planets.py         # Planet CRUD operations
│   │   └── model.py           # Model management
│   ├── ml/            # Machine learning modules
│   │   └── model_wrapper.py   # AI model interface
│   ├── models/        # Database models
│   ├── schemas/       # Pydantic schemas
│   ├── utils/         # Preprocessing & utilities
│   ├── database.py    # Database connection
│   └── config.py      # Application configuration
├── run.py             # Development server script
└── requirements.txt

└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and npm/yarn
- **Python** 3.11+
- **PostgreSQL** (optional, for production)

### Frontend Setup

```bash
cd front

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

The application will be available at `http://localhost:3000`

### Backend Setup

```bash
cd back

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python run.py
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## 📖 Usage Guide

### 🎯 Player Mode

1. **🚀 Launch**: Click "Enter" on the loading screen
2. **📚 Tutorial**: Follow the on-screen instructions to learn controls
3. **🎮 Navigate**: Use WASD or arrow keys to fly your spaceship
4. **🔍 Discover**: Click on glowing exoplanets to collect coins
5. **⬆️ Upgrade**: Collect coins to unlock faster rocket speeds
6. **🌌 Explore**: Visit different solar system planets and distant exoplanets

**Controls:**

- `W/↑` - Move forward
- `S/↓` - Move backward
- `A/←` - Strafe left
- `D/→` - Strafe right
- `Mouse Drag` - Rotate view
- `Scroll` - Zoom in/out
- `Click Planet` - View planet details
- `ESC` - Deselect planet / Release camera
- `Space` - Return to rocket view (when viewing planet)

### 🔬 Expert Mode

1. **🔄 Switch Mode**: Toggle to Expert Mode from the top menu
2. **🔍 Search**: Use the search box to find specific planets by name or coordinates
3. **📊 View Metrics**: Check AI model accuracy in the right panel
4. **📁 Upload Data**: Click "Input Data" to upload CSV files for analysis
5. **📥 Download Sample**: Get a sample CSV to understand the required format
6. **🤖 Identify Planets**: Upload your CSV to get AI predictions
7. **💾 Download Results**: Save the labeled CSV with prediction results

**CSV Format:**

- 122 features from NASA Kepler dataset
- Columns: `ra`, `dec`, `koi_period`, `koi_time0bk`, `koi_impact`, `koi_duration`, etc.
- Output adds: `ai_prediction` (CONFIRMED/FALSE POSITIVE), `ai_probability` (0.0-1.0)

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15.5 (App Router)
- **UI Library**: React 19.1
- **3D Graphics**: Three.js 0.180, React Three Fiber 9.3, React Three Drei 10.7
- **Post-Processing**: @react-three/postprocessing
- **State Management**: Zustand 4.5
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5.9

### Backend

- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL (production), SQLite (development)
- **ORM**: SQLAlchemy
- **ML Library**: scikit-learn (Random Forest)
- **Data Processing**: pandas, numpy
- **Server**: Uvicorn
- **Validation**: Pydantic

### Deployment

- **Frontend**: Vercel
- **Backend**: Cloud Run / Fly.io
- **Database**: Supabase (Postgres) / RDS
- **CDN**: Cloudflare R2 / Vercel Blob

## 🤖 AI Model Details

### Model Architecture

- **Algorithm**: Random Forest Classifier
- **Training Data**: NASA Kepler Exoplanet Archive
- **Features**: 122 planet characteristics
- **Output**: Binary classification (CONFIRMED / FALSE POSITIVE)
- **Metrics**: Accuracy, Precision, Recall, F1-score

### Key Features Used

- **Orbital Properties**: Period, eccentricity, semi-major axis
- **Transit Characteristics**: Depth, duration, impact parameter
- **Stellar Properties**: Effective temperature, surface gravity, metallicity, mass, radius
- **Planet Properties**: Radius, mass, equilibrium temperature, orbital inclination

### Preprocessing Pipeline

1. Missing value imputation (median strategy)
2. Outlier removal (3σ threshold)
3. Feature standardization (Z-score normalization)
4. Feature engineering (derived metrics)

## 🔧 Key Components

### Scene.tsx

Main 3D canvas orchestrating the entire visualization:

- Camera rig with smooth fly-to animations
- Keyboard input handling
- Mode-specific UI rendering
- OrbitControls integration

### SolarSystem.tsx

Renders the solar system with accurate orbital mechanics and realistic planet textures.

### ExoplanetPoints.tsx

Visualizes exoplanets as 3D markers in space, positioned by RA/Dec coordinates.

### Rocket.tsx

Player mode spaceship with physics-based movement and collision detection for planet discovery.

### upload.py

Backend API for CSV processing, AI predictions, and result generation.

## ⚡ Performance Optimization

- **3D Rendering**: Instance rendering, frustum culling, texture compression
- **Code Splitting**: Dynamic imports for Three.js components
- **Caching**: React Three Fiber automatic caching
- **Lazy Loading**: Suspense boundaries for 3D assets
- **WebGL Context**: Single canvas with power preference settings
- **API**: Database query optimization, response caching

## 📄 License

This project was created for the NASA Space Apps Challenge 2025.

## 🙏 Acknowledgments

- **NASA Kepler Mission**: For providing the exoplanet dataset
- **NASA Exoplanet Archive**: Data source for planet properties
- **Three.js Community**: For excellent 3D graphics tools
- **React Three Fiber**: For React integration with Three.js
- **NASA Space Apps Challenge**: For the inspiration and challenge

## 📞 Contact

For questions or feedback about Planet Scope, please open an issue on GitHub.

---

**Built with ❤️ for NASA Space Apps Challenge 2025**
