// Analytics and KPI tracking frontend for SwitchON MultiAgent platform
document.addEventListener('DOMContentLoaded', function() {
    // Get company ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get('company');
    const userId = localStorage.getItem('userId') || 'default_user'; // In production, get from auth
    
    const apiBaseUrl = '/api'; // Update with actual API URL in production
    
    // Elements
    const loadingIndicator = document.getElementById('loading-indicator');
    const timePeriod = document.getElementById('time-period');
    const campaignsTableBody = document.getElementById('campaigns-table-body');
    const optimizeAllBtn = document.getElementById('optimize-all-btn');
    const campaignDetailModal = new bootstrap.Modal(document.getElementById('campaignDetailModal'));
    const optimizeCampaignBtn = document.getElementById('optimize-campaign-btn');
    
    // Charts
    let leadsChart;
    let campaignChart;
    let channelChart;
    
    // Current selected campaign for optimization
    let selectedCampaignId;
    
    // Initialize page
    init();
    
    // Initialize function
    async function init() {
        if (!companyId) {
            showError('No company ID provided. Please go back to the dashboard.');
            return;
        }
        
        // Load dashboard data
        await loadDashboardData();
        
        // Set up event listeners
        if (timePeriod) {
            timePeriod.addEventListener('change', loadDashboardData);
        }
        
        if (optimizeAllBtn) {
            optimizeAllBtn.addEventListener('click', optimizeAllCampaigns);
        }
        
        if (optimizeCampaignBtn) {
            optimizeCampaignBtn.addEventListener('click', optimizeSelectedCampaign);
        }
    }
    
    // Load dashboard data
    async function loadDashboardData() {
        try {
            showLoading(true);
            
            const period = timePeriod.value;
            
            const response = await fetch(`${apiBaseUrl}/analytics/dashboard/${companyId}?period=${period}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error loading dashboard data');
            }
            
            // Update KPI cards
            updateKPICards(result.kpis);
            
            // Update charts
            updateCharts(result);
            
            // Update campaigns table
            updateCampaignsTable(result.metrics.campaigns);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showError('Failed to load dashboard data. Please try again.');
        } finally {
            showLoading(false);
        }
    }
    
    // Update KPI cards with data
    function updateKPICards(kpis) {
        document.getElementById('leads-value').textContent = kpis.leads;
        document.getElementById('qualified-leads-value').textContent = kpis.qualifiedLeads;
        document.getElementById('meetings-value').textContent = kpis.meetings;
        document.getElementById('cpa-value').textContent = `$${kpis.cpa.toFixed(2)}`;
        
        const qualificationRate = kpis.leads > 0 ? (kpis.qualifiedLeads / kpis.leads * 100).toFixed(1) : 0;
        document.getElementById('qualification-rate').textContent = `${qualificationRate}%`;
        
        const meetingConversionRate = (kpis.meetingConversionRate * 100).toFixed(1);
        document.getElementById('meeting-conversion-rate').textContent = `${meetingConversionRate}%`;
        
        document.getElementById('total-cost').textContent = kpis.cost.toFixed(2);
    }
    
    // Update charts with data
    function updateCharts(data) {
        updateLeadsChart(data);
        updateCampaignChart(data);
        updateChannelChart(data);
    }
    
    // Update leads chart
    function updateLeadsChart(data) {
        // Group leads by date
        const leadsByDate = {};
        const qualifiedLeadsByDate = {};
        
        data.metrics.leads.forEach(lead => {
            const date = new Date(lead.created_at).toLocaleDateString();
            leadsByDate[date] = (leadsByDate[date] || 0) + 1;
            
            if (lead.qualification_score >= 70) {
                qualifiedLeadsByDate[date] = (qualifiedLeadsByDate[date] || 0) + 1;
            }
        });
        
        // Get unique dates and sort them
        const dates = Object.keys(leadsByDate).sort((a, b) => new Date(a) - new Date(b));
        
        // Prepare chart data
        const leadsData = dates.map(date => leadsByDate[date] || 0);
        const qualifiedLeadsData = dates.map(date => qualifiedLeadsByDate[date] || 0);
        
        // Create or update chart
        const ctx = document.getElementById('leads-chart').getContext('2d');
        
        if (leadsChart) {
            leadsChart.data.labels = dates;
            leadsChart.data.datasets[0].data = leadsData;
            leadsChart.data.datasets[1].data = qualifiedLeadsData;
            leadsChart.update();
        } else {
            leadsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'Total Leads',
                            data: leadsData,
                            borderColor: '#4F46E5',
                            backgroundColor: 'rgba(79, 70, 229, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Qualified Leads',
                            data: qualifiedLeadsData,
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Update campaign chart
    function updateCampaignChart(data) {
        // Group metrics by campaign
        const campaignMetrics = {};
        
        data.metrics.campaigns.forEach(metric => {
            const campaignName = metric.campaigns?.name || 'Unknown';
            
            if (!campaignMetrics[campaignName]) {
                campaignMetrics[campaignName] = {
                    impressions: 0,
                    clicks: 0,
                    conversions: 0
                };
            }
            
            campaignMetrics[campaignName].impressions += metric.impressions || 0;
            campaignMetrics[campaignName].clicks += metric.clicks || 0;
            campaignMetrics[campaignName].conversions += metric.conversions || 0;
        });
        
        // Get campaign names and prepare data
        const campaignNames = Object.keys(campaignMetrics);
        const impressionsData = campaignNames.map(name => campaignMetrics[name].impressions);
        const clicksData = campaignNames.map(name => campaignMetrics[name].clicks);
        const conversionsData = campaignNames.map(name => campaignMetrics[name].conversions);
        
        // Create or update chart
        const ctx = document.getElementById('campaign-chart').getContext('2d');
        
        if (campaignChart) {
            campaignChart.data.labels = campaignNames;
            campaignChart.data.datasets[0].data = impressionsData;
            campaignChart.data.datasets[1].data = clicksData;
            campaignChart.data.datasets[2].data = conversionsData;
            campaignChart.update();
        } else {
            campaignChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: campaignNames,
                    datasets: [
                        {
                            label: 'Impressions',
                            data: impressionsData,
                            backgroundColor: 'rgba(79, 70, 229, 0.7)',
                            borderColor: 'rgba(79, 70, 229, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Clicks',
                            data: clicksData,
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderColor: 'rgba(16, 185, 129, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Conversions',
                            data: conversionsData,
                            backgroundColor: 'rgba(245, 158, 11, 0.7)',
                            borderColor: 'rgba(245, 158, 11, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Update channel chart
    function updateChannelChart(data) {
        // Group metrics by channel
        const channelMetrics = {};
        
        data.metrics.campaigns.forEach(metric => {
            const channel = metric.campaigns?.channel || 'Unknown';
            
            if (!channelMetrics[channel]) {
                channelMetrics[channel] = {
                    impressions: 0,
                    clicks: 0,
                    conversions: 0,
                    cost: 0
                };
            }
            
            channelMetrics[channel].impressions += metric.impressions || 0;
            channelMetrics[channel].clicks += metric.clicks || 0;
            channelMetrics[channel].conversions += metric.conversions || 0;
            channelMetrics[channel].cost += metric.cost || 0;
        });
        
        // Calculate CTR and conversion rate for each channel
        const channels = Object.keys(channelMetrics);
        const ctrData = channels.map(channel => {
            const metrics = channelMetrics[channel];
            return metrics.impressions > 0 ? (metrics.clicks / metrics.impressions * 100).toFixed(2) : 0;
        });
        
        const convRateData = channels.map(channel => {
            const metrics = channelMetrics[channel];
            return metrics.clicks > 0 ? (metrics.conversions / metrics.clicks * 100).toFixed(2) : 0;
        });
        
        const cpaData = channels.map(channel => {
            const metrics = channelMetrics[channel];
            return metrics.conversions > 0 ? (metrics.cost / metrics.conversions).toFixed(2) : 0;
        });
        
        // Create or update chart
        const ctx = document.getElementById('channel-chart').getContext('2d');
        
        if (channelChart) {
            channelChart.data.labels = channels;
            channelChart.data.datasets[0].data = ctrData;
            channelChart.data.datasets[1].data = convRateData;
            channelChart.data.datasets[2].data = cpaData;
            channelChart.update();
        } else {
            channelChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: channels,
                    datasets: [
                        {
                            label: 'CTR (%)',
                            data: ctrData,
                            backgroundColor: 'rgba(79, 70, 229, 0.2)',
                            borderColor: 'rgba(79, 70, 229, 1)',
                            pointBackgroundColor: 'rgba(79, 70, 229, 1)',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: 'rgba(79, 70, 229, 1)'
                        },
                        {
                            label: 'Conversion Rate (%)',
                            data: convRateData,
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            borderColor: 'rgba(16, 185, 129, 1)',
                            pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: 'rgba(16, 185, 129, 1)'
                        },
                        {
                            label: 'CPA ($)',
                            data: cpaData,
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            borderColor: 'rgba(245, 158, 11, 1)',
                            pointBackgroundColor: 'rgba(245, 158, 11, 1)',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: 'rgba(245, 158, 11, 1)'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed !== null) {
                                        label += context.parsed;
                                        if (context.dataset.label.includes('CPA')) {
                                            label = label + ' $';
                                        } else {
                                            label = label + ' %';
                                        }
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }
    
    // Update campaigns table
    function updateCampaignsTable(campaignsMetrics) {
        if (!campaignsTableBody) return;
        
        // Group metrics by campaign
        const campaignData = {};
        
        campaignsMetrics.forEach(metric => {
            const campaignId = metric.campaign
(Content truncated due to size limit. Use line ranges to read in chunks)