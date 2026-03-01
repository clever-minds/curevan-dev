# Curevan

Curevan is a modern healthcare platform designed to connect patients with therapists seamlessly.

## Core Features

- **Therapist Discovery**: Find and filter healthcare providers on an interactive map.
- **Appointment Booking**: Easily book appointments with your chosen therapist.
- **Booking Management**: A dedicated dashboard for therapists to manage their schedules.
- **AI-Assisted Notes**: Therapists can leverage GenAI to automatically generate objective notes from patient descriptions.
- **Patient Care Reports (PCR)**: Create and manage digital PCR forms.

## Getting Started

To get the project up and running locally, follow these steps.

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up environment variables:**
    Create a file named `.env.local` in the root of your project. This file will hold your secret keys and configuration. Add the following variables, replacing the placeholder values with your actual credentials.

    ```
    # Firebase client-side configuration.
    # You can get these values from your project's settings in the Firebase console.
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"

    # Your Google Maps API Key for the discovery map
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"

    # Your Google Analytics Measurement ID (e.g., G-XXXXXXXXXX)
    NEXT_PUBLIC_GA_ID="YOUR_GA_ID_HERE"

    # Your Google AI API Key for the backend Genkit flows
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

    # A password for the test users used in end-to-end testing
    TEST_USER_PASSWORD="YOUR_TEST_PASSWORD"
    ```
    > **Note**: The AI features like assisted note-taking are powered by **Google AI Studio (Genkit)** on the backend.

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
