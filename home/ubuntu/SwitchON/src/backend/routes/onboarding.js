// Onboarding API routes for SwitchON MultiAgent platform
const express = require('express');
const router = express.Router();
const { supabase } = require('../server');

// Create new company and save onboarding data
router.post('/company', async (req, res) => {
  try {
    const {
      company,
      financial,
      icp,
      marketing
    } = req.body;

    // Format data for Supabase
    const companyData = {
      name: company.name,
      industry: company.industry,
      arr: financial.arr,
      icp: JSON.stringify({
        industries: icp.industries,
        sizes: icp.sizes,
        decisionMakers: icp.decisionMakers
      }),
      ticket_size: financial.ticketSize,
      channels: marketing.channels
    };

    // Insert company data into Supabase
    const { data, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select();

    if (error) {
      console.error('Error saving company data:', error);
      return res.status(500).json({ error: error.message });
    }

    // Return the created company data
    return res.status(201).json({ 
      success: true, 
      message: 'Company onboarded successfully',
      data: data[0]
    });
  } catch (err) {
    console.error('Server error during onboarding:', err);
    return res.status(500).json({ error: 'Server error during onboarding' });
  }
});

// Get company data by ID
router.get('/company/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching company data:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Company not found' });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('Server error fetching company:', err);
    return res.status(500).json({ error: 'Server error fetching company' });
  }
});

// Update company data
router.put('/company/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating company data:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Company updated successfully',
      data: data[0]
    });
  } catch (err) {
    console.error('Server error updating company:', err);
    return res.status(500).json({ error: 'Server error updating company' });
  }
});

// Create new user associated with company
router.post('/user', async (req, res) => {
  try {
    const { email, company_id, role } = req.body;

    // Insert user data into Supabase
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        company_id,
        role
      })
      .select();

    if (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      data: data[0]
    });
  } catch (err) {
    console.error('Server error creating user:', err);
    return res.status(500).json({ error: 'Server error creating user' });
  }
});

module.exports = router;
