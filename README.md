# Language Learning Buddy

![Version](https://img.shields.io/badge/Version-1.8.3-brightgreen)
[![Website](https://img.shields.io/badge/Website-language--learning--buddy.pl-blue?logo=Cloudflare&logoColor=white)](https://language-learning-buddy.pl/)

A personal assistant web application for English language learners, designed to help identify and consciously correct recurring grammatical errors in writing.

**Live Application:** [https://language-learning-buddy.pl/](https://language-learning-buddy.pl/)

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Language Learning Buddy is a web application designed as a personal assistant for English language learners. The main goal of the tool is to help identify and consciously correct recurring grammatical and linguistic errors made in writing. The application analyzes short texts provided by the user, highlights potential errors, and allows for them to be manually added to a personalized "To-learn" list.

Unlike standard proofreading tools, Language Learning Buddy emphasizes the process of active learning, giving the user full control over which issues they want to save and analyze in the future.

## Tech Stack

The project is built with a modern tech stack focused on performance and developer experience.

- **Frontend**: [Astro 5](https://astro.build/) with [React 19](https://react.dev/) for interactive components.
- **Styling**: [Tailwind 4](https://tailwindcss.com/) with [Shadcn/ui](https://ui.shadcn.com/) for accessible components.
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) for static typing.
- **Backend**: [Supabase](https://supabase.io/) as a comprehensive backend solution (PostgreSQL database, Authentication, BaaS).
- **AI Integration**: Communication with AI models via [Openrouter.ai](https://openrouter.ai/).
- **Testing**: [Vitest](https://vitest.dev/) for unit and integration tests, [Playwright](https://playwright.dev/) for end-to-end tests, and [Mock Service Worker](https://mswjs.io/) for API mocking.
- **CI/CD & Hosting**: [GitHub Actions](https://github.com/features/actions) for CI/CD and [Cloudflare Pages](https://pages.cloudflare.com/) for hosting.

## Getting Started Locally

To set up and run the project locally, follow these steps:

### Prerequisites

- Node.js version `22.14.0` (as specified in the `.nvmrc` file). We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.
- `npm` or a compatible package manager.

### Installation

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/your-username/language-learning-buddy.git
    cd language-learning-buddy
    ```

2.  **Set the Node.js version:**

    ```sh
    nvm use
    ```

3.  **Install dependencies:**

    ```sh
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the necessary API keys and configuration for services like Supabase and Openrouter.ai.

    ```env
    # .env
    SUPABASE_URL=your_supabase_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    OPENROUTER_API_KEY=your_openrouter_api_key

    # Environment name for feature flags (local, integration, production)
    ENV_NAME=local
    PUBLIC_ENV_NAME=local
    ```

### Running the Application

To start the development server, run:

```sh
npm run dev
```

The application will be available at `http://localhost:3000`.

## Available Scripts

The following scripts are available in the `package.json`:

- `npm run dev`: Starts the Astro development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run lint:fix`: Lints the codebase and automatically fixes issues.
- `npm run format`: Formats the code using Prettier.
- `npm run test`: Runs the unit tests.
- `npm run test:coverage`: Runs the unit tests with coverage.
- `npm run test:watch`: Runs the unit tests in watch mode.
- `npm run test:e2e`: Runs the end-to-end tests.
- `npm run test:e2e:ui`: Runs the end-to-end tests in UI mode.
- `npm run test:e2e:headed`: Runs the end-to-end tests in headed mode.
- `npm run test:e2e:install`: Installs the Playwright browsers.

## Deployment

The application is deployed to Cloudflare Pages using GitHub Actions. Every push to the `master` branch triggers an automatic deployment.

### Prerequisites for Deployment

1. **Cloudflare Pages Project**: Create a project in Cloudflare Pages
2. **GitHub Secrets**: Configure the following secrets in your repository:
   - `CLOUDFLARE_API_TOKEN`: API token with Pages:Edit permissions
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_PUBLIC_KEY`: Supabase anonymous key
   - `OPENROUTER_API_KEY`: OpenRouter API key

3. **GitHub Variables**: Configure the following variables:
   - `CLOUDFLARE_PROJECT_NAME`: Name of your Cloudflare Pages project
   - `APP_NAME`: Application name
   - `ASTRO_SITE`: Production site URL
   - `ENV_NAME`: Environment name (production)

### Deployment Process

The deployment workflow automatically:

1. Runs linting checks
2. Executes unit tests with coverage
3. Builds the application with Cloudflare adapter
4. Deploys to Cloudflare Pages

For detailed deployment documentation, see `.cursor/rules/hosting-analysis.md`.

## Project Scope

### In Scope (MVP Features)

- **User Accounts**: Registration and login via email and password.
- **Text Analysis**: Analysis of short English texts (up to 500 characters) using an external AI model.
- **Error Highlighting**: Visual highlighting of potential errors in the original text.
- **Error Interaction**: Clicking on an error displays a short explanation.
- **"To-learn" List**: Manually adding errors with their context sentences to a personalized list.
- **Edge Case Handling**: Dedicated messages for texts without errors, non-English texts, or technical issues.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

**Name**: [Jakub Aniszewski](https://github.com/jaqb8)
**Email**: [jakubaniszewski@pm.me](mailto:jakubaniszewski@pm.me)
**Website**: [aniszewski.com](https://aniszewski.com)
