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

## Manual Deployment Fields

If you are filling out the form on Render manually, use these values:

| Field | Value |
| :--- | :--- |
| **Language** | `Node` (or `Bun` if available) |
| **Build Command** | `bun install && bun run build` |
| **Start Command** | `bun run start` |
| **Root Directory** | (Leave empty) |

## Required Environment Variables
Go to the **Environment** tab and click **Add Environment Variable**:

| Variable | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | *Your MongoDB connection string* |
| `EMAIL_USER` | *Your Email address* |
| `EMAIL_PASS` | *Your Email App Password* |
| `VITE_SUPABASE_URL` | *Your Supabase URL* |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | *Your Supabase Key* |

## Verification

Once deployed, the backend server will serve the frontend. You can access the site at your Render URL (e.g., `https://tgc-events-hub.onrender.com`).
