# Driving School Management System

A comprehensive management system for driving schools built with Angular and Firebase, packaged as a Tauri desktop application. This project uses an Nx monorepo architecture to manage multiple applications and shared libraries.

## Project Overview

This project consists of two main applications:
- **Admin App**: Management interface for driving school administrators and instructors
- **Client App**: User interface for driving school students

## Key Features

- **User Authentication**: Firebase-based authentication system
- **Instructor Management**: Track instructor profiles, performance, and schedules
- **Student Management**: Manage student information and progress
- **Pricing Management**: Flexible pricing components with category badges
- **Performance Analytics**: Chart.js integration for visualizing instructor performance and cost analysis
- **Desktop Application**: Tauri integration for cross-platform desktop experience

## Technology Stack

- **Frontend**: Angular 19
- **UI Framework**: Tailwind CSS with custom UI components
- **Charts**: Chart.js with custom styling
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Desktop Packaging**: Tauri v1.5+
- **Build System**: Nx Workspace

## Project Structure

```
driving-school/
├── apps/
│   ├── admin-app/    # Admin interface
│   └── client-app/   # Client interface
├── libs/
│   └── ui/           # Shared UI components
├── shared/           # Shared services and utilities
│   └── firebase/     # Firebase integration
├── src-tauri/        # Tauri desktop application configuration
└── ...
```

## Development

### Prerequisites

- Node.js (latest LTS version)
- npm or yarn
- Rust (for Tauri development)

### Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/Jure-Rajcic/driving-school.git
   cd driving-school
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start development server
   ```bash
   # For admin app
   npm run start:admin
   
   # For client app
   npm run start:client
   
   # For Tauri development
   npm run dev
   ```

## Building and Deployment

### Web Applications

```bash
# Build admin app
npm run build:admin

# Build client app
npm run build:client

# Build both apps
npm run build:all

# Deploy to Firebase
npm run deploy:all
```

### Desktop Application

```bash
# Build Tauri application
npm run build:tauri
```

## Firebase Setup

To set up Firebase for this project:

```bash
npm run setup-firebase
```

This script will configure Firebase for both applications.

## License

MIT
