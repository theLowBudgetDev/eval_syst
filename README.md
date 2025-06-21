# EvalTrack - Performance Management System

EvalTrack is a comprehensive, full-stack web application designed to streamline and manage employee performance tracking within an organization. It provides role-based dashboards and a suite of tools for administrators, supervisors, and employees to collaboratively handle evaluations, goals, and progress monitoring.

## Core Features

- **Role-Based Access Control:** Tailored dashboards and permissions for Admin, Supervisor, and Employee roles.
- **Comprehensive Dashboards:** At-a-glance summaries of key metrics, team performance, and personal progress.
- **Employee Management:** Admins can manage a complete directory of employee records, roles, and reporting structures.
- **Performance Evaluations:** Define custom evaluation criteria, conduct reviews, and track performance history.
- **Goal Setting:** Set, track, and manage individual and team goals with status updates and due dates.
- **Progress Monitoring:** Log and review employee work outputs and track attendance records.
- **System Configuration:** Admins can customize application settings, manage user assignments, and configure automated messaging.
- **Modern, Responsive UI:** A clean, themeable interface built with ShadCN UI and Tailwind CSS that works seamlessly across devices.

## Tech Stack

- **Framework:** Next.js (App Router)
- **UI Library:** React & ShadCN UI
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** SQLite (for development)
- **AI/Generative:** Genkit (for future AI-powered features)

## Getting Started: Local Development

Follow these steps to get a local instance of EvalTrack running on your machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (included with Node.js)

### 1. Installation

Install the project dependencies using npm:

```bash
npm install
```

### 2. Environment Setup

The application uses a `.env` file to manage environment variables, primarily the database connection string.

Create a `.env` file in the root of the project and add the following line. This configures the app to use a local SQLite database file.

```env
DATABASE_URL="file:./dev.db"
```

### 3. Database Migration and Seeding

Prisma needs to set up the database schema and populate it with initial mock data.

1.  **Run the migration:** This command will create the `dev.db` file and set up all the necessary tables based on the schema in `prisma/schema.prisma`.

    ```bash
    npx prisma migrate dev --name init
    ```

2.  **Seed the database:** This command will run the `prisma/seed.ts` script to populate the tables with mock users and data.

    ```bash
    npx prisma db seed
    ```

### 4. Running the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## Default Login Credentials

You can log in with the following pre-seeded mock users:

-   **Admin:**
    -   **Email:** `admin@example.com`
    -   **Password:** `password123`
-   **Supervisor:**
    -   **Email:** `supervisor@example.com`
    -   **Password:** `password123`
-   **Employee:**
    -   **Email:** `employee@example.com`
    -   **Password:** `password123`

## Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Creates a production-ready build of the application.
-   `npm run start`: Starts the production server (requires a build first).
-   `npm run lint`: Lints the codebase for errors and style issues.
-   `npm run prisma:migrate`: A shortcut for `prisma migrate dev`.
-   `npm run prisma:seed`: A shortcut for `prisma db seed`.

## Production Considerations

While this application is feature-complete, for a real-world production deployment, please consider the following:

1.  **Database:** Switch from SQLite to a more robust, scalable database like **PostgreSQL** or **MySQL**. This involves updating the `provider` in `prisma/schema.prisma` and the `DATABASE_URL` in your `.env` file.
2.  **Authentication:** The current authentication is simplified for development. Implement a secure, token-based authentication system (e.g., using **NextAuth.js** or **Lucia Auth**) for production use.
