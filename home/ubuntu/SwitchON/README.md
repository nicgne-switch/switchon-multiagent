# SwitchON MultiAgent Platform - README

⚡️ **SwitchON MultiAgent** – Strategic AI-Led Growth Engine for SaaS Startups

## Overview

SwitchON is an AI-powered multi-agent platform designed to automate and optimize the entire B2B sales and marketing process for SaaS startups — from onboarding, strategy generation, tactical execution, to performance optimization — all through a conversational and visual interface.

## Core Modules

1. **Intelligent Onboarding**
   - Conversational data capture (ARR, ICP, ticket, etc.) via Lovable
   - Data stored in Supabase database

2. **AI-Generated Strategy**
   - OpenAI-powered Strategy Architect agent
   - Creates acquisition, nurturing, and closing plans with targets

3. **Tactics & Copy Automation**
   - Outreach Creator agent generates emails, LinkedIn messages, ads, and landing pages
   - Editable content with templates for different channels

4. **Action Approval & Execution**
   - User approval workflow for actions
   - n8n automation for execution
   - Meeting booking integration

5. **KPI Tracking & Scorecard**
   - Lead, conversion, meeting, and revenue tracking
   - Visual analytics dashboard

6. **Optimization & Learning Loop**
   - Campaign Optimizer agent for strategy recalibration
   - A/B testing framework
   - Continuous improvement system

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: Supabase
- **AI**: OpenAI API integration
- **Workflow Automation**: n8n
- **Frontend**: HTML, CSS, JavaScript
- **Deployment**: Cloudflare Workers

## Getting Started

### Prerequisites

- Node.js (v20+)
- npm
- Supabase account
- OpenAI API key
- n8n account
- Cloudflare account (for deployment)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nicgne-switch/switchon-multiagent.git
   cd switchon-multiagent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your API keys (see `.env.example` for reference)

4. Set up the database:
   - Follow the instructions in `/docs/deployment_guide.md` to set up your Supabase database

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the application at http://localhost:3000

## Deployment

For detailed deployment instructions, see `/docs/deployment_guide.md`.

## Project Structure

```
switchon/
├── .github/
│   └── workflows/         # GitHub Actions workflows
├── database/
│   └── schema.sql         # Supabase database schema
├── docs/
│   ├── requirements.md    # Project requirements
│   ├── architecture.md    # System architecture
│   └── deployment_guide.md # Deployment instructions
├── src/
│   ├── ai-agents/         # AI agent implementations
│   ├── backend/           # Express server and API routes
│   ├── database/          # Database schema and queries
│   ├── frontend/          # HTML, CSS, and JavaScript files
│   └── workflows/         # n8n workflow templates
├── .env.example           # Example environment variables
├── package.json           # Project dependencies
├── wrangler.toml          # Cloudflare Workers configuration
└── README.md              # This file
```

## License

Proprietary - All rights reserved

## Contact

For support or inquiries, please contact the development team.
