# Firebase Deployment Guide

This guide explains how to make changes to your Angular applications and deploy them to Firebase hosting.

## Project Structure

This project is an Nx monorepo with the following structure:

- **Shared Library (`auth-lib`)**: Contains the Firebase authentication service used by both applications
- **Apps Folder**:
  - **Client App**: Basic authentication demo application - https://client-app-demo-pgw9z.web.app
  - **Admin App**: Basic authentication demo application - https://admin-app-demo-es2ri.web.app

## Making Changes

### 1. Modifying the Shared Library

If you need to make changes to the shared authentication library:

```bash
# Edit files in the shared library
cd /path/to/auth-demo/shared/src/lib

# Build the shared library after changes
npx nx build auth-lib
```

### 2. Modifying the Applications

To make changes to either application:

```bash
# For client-app
cd /path/to/auth-demo/apps/client-app/src

# For admin-app
cd /path/to/auth-demo/apps/admin-app/src
```

## Building and Deploying with NPM Scripts

This project includes npm scripts to simplify the build and deployment process. All scripts should be run from the root directory of the project.

### Build Scripts

```bash
# Clean the dist folder
npm run clean

# Build the admin app
npm run build:admin

# Build the client app
npm run build:client

# Clean and build both apps
npm run build:all
```

### Deploy Scripts

```bash
# Deploy the admin app
npm run deploy:admin

# Deploy the client app
npm run deploy:client

# Deploy both apps
npm run deploy:all
```

### Combined Build & Deploy Scripts

```bash
# Clean, build, and deploy the admin app
npm run build-deploy:admin

# Clean, build, and deploy the client app
npm run build-deploy:client

# Clean, build, and deploy both apps
npm run build-deploy:all
```

### Automated Firebase Setup Script

If you need to completely recreate your Firebase hosting setup (for example, if you deleted your hosting sites), use the automated setup script:

```bash
# Automatically create new Firebase hosting sites, update configuration, and deploy apps
npm run setup-firebase
```

This script will:
1. Create new Firebase hosting sites with unique IDs for both applications
2. Update the `.firebaserc` file with the new site IDs
3. Build and deploy both applications to the new sites
4. Update the DEPLOYMENT_GUIDE.md with the new URLs

## Manual Building for Production

If you prefer not to use the npm scripts, you can manually build the applications for production:

```bash
# Build client-app for production
npx nx build client-app --configuration=production --skip-nx-cache

# Build admin-app for production
npx nx build admin-app --configuration=production --skip-nx-cache
```

## Manual Deploying to Firebase

### Deploy Both Applications

To deploy both applications at once:

```bash
firebase deploy --only hosting
```

### Deploy Individual Applications

To deploy only one of the applications:

```bash
# Deploy only client-app
firebase deploy --only hosting:client-app

# Deploy only admin-app
firebase deploy --only hosting:admin-app
```

## Troubleshooting

### Page Not Found Error

If you see a "Page Not Found" error after deployment, check:

1. The `firebase.json` configuration is pointing to the correct build output directories:
   - Client App: `dist/apps/client-app/browser`
   - Admin App: `dist/apps/admin-app/browser`

2. The build output directories contain an `index.html` file:
   ```bash
   ls -la dist/apps/client-app/browser
   ls -la dist/apps/admin-app/browser
   ```

### Firebase Configuration

If you need to reconfigure Firebase hosting:

```bash
# Create new hosting sites if needed
firebase hosting:sites:create client-app-demo-[unique-id]
firebase hosting:sites:create admin-app-demo-[unique-id]

# Clear existing hosting targets
firebase target:clear hosting client-app
firebase target:clear hosting admin-app

# Set up hosting targets again
firebase target:apply hosting client-app client-app-demo-[unique-id]
firebase target:apply hosting admin-app admin-app-demo-[unique-id]
```

### Recreating Firebase Hosting Sites

If you've deleted your Firebase hosting sites from the dashboard, you'll need to create new ones:

1. Create new hosting sites:
   ```bash
   firebase hosting:sites:create client-app-demo
   firebase hosting:sites:create admin-app-demo
   ```
   Note: Firebase will suggest unique IDs if the names are already taken.

2. Update the `.firebaserc` file with the new site IDs.

3. Deploy to the new sites:
   ```bash
   npm run build-deploy:all
   ```

**Alternatively, you can use the automated setup script:**
```bash
npm run setup-firebase
```

## Application URLs

Your applications are deployed at:

1. Client App: https://client-app-demo-pgw9z.web.app
2. Admin App: https://admin-app-demo-es2ri.web.app
