# SwitchON MultiAgent Platform Deployment Guide

This guide provides comprehensive instructions for deploying the SwitchON MultiAgent platform to production.

## Prerequisites

Before you begin, ensure you have the following:

- GitHub account (nicgne-switch)
- Supabase account with project created
- OpenAI API key
- n8n account
- Cloudflare account (for deployment)

## Step 1: Clone the Repository

```bash
git clone https://github.com/nicgne-switch/switchon-multiagent.git
cd switchon-multiagent
```

## Step 2: Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
N8N_BASE_URL=your_n8n_base_url
N8N_API_KEY=your_n8n_api_key
```

> **Important Security Note**: For production, never commit this file to your repository. Add `.env` to your `.gitignore` file.

## Step 3: Set Up Supabase Database

1. Log in to your Supabase account and navigate to your project
2. Go to the SQL Editor
3. Copy the contents of `database/schema.sql` from this repository
4. Paste and execute the SQL in the Supabase SQL Editor

This will create all necessary tables, indexes, and triggers for the SwitchON platform.

## Step 4: Configure GitHub Secrets

For automated deployment with GitHub Actions, add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following repository secrets:

- `OPENAI_API_KEY`: Your OpenAI API key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key
- `N8N_BASE_URL`: Your n8n base URL
- `N8N_API_KEY`: Your n8n API key
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

## Step 5: Configure Cloudflare

1. Create a Cloudflare Workers account if you don't have one
2. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```
3. Log in to Cloudflare:
   ```bash
   wrangler login
   ```
4. Create a D1 database:
   ```bash
   wrangler d1 create switchon_db
   ```
5. Update the `wrangler.toml` file with your database ID from the output of the previous command

## Step 6: Local Development and Testing

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Test the application at http://localhost:3000

## Step 7: Manual Deployment

If you prefer to deploy manually instead of using GitHub Actions:

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Cloudflare Workers:
   ```bash
   wrangler deploy
   ```

## Step 8: Set Up n8n Workflows

1. Log in to your n8n account
2. Import the workflow templates from the `src/workflows` directory
3. Configure the workflows with your Supabase and OpenAI credentials
4. Activate the workflows

## Step 9: Post-Deployment Verification

After deployment, verify that:

1. The frontend is accessible at your Cloudflare Workers URL
2. The API endpoints are working correctly
3. The database connections are functioning
4. The AI agents are generating content properly
5. The n8n workflows are triggering as expected

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Verify your Supabase credentials
2. Check that the RLS policies are configured correctly
3. Ensure your service role key has the necessary permissions

### AI Agent Issues

If the AI agents are not working:

1. Check your OpenAI API key
2. Verify that the API requests are formatted correctly
3. Check for rate limiting issues

### Deployment Issues

If deployment fails:

1. Check the GitHub Actions logs for errors
2. Verify your Cloudflare credentials
3. Ensure your wrangler.toml file is configured correctly

## Security Recommendations

1. Rotate your API keys regularly
2. Use environment variables for all sensitive information
3. Implement proper authentication and authorization
4. Enable RLS policies in Supabase
5. Set up monitoring and logging

## Maintenance

1. Regularly update dependencies
2. Monitor API usage and costs
3. Back up your database regularly
4. Set up alerts for system failures

For additional support, contact the development team or refer to the documentation in the repository.
