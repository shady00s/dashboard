# Stock Dashboard

A responsive stock market dashboard with real-time updates and theme customization.

## Features

- **Dark/Light Theme Toggle**
  - Switch between light and dark modes
  - Theme preference persists across sessions
  - Smooth transitions between themes

- **Modern UI**
  - Clean, responsive design
  - Inter font family for better readability
  - Animated card interactions
  - Mobile-friendly layout

- **Real-time Data**
  - WebSocket connection for live stock updates
  - Visual indicators for price changes
  - Timestamp of last update

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Styling Features

- CSS variables for consistent theming
- Responsive grid layout for stock cards
- Enhanced button styling with hover effects
- WCAG-compliant color contrast

## Theme Configuration

The theme can be toggled using the sun/moon icon in the header. The selected theme is saved in localStorage.

## Deployment

To deploy your app, install an appropriate [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
