// Strategy generation API routes for SwitchON MultiAgent platform
const express = require('express');
const router = express.Router();
const { supabase, openai } = require('../server');
const { StrategyArchitectAgent } = require('../../ai-agents/agents');
const LovableService = require('../services/lovable');

// Initialize services
const lovableService = new LovableService();
const strategyArchitect = new StrategyArchitectAgent(openai);

// Generate strategy for a company
router.post('/generate', async (req, res) => {
  try {
    const { company_id, user_id } = req.body;

    // Fetch company data from Supabase
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (companyError) {
      console.error('Error fetching company data:', companyError);
      return res.status(500).json({ error: companyError.message });
    }

    if (!companyData) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Generate strategy using the Strategy Architect agent
    const strategyContent = await strategyArchitect.generateStrategy(companyData);

    // Create strategy title based on company name
    const strategyTitle = `Go-To-Market Strategy for ${companyData.name}`;

    // Save strategy to Supabase
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategies')
      .insert({
        company_id,
        title: strategyTitle,
        content: strategyContent,
        status: 'draft'
      })
      .select();

    if (strategyError) {
      console.error('Error saving strategy:', strategyError);
      return res.status(500).json({ error: strategyError.message });
    }

    // Create strategy approval flow in Lovable
    try {
      await lovableService.createStrategyApprovalFlow(strategyData[0], user_id);
    } catch (lovableError) {
      console.warn('Warning: Could not create Lovable approval flow:', lovableError);
      // Continue execution even if Lovable integration fails
    }

    // Return the created strategy
    return res.status(201).json({
      success: true,
      message: 'Strategy generated successfully',
      data: strategyData[0]
    });
  } catch (err) {
    console.error('Server error generating strategy:', err);
    return res.status(500).json({ error: 'Server error generating strategy' });
  }
});

// Get strategy by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching strategy:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('Server error fetching strategy:', err);
    return res.status(500).json({ error: 'Server error fetching strategy' });
  }
});

// Get all strategies for a company
router.get('/company/:company_id', async (req, res) => {
  try {
    const { company_id } = req.params;

    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching strategies:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('Server error fetching strategies:', err);
    return res.status(500).json({ error: 'Server error fetching strategies' });
  }
});

// Update strategy status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['draft', 'active', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const { data, error } = await supabase
      .from('strategies')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating strategy status:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Strategy status updated successfully',
      data: data[0]
    });
  } catch (err) {
    console.error('Server error updating strategy status:', err);
    return res.status(500).json({ error: 'Server error updating strategy status' });
  }
});

// Update strategy content
router.put('/:id/content', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, title } = req.body;

    // Validate input
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const updates = { 
      content, 
      updated_at: new Date() 
    };

    // Only update title if provided
    if (title) {
      updates.title = title;
    }

    const { data, error } = await supabase
      .from('strategies')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating strategy content:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Strategy content updated successfully',
      data: data[0]
    });
  } catch (err) {
    console.error('Server error updating strategy content:', err);
    return res.status(500).json({ error: 'Server error updating strategy content' });
  }
});

module.exports = router;
