// Sample n8n workflow configurations for SwitchON MultiAgent platform

// This file contains sample workflow definitions that can be imported into n8n

const workflows = {
  // Strategy Generation Workflow
  strategyGeneration: {
    name: "Strategy Generation Workflow",
    nodes: [
      {
        type: "webhook",
        name: "Strategy Request",
        parameters: {
          path: "/generate-strategy",
          responseMode: "onReceived",
          responseData: "firstEntryJson"
        }
      },
      {
        type: "function",
        name: "Prepare Data",
        parameters: {
          functionCode: `
            // Extract company data from webhook
            const companyData = $input.first().json;
            return {json: companyData};
          `
        }
      },
      {
        type: "httpRequest",
        name: "Call Strategy Architect API",
        parameters: {
          url: "={{$env.BACKEND_URL}}/api/ai-agents/strategy-architect",
          method: "POST",
          authentication: "headerAuth",
          headerAuthKey: "x-api-key",
          headerAuthValue: "={{$env.API_KEY}}",
          bodyParametersJson: "={{ $json }}"
        }
      },
      {
        type: "supabase",
        name: "Save Strategy to Database",
        parameters: {
          operation: "insert",
          table: "strategies",
          additionalFields: {
            company_id: "={{ $json.company_id }}",
            title: "={{ $json.title }}",
            content: "={{ $json.content }}",
            status: "draft"
          }
        }
      },
      {
        type: "httpRequest",
        name: "Notify User",
        parameters: {
          url: "={{$env.LOVABLE_API_URL}}/notifications",
          method: "POST",
          authentication: "headerAuth",
          headerAuthKey: "x-api-key",
          headerAuthValue: "={{$env.LOVABLE_API_KEY}}",
          bodyParametersJson: `{
            "user_id": "={{ $json.user_id }}",
            "title": "Strategy Generated",
            "message": "A new strategy has been generated for your review.",
            "link": "/strategies/{{ $json.id }}"
          }`
        }
      }
    ]
  },
  
  // Lead Qualification Workflow
  leadQualification: {
    name: "Lead Qualification Workflow",
    nodes: [
      {
        type: "webhook",
        name: "New Lead",
        parameters: {
          path: "/qualify-lead",
          responseMode: "onReceived",
          responseData: "firstEntryJson"
        }
      },
      {
        type: "supabase",
        name: "Get Company ICP",
        parameters: {
          operation: "select",
          table: "companies",
          additionalFields: {
            columns: "icp",
            where: {
              id: "={{ $json.company_id }}"
            }
          }
        }
      },
      {
        type: "httpRequest",
        name: "Call Lead Qualifier API",
        parameters: {
          url: "={{$env.BACKEND_URL}}/api/ai-agents/lead-qualifier",
          method: "POST",
          authentication: "headerAuth",
          headerAuthKey: "x-api-key",
          headerAuthValue: "={{$env.API_KEY}}",
          bodyParametersJson: `{
            "leadData": {{ $json }},
            "companyICP": "={{ $node['Get Company ICP'].json.icp }}"
          }`
        }
      },
      {
        type: "supabase",
        name: "Update Lead Score",
        parameters: {
          operation: "update",
          table: "leads",
          additionalFields: {
            id: "={{ $json.id }}",
            qualification_score: "={{ $json.score }}",
            status: "={{ $json.score > 70 ? 'qualified' : 'disqualified' }}"
          }
        }
      },
      {
        type: "if",
        name: "Check Score",
        parameters: {
          condition: "={{ $json.score > 70 }}"
        }
      },
      {
        type: "httpRequest",
        name: "Create Outreach Task",
        parameters: {
          url: "={{$env.BACKEND_URL}}/api/actions",
          method: "POST",
          authentication: "headerAuth",
          headerAuthKey: "x-api-key",
          headerAuthValue: "={{$env.API_KEY}}",
          bodyParametersJson: `{
            "company_id": "={{ $json.company_id }}",
            "type": "outreach",
            "content": "Reach out to qualified lead: {{ $json.name }} from {{ $json.company }}",
            "status": "pending",
            "due_date": "={{ $today.plusDays(2).toISOString() }}"
          }`
        }
      }
    ]
  },
  
  // Content Generation Workflow
  contentGeneration: {
    name: "Content Generation Workflow",
    nodes: [
      {
        type: "webhook",
        name: "Content Request",
        parameters: {
          path: "/generate-content",
          responseMode: "onReceived",
          responseData: "firstEntryJson"
        }
      },
      {
        type: "supabase",
        name: "Get Lead Data",
        parameters: {
          operation: "select",
          table: "leads",
          additionalFields: {
            columns: "*",
            where: {
              id: "={{ $json.lead_id }}"
            }
          }
        }
      },
      {
        type: "supabase",
        name: "Get Strategy",
        parameters: {
          operation: "select",
          table: "strategies",
          additionalFields: {
            columns: "content",
            where: {
              company_id: "={{ $json.company_id }}",
              status: "active"
            },
            orderBy: {
              created_at: "DESC"
            },
            limit: 1
          }
        }
      },
      {
        type: "httpRequest",
        name: "Call Outreach Creator API",
        parameters: {
          url: "={{$env.BACKEND_URL}}/api/ai-agents/outreach-creator",
          method: "POST",
          authentication: "headerAuth",
          headerAuthKey: "x-api-key",
          headerAuthValue: "={{$env.API_KEY}}",
          bodyParametersJson: `{
            "channel": "={{ $json.channel }}",
            "leadData": {{ $node['Get Lead Data'].json }},
            "strategy": "={{ $node['Get Strategy'].json.content }}"
          }`
        }
      },
      {
        type: "supabase",
        name: "Save Content",
        parameters: {
          operation: "insert",
          table: "campaigns",
          additionalFields: {
            company_id: "={{ $json.company_id }}",
            strategy_id: "={{ $node['Get Strategy'].json.id }}",
            name: "={{ 'Outreach to ' + $node['Get Lead Data'].json.name }}",
            channel: "={{ $json.channel }}",
            target_audience: "={{ $node['Get Lead Data'].json.name }}",
            content: "={{ $json.content }}",
            status: "draft"
          }
        }
      },
      {
        type: "httpRequest",
        name: "Notify User",
        parameters: {
          url: "={{$env.LOVABLE_API_URL}}/notifications",
          method: "POST",
          authentication: "headerAuth",
          headerAuthKey: "x-api-key",
          headerAuthValue: "={{$env.LOVABLE_API_KEY}}",
          bodyParametersJson: `{
            "user_id": "={{ $json.user_id }}",
            "title": "Content Generated",
            "message": "New outreach content has been generated for your review.",
            "link": "/campaigns/{{ $json.id }}"
          }`
        }
      }
    ]
  },
  
  // Campaign Optimization Workflow
  campaignOptimization: {
    name: "Campaign Optimization Workflow",
    nodes: [
      {
        type: "cron",
        name: "Weekly Optimization",
        parameters: {
          rule: "0 0 * * 1" // Every Monday at midnight
        }
      },
      {
        type: "supabase",
        name: "Get Active Campaigns",
        parameters: {
          operation: "select",
          table: "campaigns",
          additionalFields: {
            columns: "*",
            where: {
              status: "active"
            }
          }
        }
      },
      {
        type: "function",
        name: "Process Campaigns",
        parameters: {
          functionCode: `
            // Process each campaign
            const items = [];
            for (const campaign of $input.first().json) {
              items.push({json: campaign});
            }
            return items;
          `
        }
      },
      {
        type: "supabase",
        name: "Get Campaign Metrics",
        parameters: {
          operation: "select",
          table: "campaign_metrics",
          additionalFields: {
            columns: "*",
            where: {
              campaign_id: "={{ $json.id }}"
            },
            orderBy: {
              date: "DESC"
            },
            limit: 7 // Last week's metrics
          }
        }
      },
      {
        type: "function",
        name: "Calculate Performance",
        parameters: {
          functionCode: `
            // Calculate performance metrics
            const metrics = $input.first().json;
            
            let totalImpressions = 0;
            let totalClicks = 0;
            let totalConversions = 0;
            let totalCost = 0;
            
            metrics.forEach(m => {
              totalImpressions += m.impressions;
              totalClicks += m.clicks;
              totalConversions += m.conversions;
              totalCost += m.cost;
            });
            
            const ctr = totalClicks / totalImpressions || 0;
            const conversionRate = totalConversions / totalClicks || 0;
            const cpa = totalCost / totalConversions || 0;
            
            return {
              json: {
                campaignData: $json,
                performanceMetrics: {
                  impressions: totalImpressions,
                  ctr: ctr.toFixed(4),
                  conversionRate: conversionRate.toFixed(4),
                  cpa: cpa.toFixed(2)
                }
              }
            };
          `
        }
      },
      {
        type: "httpRequest",
        name: "Call Campaign Optimizer API",
        parameters: {
          url: "={{$env.BACKEND_URL}}/api/ai-agents/campaign-optimizer",
          method: "POST",
          authentication: "headerAuth",
          headerAuthKey: "x-api-key",
          headerAuthValue: "={{$env.API_KEY}}",
          bodyParametersJson: "={{ $json }}"
        }
      },
      {
        type: "supabase",
        name: "Save Optimization",
        parameters: {
          operation: "insert",
          table: "actions",
          additionalFields: {
            company_id: "={{ $json.campaignData.company_id }}",
            campaign_id: "={{ $json.campaignData.id }}",
            type: "optimization",
            content: "={{ $json.recommendations }}",
            status: "pending"
          }
        }
      },
      {
        type: "httpRequest",
        name: "Notify User",
        parameters: {
          url: "={{$env.LOVABLE_API_URL}}/notifications",
          method: "POST",
          authentication: "headerAuth",
          headerAuthKey: "x-api-key",
          headerAuthValue: "={{$env.LOVABLE_API_KEY}}",
          bodyParametersJson: `{
            "user_id": "={{ $json.user_id }}",
            "title": "Campaign Optimization",
            "message": "New optimization recommendations are available for your campaign.",
            "link": "/actions/{{ $json.id }}"
          }`
        }
      }
    ]
  }
};

module.exports = workflows;
