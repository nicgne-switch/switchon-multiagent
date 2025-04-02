// Database schema setup for Supabase
const supabaseSchema = {
  // Users table
  users: {
    id: 'uuid primary key',
    email: 'text unique not null',
    created_at: 'timestamp with time zone default now()',
    company_id: 'uuid references companies(id)',
    role: 'text'
  },
  
  // Companies table
  companies: {
    id: 'uuid primary key',
    name: 'text not null',
    industry: 'text',
    arr: 'numeric',
    icp: 'text',
    ticket_size: 'numeric',
    channels: 'text[]',
    created_at: 'timestamp with time zone default now()'
  },
  
  // Strategies table
  strategies: {
    id: 'uuid primary key',
    company_id: 'uuid references companies(id)',
    title: 'text not null',
    content: 'text not null',
    status: 'text default \'draft\'',
    created_at: 'timestamp with time zone default now()',
    updated_at: 'timestamp with time zone default now()'
  },
  
  // Leads table
  leads: {
    id: 'uuid primary key',
    company_id: 'uuid references companies(id)',
    name: 'text not null',
    email: 'text',
    company: 'text',
    position: 'text',
    industry: 'text',
    company_size: 'text',
    budget: 'text',
    pain_points: 'text',
    qualification_score: 'integer',
    status: 'text default \'new\'',
    created_at: 'timestamp with time zone default now()',
    updated_at: 'timestamp with time zone default now()'
  },
  
  // Campaigns table
  campaigns: {
    id: 'uuid primary key',
    company_id: 'uuid references companies(id)',
    strategy_id: 'uuid references strategies(id)',
    name: 'text not null',
    channel: 'text not null',
    target_audience: 'text',
    content: 'text',
    status: 'text default \'draft\'',
    created_at: 'timestamp with time zone default now()',
    updated_at: 'timestamp with time zone default now()'
  },
  
  // Campaign metrics table
  campaign_metrics: {
    id: 'uuid primary key',
    campaign_id: 'uuid references campaigns(id)',
    impressions: 'integer default 0',
    clicks: 'integer default 0',
    conversions: 'integer default 0',
    cost: 'numeric default 0',
    date: 'date not null',
    created_at: 'timestamp with time zone default now()'
  },
  
  // Actions table
  actions: {
    id: 'uuid primary key',
    company_id: 'uuid references companies(id)',
    campaign_id: 'uuid references campaigns(id)',
    type: 'text not null',
    content: 'text',
    status: 'text default \'pending\'',
    assigned_to: 'text',
    due_date: 'timestamp with time zone',
    created_at: 'timestamp with time zone default now()',
    updated_at: 'timestamp with time zone default now()'
  },
  
  // Meetings table
  meetings: {
    id: 'uuid primary key',
    company_id: 'uuid references companies(id)',
    lead_id: 'uuid references leads(id)',
    title: 'text not null',
    description: 'text',
    scheduled_at: 'timestamp with time zone not null',
    status: 'text default \'scheduled\'',
    created_at: 'timestamp with time zone default now()',
    updated_at: 'timestamp with time zone default now()'
  }
};

module.exports = supabaseSchema;
