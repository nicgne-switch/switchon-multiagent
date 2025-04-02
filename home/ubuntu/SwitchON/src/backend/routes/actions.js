// Action approval and execution API routes for SwitchON MultiAgent platform
const express = require('express');
const router = express.Router();
const { supabase } = require('../server');
const LovableService = require('../services/lovable');
const axios = require('axios');

// Initialize services
const lovableService = new LovableService();

// Get all actions for a company
router.get('/company/:company_id', async (req, res) => {
  try {
    const { company_id } = req.params;
    const { status, type } = req.query;

    let query = supabase
      .from('actions')
      .select('*')
      .eq('company_id', company_id);
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Filter by type if provided
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching actions:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('Server error fetching actions:', err);
    return res.status(500).json({ error: 'Server error fetching actions' });
  }
});

// Get action by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching action:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Action not found' });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('Server error fetching action:', err);
    return res.status(500).json({ error: 'Server error fetching action' });
  }
});

// Create new action
router.post('/', async (req, res) => {
  try {
    const { company_id, campaign_id, type, content, assigned_to, due_date } = req.body;

    // Validate input
    if (!company_id || !type || !content) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Create action in Supabase
    const { data, error } = await supabase
      .from('actions')
      .insert({
        company_id,
        campaign_id,
        type,
        content,
        status: 'pending',
        assigned_to,
        due_date: due_date || null
      })
      .select();

    if (error) {
      console.error('Error creating action:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Action created successfully',
      data: data[0]
    });
  } catch (err) {
    console.error('Server error creating action:', err);
    return res.status(500).json({ error: 'Server error creating action' });
  }
});

// Update action status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const { data, error } = await supabase
      .from('actions')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating action status:', error);
      return res.status(500).json({ error: error.message });
    }

    // If action is approved, trigger n8n workflow
    if (status === 'approved') {
      try {
        await triggerWorkflow(data[0]);
      } catch (workflowError) {
        console.warn('Warning: Could not trigger workflow:', workflowError);
        // Continue execution even if workflow trigger fails
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Action status updated successfully',
      data: data[0]
    });
  } catch (err) {
    console.error('Server error updating action status:', err);
    return res.status(500).json({ error: 'Server error updating action status' });
  }
});

// Assign action to user
router.put('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    // Validate input
    if (!assigned_to) {
      return res.status(400).json({ error: 'Assigned to is required' });
    }

    const { data, error } = await supabase
      .from('actions')
      .update({ assigned_to, updated_at: new Date() })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error assigning action:', error);
      return res.status(500).json({ error: error.message });
    }

    // Notify the assigned user
    try {
      await lovableService.sendNotification(
        assigned_to,
        'Action Assigned',
        `You have been assigned a new action: ${data[0].content}`,
        `/actions/${data[0].id}`
      );
    } catch (notifyError) {
      console.warn('Warning: Could not send notification:', notifyError);
      // Continue execution even if notification fails
    }

    return res.status(200).json({
      success: true,
      message: 'Action assigned successfully',
      data: data[0]
    });
  } catch (err) {
    console.error('Server error assigning action:', err);
    return res.status(500).json({ error: 'Server error assigning action' });
  }
});

// Trigger n8n workflow based on action type
async function triggerWorkflow(action) {
  const n8nBaseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
  const n8nApiKey = process.env.N8N_API_KEY || 'your-n8n-api-key';
  
  // Determine which workflow to trigger based on action type
  let webhookPath;
  
  switch (action.type) {
    case 'email':
      webhookPath = '/webhook/email-outreach';
      break;
    case 'linkedin':
      webhookPath = '/webhook/linkedin-outreach';
      break;
    case 'sms':
      webhookPath = '/webhook/sms-outreach';
      break;
    case 'meeting':
      webhookPath = '/webhook/schedule-meeting';
      break;
    case 'optimization':
      webhookPath = '/webhook/apply-optimization';
      break;
    default:
      webhookPath = '/webhook/generic-action';
  }
  
  // Trigger the workflow
  const response = await axios.post(`${n8nBaseUrl}${webhookPath}`, action, {
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': n8nApiKey
    }
  });
  
  return response.data;
}

module.exports = router;
