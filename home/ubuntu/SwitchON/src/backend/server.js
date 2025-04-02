// Environment variables configuration
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { Configuration, OpenAIApi } = require('openai');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase client (will use environment variables in production)
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI configuration (will use environment variables in production)
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
});
const openai = new OpenAIApi(configuration);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SwitchON MultiAgent API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, supabase, openai };
