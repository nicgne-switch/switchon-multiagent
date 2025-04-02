// AI Agent Base Class
class AIAgent {
  constructor(openai, config = {}) {
    this.openai = openai;
    this.config = {
      model: config.model || 'gpt-4',
      temperature: config.temperature || 0.7,
      max_tokens: config.max_tokens || 2000,
      ...config
    };
  }

  async generateCompletion(prompt, additionalParams = {}) {
    try {
      const response = await this.openai.createCompletion({
        model: this.config.model,
        prompt,
        temperature: this.config.temperature,
        max_tokens: this.config.max_tokens,
        ...additionalParams
      });
      
      return response.data.choices[0].text.trim();
    } catch (error) {
      console.error('Error generating completion:', error);
      throw error;
    }
  }
}

// Strategy Architect Agent
class StrategyArchitectAgent extends AIAgent {
  constructor(openai, config = {}) {
    super(openai, config);
    this.agentName = 'Strategy Architect';
  }

  async generateStrategy(companyData) {
    const prompt = `
    You are the Strategy Architect for SwitchON MultiAgent platform.
    
    Based on the following SaaS company data, create a comprehensive Go-To-Market strategy:
    
    Company: ${companyData.name}
    Industry: ${companyData.industry}
    Annual Recurring Revenue (ARR): ${companyData.arr}
    Ideal Customer Profile (ICP): ${companyData.icp}
    Average Ticket Size: ${companyData.ticketSize}
    Current Acquisition Channels: ${companyData.channels}
    
    Your strategy should include:
    1. Target market segments
    2. Acquisition strategy
    3. Nurturing approach
    4. Closing tactics
    5. Key performance indicators
    6. Revenue targets
    7. Timeline for implementation
    `;
    
    return this.generateCompletion(prompt);
  }
}

// Lead Qualifier Agent
class LeadQualifierAgent extends AIAgent {
  constructor(openai, config = {}) {
    super(openai, config);
    this.agentName = 'Lead Qualifier';
  }

  async qualifyLead(leadData, companyICP) {
    const prompt = `
    You are the Lead Qualifier for SwitchON MultiAgent platform.
    
    Based on the following lead data and the company's Ideal Customer Profile (ICP), 
    evaluate the lead's qualification score from 0-100:
    
    Lead Data:
    Name: ${leadData.name}
    Company: ${leadData.company}
    Position: ${leadData.position}
    Industry: ${leadData.industry}
    Company Size: ${leadData.companySize}
    Budget: ${leadData.budget}
    Pain Points: ${leadData.painPoints}
    
    Company's ICP:
    ${companyICP}
    
    Provide a qualification score and detailed reasoning for your assessment.
    `;
    
    return this.generateCompletion(prompt);
  }
}

// Outreach Creator Agent
class OutreachCreatorAgent extends AIAgent {
  constructor(openai, config = {}) {
    super(openai, config);
    this.agentName = 'Outreach Creator';
  }

  async createOutreachContent(channel, leadData, strategy) {
    const prompt = `
    You are the Outreach Creator for SwitchON MultiAgent platform.
    
    Create personalized outreach content for the following channel: ${channel}
    
    Lead Information:
    Name: ${leadData.name}
    Company: ${leadData.company}
    Position: ${leadData.position}
    Industry: ${leadData.industry}
    Pain Points: ${leadData.painPoints}
    
    Strategy Context:
    ${strategy}
    
    Create compelling, personalized outreach content that aligns with our strategy and addresses the lead's specific pain points.
    `;
    
    return this.generateCompletion(prompt);
  }
}

// Campaign Optimizer Agent
class CampaignOptimizerAgent extends AIAgent {
  constructor(openai, config = {}) {
    super(openai, config);
    this.agentName = 'Campaign Optimizer';
  }

  async optimizeCampaign(campaignData, performanceMetrics) {
    const prompt = `
    You are the Campaign Optimizer for SwitchON MultiAgent platform.
    
    Analyze the following campaign performance data and provide optimization recommendations:
    
    Campaign Information:
    Name: ${campaignData.name}
    Channel: ${campaignData.channel}
    Target Audience: ${campaignData.targetAudience}
    Content: ${campaignData.content}
    
    Performance Metrics:
    Impressions: ${performanceMetrics.impressions}
    Click-through Rate: ${performanceMetrics.ctr}
    Conversion Rate: ${performanceMetrics.conversionRate}
    Cost per Acquisition: ${performanceMetrics.cpa}
    
    Provide specific recommendations to improve campaign performance, including:
    1. Content adjustments
    2. Audience targeting refinements
    3. Channel optimization
    4. A/B testing suggestions
    `;
    
    return this.generateCompletion(prompt);
  }
}

module.exports = {
  AIAgent,
  StrategyArchitectAgent,
  LeadQualifierAgent,
  OutreachCreatorAgent,
  CampaignOptimizerAgent
};
