# Frontend Project - Image Analysis App

This is a React + Vite frontend application designed to connect to a Python backend for image analysis.

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/          # React components
│   │   └── index.js        # Component exports
│   ├── services/           # API service layer
│   │   └── api.js         # Axios configuration and API methods
│   ├── assets/            # Static assets
│   │   ├── images/        # Image files
│   │   └── icons/         # Icon files
│   ├── App.jsx            # Main App component
│   ├── App.css            # App styles
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles
├── package.json
├── vite.config.js
└── README.md
```

## Installed Dependencies

### Core Dependencies
- **React** - UI framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client for API calls

### UI Libraries
- **Tailwind CSS** - Utility-first CSS framework (installed but needs configuration)
- **Flowbite** - Component library for Tailwind CSS
- **Flowbite React** - React components for Flowbite

## Getting Started

### Prerequisites
- Node.js (v22.16.0 or higher)
- npm (v10.9.2 or higher)

### Installation
The project dependencies are already installed. If you need to reinstall:

```bash
cd frontend
npm install
```

### Development Server
Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

## API Configuration

The API service is pre-configured to connect to your Python backend. Update the base URL in `src/services/api.js`:

```javascript
const api = axios.create({
  baseURL: 'http://localhost:8000', // Update this to match your Python backend
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Available API Methods

The `imageAPI` object provides methods for:
- `analyzeImage(imageFile)` - Upload and analyze an image
- `getAnalysisResult(analysisId)` - Get analysis results by ID
- `getAnalysisHistory()` - Get analysis history

## Tailwind CSS Configuration

Note: Tailwind CSS is installed but not currently configured due to PostCSS compatibility issues. To enable Tailwind CSS:

1. Create a working `postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

2. Create a `tailwind.config.js`:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin')
  ],
}
```

3. Add Tailwind directives to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Next Steps

1. Create UI components in `src/components/`
2. Implement image upload functionality
3. Create analysis result display components
4. Add routing with React Router (if needed)
5. Configure Tailwind CSS for styling
6. Connect to your Python backend API

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
