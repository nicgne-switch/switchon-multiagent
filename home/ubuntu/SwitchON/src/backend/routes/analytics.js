// Analytics and KPI tracking API routes for SwitchON MultiAgent platform
const express = require('express');
const router = express.Router();
const { supabase, openai } = require('../server');
const { CampaignOptimizerAgent } = require('../../ai-agents/agents');
const LovableService = require('../services/lovable');

// Initialize services
const lovableService = new LovableService();
const campaignOptimizer = new CampaignOptimizerAgent(openai);

// Get KPI dashboard data for a company
router.get('/dashboard/:company_id', async (req, res) => {
  try {
    const { company_id } = req.params;
    const { period } = req.query; // day, week, month, quarter, year
    
    // Default to month if period not specified
    const timeFrame = period || 'month';
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch(timeFrame) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // Format dates for database query
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    // Get campaign metrics
    const { data: metricsData, error: metricsError } = await supabase
      .from('campaign_metrics')
      .select('*, campaigns(name, channel)')
      .eq('campaigns.company_id', company_id)
      .gte('date', startDateStr)
      .lte('date', endDateStr);
    
    if (metricsError) {
      console.error('Error fetching campaign metrics:', metricsError);
      return res.status(500).json({ error: metricsError.message });
    }
    
    // Get leads data
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('company_id', company_id)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);
    
    if (leadsError) {
      console.error('Error fetching leads data:', leadsError);
      return res.status(500).json({ error: leadsError.message });
    }
    
    // Get meetings data
    const { data: meetingsData, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .eq('company_id', company_id)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);
    
    if (meetingsError) {
      console.error('Error fetching meetings data:', meetingsError);
      return res.status(500).json({ error: meetingsError.message });
    }
    
    // Calculate KPIs
    const kpis = calculateKPIs(metricsData, leadsData, meetingsData);
    
    // Return dashboard data
    return res.status(200).json({
      timeFrame,
      startDate: startDateStr,
      endDate: endDateStr,
      kpis,
      metrics: {
        campaigns: metricsData,
        leads: leadsData,
        meetings: meetingsData
      }
    });
  } catch (err) {
    console.error('Server error fetching dashboard data:', err);
    return res.status(500).json({ error: 'Server error fetching dashboard data' });
  }
});

// Get campaign performance metrics
router.get('/campaign/:campaign_id', async (req, res) => {
  try {
    const { campaign_id } = req.params;
    
    // Get campaign data
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();
    
    if (campaignError) {
      console.error('Error fetching campaign data:', campaignError);
      return res.status(500).json({ error: campaignError.message });
    }
    
    if (!campaignData) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Get campaign metrics
    const { data: metricsData, error: metricsError } = await supabase
      .from('campaign_metrics')
      .select('*')
      .eq('campaign_id', campaign_id)
      .order('date', { ascending: false });
    
    if (metricsError) {
      console.error('Error fetching campaign metrics:', metricsError);
      return res.status(500).json({ error: metricsError.message });
    }
    
    // Calculate performance metrics
    const performance = calculateCampaignPerformance(metricsData);
    
    // Return campaign performance data
    return res.status(200).json({
      campaign: campaignData,
      metrics: metricsData,
      performance
    });
  } catch (err) {
    console.error('Server error fetching campaign performance:', err);
    return res.status(500).json({ error: 'Server error fetching campaign performance' });
  }
});

// Record campaign metrics
router.post('/metrics', async (req, res) => {
  try {
    const { campaign_id, impressions, clicks, conversions, cost, date } = req.body;
    
    // Validate input
    if (!campaign_id) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }
    
    // Create metrics in Supabase
    const { data, error } = await supabase
      .from('campaign_metrics')
      .insert({
        campaign_id,
        impressions: impressions || 0,
        clicks: clicks || 0,
        conversions: conversions || 0,
        cost: cost || 0,
        date: date || new Date().toISOString().split('T')[0]
      })
      .select();
    
    if (error) {
      console.error('Error recording campaign metrics:', error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Campaign metrics recorded successfully',
      data: data[0]
    });
  } catch (err) {
    console.error('Server error recording campaign metrics:', err);
    return res.status(500).json({ error: 'Server error recording campaign metrics' });
  }
});

