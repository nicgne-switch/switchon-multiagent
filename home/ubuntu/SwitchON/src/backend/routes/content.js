// Content generation API routes for SwitchON MultiAgent platform
const express = require('express');
const router = express.Router();
const { supabase, openai } = require('../server');
const { OutreachCreatorAgent } = require('../../ai-agents/agents');
const LovableService = require('../services/lovable');

// Initialize services
const lovableService = new LovableService();
const outreachCreator = new OutreachCreatorAgent(openai);

// Generate content for a specific channel and lead
router.post('/generate', async (req, res) => {
  try {
    const { company_id, lead_id, channel, user_id } = req.body;

    // Validate input
    if (!company_id || !lead_id || !channel) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Fetch lead data from Supabase
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError) {
      console.error('Error fetching lead data:', leadError);
      return res.status(500).json({ error: leadError.message });
    }

    if (!leadData) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Fetch active strategy for the company
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('company_id', company_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (strategyError && strategyError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error fetching strategy:', strategyError);
      return res.status(500).json({ error: strategyError.message });
    }

    if (!strategyData) {
      return res.status(404).json({ error: 'No active strategy found for this company' });
    }

    // Generate content using the Outreach Creator agent
    const content = await outreachCreator.createOutreachContent(
      channel, 
      leadData, 
      strategyData.content
    );

    // Create campaign name based on lead and channel
    const campaignName = `${channel.charAt(0).toUpperCase() + channel.slice(1)} outreach to ${leadData.name}`;

    // Save campaign to Supabase
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        company_id,
        strategy_id: strategyData.id,
        name: campaignName,
        channel,
        target_audience: leadData.name,
        content,
        status: 'draft'
      })
      .select();

    if (campaignError) {
      console.error('Error saving campaign:', campaignError);
      return res.status(500).json({ error: campaignError.message });
    }

    // Create notification in Lovable
    try {
      await lovableService.sendNotification(
        user_id,
        'Content Generated',
        `New ${channel} content has been generated for ${leadData.name}`,
        `/campaigns/${campaignData[0].id}`
      );
    } catch (lovableError) {
      console.warn('Warning: Could not send Lovable notification:', lovableError);
      // Continue execution even if Lovable integration fails
    }

    // Return the created campaign
    return res.status(201).json({
      success: true,
      message: 'Content generated successfully',
      data: campaignData[0]
    });
  } catch (err) {
    console.error('Server error generating content:', err);
    return res.status(500).json({ error: 'Server error generating content' });
  }
});

// Get campaign by ID
router.get('/campaign/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching campaign:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('Server error fetching campaign:', err);
    return res.status(500).json({ error: 'Server error fetching campaign' });
  }
});

// Get all campaigns for a company
router.get('/company/:company_id', async (req, res) => {
  try {
    const { company_id } = req.params;
    const { channel } = req.query;

    let query = supabase
      .from('campaigns')
      .select('*')
      .eq('company_id', company_id);
    
    // Filter by channel if provided
    if (channel) {
      query = query.eq('channel', channel);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('Server error fetching campaigns:', err);
    return res.status(500).json({ error: 'Server error fetching campaigns' });
  }
});

// Update campaign status
router.put('/campaign/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['draft', 'active', 'paused', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const { data, error } = await supabase
      .from('campaigns')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating campaign status:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Campaign status updated successfully',
      data: data[0]
    });
  } catch (err) {
    console.error('Server error updating campaign status:', err);
    return res.status(500).json({ error: 'Server error updating campaign status' });
  }
});

// Update campaign content
router.put('/campaign/:id/content', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, name } = req.body;

    // Validate input
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const updates = { 
      content, 
      updated_at: new Date() 
    };

    // Only update name if provided
    if (name) {
      updates.name = name;
    }

    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating campaign content:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Campaign content updated successfully',
      data: data[0]
    });
  } catch (err) {
    console.error('Server error updating campaign content:', err);
    return res.status(500).json({ error: 'Server error updating campaign content' });
  }
});

// Get content templates by channel
router.get('/templates/:channel', async (req, res) => {
  try {
    const { channel } = req.params;

    // In a real implementation, these would be fetched from the database
    // For now, we'll return some hardcoded templates
    const templates = {
      email: [
        {
          id: 'email-1',
          name: 'Problem-Solution Email',
          template: `Subject: Solve [Pain Point] with [Solution]

Hi {{lead.name}},

I noticed that {{lead.company}} might be experiencing [specific pain point based on research].

At [Your Company], we've helped companies like {{lead.company}} achieve [specific result] by [brief solution description].

Would you be open to a quick 15-minute call to discuss how we might be able to help {{lead.company}} with [pain point]?

Best regards,
[Your Name]`
        },
        {
          id: 'email-2',
          name: 'Value Proposition Email',
          template: `Subject: [Specific Value] for {{lead.company}}

Hi {{lead.name}},

I'm reaching out because we've helped [similar companies] achieve [specific metric improvement] through our [product/service].

Given your role at {{lead.company}}, I thought you might be interested in how we could help you:

1. [Benefit 1]
2. [Benefit 2]
3. [Benefit 3]

I'd love to share some specific ideas for {{lead.company}}. Would you be available for a brief call next week?

Best regards,
[Your Name]`
        }
      ],
      linkedin: [
        {
          id: 'linkedin-1',
          name: 'Connection Request',
          template: `Hi {{lead.name}},

I came across your profile and was impressed by your work at {{lead.company}}. I'd love to connect and learn more about your experience in [industry/role].

[Brief personalized note based on their profile]

Looking forward to connecting!`
        },
        {
          id: 'linkedin-2',
          name: 'Follow-up Message',
          template: `Hi {{lead.name}},

Thanks for connecting! I noticed that {{lead.company}} is [observation from research].

At [Your Company], we specialize in helping companies like yours with [value proposition].

Would you be interested in a quick conversation about how we might be able to help {{lead.company}} with [specific challenge]?

Best regards,
[Your Name]`
        }
      ],
      sms: [
        {
          id: 'sms-1',
          name: 'Event Invitation',
          template: `Hi {{lead.name}}, this is [Your Name] from [Your Company]. We're hosting a webinar on [topic] that I thought might interest you given your work at {{lead.company}}. Would you like me to send you the details?`
        },
        {
          id: 'sms-2',
          name: 'Quick Follow-up',
          template: `Hi {{lead.name}}, just following up on our conversation about [topic]. I have some insights specific to {{lead.company}} that I'd love to share. When would be a good time to connect?`
        }
      ]
    };

    // Return templates for the requested channel
    if (templates[channel]) {
      return res.status(200).json({ data: templates[channel] });
    } else {
      return res.status(404).json({ error: 'No templates found for this channel' });
    }
  } catch (err) {
    console.error('Server error fetching templates:', err);
    return res.status(500).json({ error: 'Server error fetching templates' });
  }
});

module.exports = router;
