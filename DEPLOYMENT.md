# Deployment Guide for Render

This project is configured for easy deployment on [Render](https://render.com/).

## Prerequisites

1.  A Render account.
2.  A MongoDB database (e.g., [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)).
3.  A Supabase project (already configured in `.env`).

## Automated Deployment (Recommended)

The project includes a `render.yaml` file. You can use Render's "Blueprints" feature to deploy automatically.

1.  Connect your GitHub repository to Render.
2.  Render will detect the `render.yaml` and offer to create a Blueprint.
3.  You will be prompted to provide values for the following environment variables.

## Required Environment Variables

You must set these in the Render dashboard (under the **Environment** tab of your service):

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | Your MongoDB connection string. |
| `EMAIL_USER` | The email address used for sending notifications. |
| `EMAIL_PASS` | The password or app password for the email account. |
| `ADMIN_EMAIL` | (Optional) The email where notifications will be sent (defaults to `EMAIL_USER`). |
| `VITE_SUPABASE_URL` | Your Supabase URL. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key. |

## Manual Deployment

If you prefer to create the service manually:

1.  **Service Type**: Web Service
2.  **Runtime**: Node
3.  **Build Command**: `npm install && npm run build`
4.  **Start Command**: `npm start`
5.  **Environment Variables**: Add those listed above.

## Verification

Once deployed, the backend server will serve the frontend. You can access the site at your Render URL (e.g., `https://tgc-events-hub.onrender.com`).