// Generate optimization recommendations for a campaign
router.post('/optimize/:campaign_id', async (req, res) => {
  try {
    const { campaign_id } = req.params;
    const { user_id } = req.body;
    
    // Get campaign data
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();
    
    if (campaignError) {
      console.error('Error fetching campaign data:', campaignError);
      return res.status(500).json({ error: campaignError.message });
    }
    
    if (!campaignData) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Get campaign metrics
    const { data: metricsData, error: metricsError } = await supabase
      .from('campaign_metrics')
      .select('*')
      .eq('campaign_id', campaign_id)
      .order('date', { ascending: false })
      .limit(7); // Last 7 days of metrics
    
    if (metricsError) {
      console.error('Error fetching campaign metrics:', metricsError);
      return res.status(500).json({ error: metricsError.message });
    }
    
    // Calculate performance metrics
    const performanceMetrics = calculateCampaignPerformance(metricsData);
    
    // Generate optimization recommendations using the Campaign Optimizer agent
    const recommendations = await campaignOptimizer.optimizeCampaign(campaignData, performanceMetrics);
    
    // Create action for the optimization recommendations
    const { data: actionData, error: actionError } = await supabase
      .from('actions')
      .insert({
        company_id: campaignData.company_id,
        campaign_id,
        type: 'optimization',
        content: recommendations,
        status: 'pending'
      })
      .select();
    
    if (actionError) {
      console.error('Error creating optimization action:', actionError);
      return res.status(500).json({ error: actionError.message });
    }
    
    // Create notification in Lovable
    try {
      await lovableService.sendNotification(
        user_id,
        'Campaign Optimization',
        `New optimization recommendations are available for ${campaignData.name}`,
        `/actions/${actionData[0].id}`
      );
    } catch (lovableError) {
      console.warn('Warning: Could not send Lovable notification:', lovableError);
      // Continue execution even if Lovable integration fails
    }
    
    // Return optimization data
    return res.status(200).json({
      success: true,
      message: 'Optimization recommendations generated successfully',
      data: {
        campaign: campaignData,
        performance: performanceMetrics,
        recommendations,
        action: actionData[0]
      }
    });
  } catch (err) {
    console.error('Server error generating optimization recommendations:', err);
    return res.status(500).json({ error: 'Server error generating optimization recommendations' });
  }
});

// Helper function to calculate KPIs
function calculateKPIs(metricsData, leadsData, meetingsData) {
  // Initialize KPIs
  const kpis = {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    cost: 0,
    ctr: 0,
    conversionRate: 0,
    cpa: 0,
    leads: leadsData.length,
    qualifiedLeads: leadsData.filter(lead => lead.qualification_score >= 70).length,
    meetings: meetingsData.length,
    meetingConversionRate: 0
  };
  
  // Calculate campaign metrics totals
  metricsData.forEach(metric => {
    kpis.impressions += metric.impressions || 0;
    kpis.clicks += metric.clicks || 0;
    kpis.conversions += metric.conversions || 0;
    kpis.cost += metric.cost || 0;
  });
  
  // Calculate derived metrics
  kpis.ctr = kpis.impressions > 0 ? (kpis.clicks / kpis.impressions) : 0;
  kpis.conversionRate = kpis.clicks > 0 ? (kpis.conversions / kpis.clicks) : 0;
  kpis.cpa = kpis.conversions > 0 ? (kpis.cost / kpis.conversions) : 0;
  kpis.meetingConversionRate = kpis.qualifiedLeads > 0 ? (kpis.meetings / kpis.qualifiedLeads) : 0;
  
  return kpis;
}

// Helper function to calculate campaign performance
function calculateCampaignPerformance(metricsData) {
  // Initialize performance metrics
  const performance = {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    cost: 0,
    ctr: 0,
    conversionRate: 0,
    cpa: 0,
    dailyMetrics: []
  };
  
  // Calculate totals
  metricsData.forEach(metric => {
    performance.impressions += metric.impressions || 0;
    performance.clicks += metric.clicks || 0;
    performance.conversions += metric.conversions || 0;
    performance.cost += metric.cost || 0;
    
    // Add daily metrics for charts
    performance.dailyMetrics.push({
      date: metric.date,
      impressions: metric.impressions || 0,
      clicks: metric.clicks || 0,
      conversions: metric.conversions || 0,
      cost: metric.cost || 0
    });
  });
  
  // Calculate derived metrics
  performance.ctr = performance.impressions > 0 ? (performance.clicks / performance.impressions) : 0;
  performance.conversionRate = performance.clicks > 0 ? (performance.conversions / performance.clicks) : 0;
  performance.cpa = performance.conversions > 0 ? (performance.cost / performance.conversions) : 0;
  
  return performance;
}

module.exports = router;
