# Amdox ERP Backend

Backend REST API for the Amdox Enterprise Resource Planning (ERP) platform.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB Atlas
- Mongoose
- JWT Authentication
- bcryptjs
- REST API

## Project Structure

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── db/
│   ├── events/
│   ├── jobs/
│   ├── middleware/
│   ├── models/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── validators/
│   └── server.ts
├── tests/
├── scripts/
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js
- npm
- MongoDB Atlas account or MongoDB instance
- Git

## Installation

Install dependencies:

```bash
npm install
```

Create your environment file:

```powershell
Copy-Item .env.example .env
```

Configure the required environment variables in `.env`.

## Environment Variables

| Variable | Description |
|---|---|
| PORT | Backend server port (default: 5001) |
| NODE_ENV | Application environment |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Secret used to sign JWT tokens |
| JWT_EXPIRES_IN | JWT expiration duration |
| CORS_ORIGIN | Allowed frontend origin(s), comma-separated |

Optional email configuration:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

Never commit your `.env` file or expose credentials.

## Running Locally

Start the development server:

```bash
npm run dev
```

Build the TypeScript application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## API Health Check

Once the server is running:

```text
http://localhost:5001/api/health
```

Root endpoint:

```text
http://localhost:5001/
```

## API Modules

The backend is organized into these ERP modules:

- Authentication and Authorization
- Organisation and Tenant Management
- User Management
- Human Resources
- Finance
- Supply Chain
- Project Management
- Dashboard
- Notifications
- Settings

Refer to `src/routes/` for the implemented API endpoints.

## Database

The application uses MongoDB with Mongoose.

Database configuration:

```text
src/config/database.ts
```

Configure the MongoDB connection using `MONGO_URI`.

## Deployment

The backend is intended to be deployed on Render.

Recommended Render configuration:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |

If deploying from a monorepo, set the backend directory as the Root Directory.

Configure the required environment variables in Render.

The frontend can be deployed separately on Vercel. Set its API base URL to the deployed backend URL.

## Security

- Passwords are hashed using bcryptjs.
- Protected routes use JWT authentication.
- Role-based authorization is implemented through middleware.
- Tenant context is used for tenant-scoped operations.
- Sensitive configuration is stored in environment variables.

## Development Guidelines

- Keep controllers, services, repositories, models, and routes separated.
- Follow the existing module structure when adding features.
- Validate incoming request data.
- Apply tenant isolation to tenant-scoped resources.
- Never commit credentials or environment files.

## License

Private project. All rights reserved.