# Firebase Functions Deployment Guide

This document outlines the standard procedure for deploying the Cloud Functions in this directory to a live Firebase project.

## Prerequisites

- You have been granted access to the target Firebase project.
- The [Firebase CLI](https://firebase.google.com/docs/cli) is installed and authenticated on your machine.

## Deployment Process

Follow these steps carefully to deploy your functions to production.

### Step 1: (One-Time) Link to the Firebase Project

If this is your first time deploying from this machine, you must link your local environment to the correct Firebase project.

1.  **Navigate to the functions directory:**
    ```bash
    cd apps/admin-app/firebase/functions
    ```

2.  **Log in to your Firebase account:**
    ```bash
    firebase login
    ```

3.  **Set the target project:**
    Replace `<YOUR_PROJECT_ID>` with the actual Firebase project ID.
    ```bash
    firebase use <YOUR_PROJECT_ID>
    ```
    This command creates a `.firebaserc` file to remember your choice, so you only need to do this once per machine.

### Step 2: Deploy the Functions

To build the TypeScript code and deploy **only the functions** to your selected Firebase project, run the following command from this directory (`apps/admin-app/firebase/functions`):

```bash
npm run deploy
```

This single command handles both compiling your code and deploying it, ensuring that your latest changes are always sent to production.
