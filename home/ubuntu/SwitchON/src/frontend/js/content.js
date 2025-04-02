// Content generation and management frontend for SwitchON MultiAgent platform
document.addEventListener('DOMContentLoaded', function() {
    // Get company ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get('company');
    const userId = localStorage.getItem('userId') || 'default_user'; // In production, get from auth
    
    const apiBaseUrl = '/api'; // Update with actual API URL in production
    
    // Elements
    const contentContainer = document.getElementById('content-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const createContentBtn = document.getElementById('create-content-btn');
    const campaignList = document.getElementById('campaign-list');
    const channelFilter = document.getElementById('channel-filter');
    const createContentModal = new bootstrap.Modal(document.getElementById('createContentModal'));
    const createContentForm = document.getElementById('create-content-form');
    const leadSelect = document.getElementById('lead-select');
    const channelSelect = document.getElementById('channel-select');
    const templatesContainer = document.getElementById('templates-container');
    const templatesRow = document.getElementById('templates-row');
    
    // Initialize page
    init();
    
    // Initialize function
    async function init() {
        if (!companyId) {
            showError('No company ID provided. Please go back to the dashboard.');
            return;
        }
        
        // Load existing campaigns
        await loadCampaigns();
        
        // Load leads for the company
        await loadLeads();
        
        // Set up event listeners
        if (createContentBtn) {
            createContentBtn.addEventListener('click', openCreateContentModal);
        }
        
        if (channelFilter) {
            channelFilter.addEventListener('change', filterCampaigns);
        }
        
        if (channelSelect) {
            channelSelect.addEventListener('change', loadTemplates);
        }
        
        if (createContentForm) {
            createContentForm.addEventListener('submit', handleContentGeneration);
        }
    }
    
    // Load existing campaigns
    async function loadCampaigns() {
        try {
            showLoading(true);
            
            const response = await fetch(`${apiBaseUrl}/content/company/${companyId}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error loading campaigns');
            }
            
            // Store campaigns in global variable for filtering
            window.campaigns = result.data;
            
            // Display campaigns
            displayCampaigns(result.data);
            
        } catch (error) {
            console.error('Error loading campaigns:', error);
            showError('Failed to load campaigns. Please try again.');
        } finally {
            showLoading(false);
        }
    }
    
    // Load leads for the company
    async function loadLeads() {
        try {
            const response = await fetch(`${apiBaseUrl}/onboarding/company/${companyId}/leads`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error loading leads');
            }
            
            // Populate lead select
            leadSelect.innerHTML = '<option value="" selected disabled>Choose a lead</option>';
            
            result.data.forEach(lead => {
                const option = document.createElement('option');
                option.value = lead.id;
                option.textContent = `${lead.name} - ${lead.company}`;
                leadSelect.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error loading leads:', error);
            // Add a default option if leads can't be loaded
            leadSelect.innerHTML = '<option value="sample_lead">Sample Lead</option>';
        }
    }
    
    // Load templates for selected channel
    async function loadTemplates() {
        const channel = channelSelect.value;
        
        if (!channel) {
            templatesContainer.style.display = 'none';
            return;
        }
        
        try {
            const response = await fetch(`${apiBaseUrl}/content/templates/${channel}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error loading templates');
            }
            
            // Display templates
            templatesRow.innerHTML = '';
            
            result.data.forEach(template => {
                const templateCard = document.createElement('div');
                templateCard.className = 'col-md-6 mb-3';
                templateCard.innerHTML = `
                    <div class="card template-card" data-id="${template.id}" data-template="${encodeURIComponent(template.template)}">
                        <div class="card-body">
                            <h5 class="card-title">${template.name}</h5>
                            <p class="card-text text-muted">${template.template.substring(0, 100)}...</p>
                        </div>
                    </div>
                `;
                
                templatesRow.appendChild(templateCard);
                
                // Add event listener to select template
                templateCard.querySelector('.template-card').addEventListener('click', function() {
                    // Toggle selected class
                    document.querySelectorAll('.template-card').forEach(card => {
                        card.classList.remove('selected');
                    });
                    this.classList.add('selected');
                });
            });
            
            templatesContainer.style.display = 'block';
            
        } catch (error) {
            console.error('Error loading templates:', error);
            templatesContainer.style.display = 'none';
        }
    }
    
    // Display campaigns in the list
    function displayCampaigns(campaigns) {
        if (!campaignList) return;
        
        campaignList.innerHTML = '';
        
        if (campaigns.length === 0) {
            campaignList.innerHTML = '<div class="alert alert-info">No campaigns found. Create your first content!</div>';
            return;
        }
        
        campaigns.forEach(campaign => {
            const statusBadge = getStatusBadge(campaign.status);
            const channelBadge = getChannelBadge(campaign.channel);
            const date = new Date(campaign.created_at).toLocaleDateString();
            
            const campaignItem = document.createElement('div');
            campaignItem.className = 'campaign-item card mb-3';
            campaignItem.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="card-title">${campaign.name}</h5>
                        ${statusBadge}
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        ${channelBadge}
                        <small class="text-muted">${date}</small>
                    </div>
                    <div class="d-flex justify-content-end mt-2">
                        <button class="btn btn-outline-primary btn-sm view-campaign" data-id="${campaign.id}">View Content</button>
                    </div>
                </div>
            `;
            
            campaignList.appendChild(campaignItem);
            
            // Add event listener to view button
            campaignItem.querySelector('.view-campaign').addEventListener('click', () => {
                viewCampaign(campaign.id);
            });
        });
    }
    
    // Filter campaigns by channel
    function filterCampaigns() {
        const channel = channelFilter.value;
        
        if (!window.campaigns) return;
        
        let filteredCampaigns = window.campaigns;
        
        if (channel) {
            filteredCampaigns = window.campaigns.filter(campaign => campaign.channel === channel);
        }
        
        displayCampaigns(filteredCampaigns);
    }
    
    // Generate status badge HTML
    function getStatusBadge(status) {
        let badgeClass = '';
        let badgeText = status.charAt(0).toUpperCase() + status.slice(1);
        
        switch (status) {
            case 'draft':
                badgeClass = 'bg-secondary';
                break;
            case 'active':
                badgeClass = 'bg-success';
                break;
            case 'paused':
                badgeClass = 'bg-warning';
                break;
            case 'completed':
                badgeClass = 'bg-info';
                break;
            default:
                badgeClass = 'bg-secondary';
        }
        
        return `<span class="badge ${badgeClass}">${badgeText}</span>`;
    }
    
    // Generate channel badge HTML
    function getChannelBadge(channel) {
        let channelClass = '';
        let channelText = channel.charAt(0).toUpperCase() + channel.slice(1);
        
        switch (channel) {
            case 'email':
                channelClass = 'channel-email';
                break;
            case 'linkedin':
                channelClass = 'channel-linkedin';
                break;
            case 'sms':
                channelClass = 'channel-sms';
                break;
            case 'ads':
                channelClass = 'channel-ads';
                break;
            default:
                channelClass = '';
        }
        
        return `<span class="channel-badge ${channelClass}">${channelText}</span>`;
    }
    
    // View campaign details
    async function viewCampaign(campaignId) {
        try {
            showLoading(true);
            
            const response = await fetch(`${apiBaseUrl}/content/campaign/${campaignId}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error loading campaign');
            }
            
            // Display campaign details
            displayCampaignDetails(result.data);
            
        } catch (error) {
            console.error('Error viewing campaign:', error);
            showError('Failed to load campaign details. Please try again.');
        } finally {
            showLoading(false);
        }
    }
    
    // Display campaign details
    function displayCampaignDetails(campaign) {
        if (!contentContainer) return;
        
        const statusBadge = getStatusBadge(campaign.status);
        const channelBadge = getChannelBadge(campaign.channel);
        const date = new Date(campaign.created_at).toLocaleDateString();
        
        contentContainer.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h3>${campaign.name}</h3>
                    ${statusBadge}
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        ${channelBadge}
                        <p class="text-muted mb-0">Created on ${date}</p>
                    </div>
                    <h5>Content Preview:</h5>
                    <div class="content-preview">
                        ${campaign.content}
                    </div>
                </div>
                <div class="card-footer d-flex justify-content-between">
                    <button class="btn btn-secondary" id="back-to-list">Back to List</button>
                    <div>
                        ${campaign.status === 'draft' ? 
                            `<button class="btn btn-success me-2" id="activate-campaign" data-id="${campaign.id}">Activate Campaign</button>` : 
                            ''}
                        <button class="btn btn-primary" id="edit-campaign" data-id="${campaign.id}">Edit Content</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('back-to-list').addEventListener('click', () => {
            contentContainer.innerHTML = '';
            loadCampaigns();
        });
        
        const activateButton = document.getElementById('activate-campaign');
        if (activateButton) {
            activateButton.addEventListener('click', () => {
                activateCampaign(campaign.id);
            });
        }
        
        document.getElementById('edit-campaign').addEventListener('click', () => {
            editCampaign(campaign);
        });
    }
    
    // Open create content modal
    function openCreateContentModal() {
        // Reset form
        createContentForm.reset();
        templatesContainer.style.display = 'none';
        
        // Show modal
        createContentModal.show();
    }
    
    // Handle content generation form submission
    async function handleContentGeneration(e) {
        e.preventDefault();
        
        const leadId = leadSelect.value;
        const channel = channelSelect.value;
        
        // Validate input
        if (!leadId || !channel) {
            showError('Please select a lead and channel.');
            return;
        }
        
        try {
            showLoading(true);
            createContentModal.hide();
            
            const response = await fetch(`${apiBaseUrl}/content/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    company_id: companyId,
                    lead_id: leadId,
                    channel,
                    user_id: userId
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error generating content');
            }
            
            // Show success message
            alert('Content generated successfully!');
            
            // View the new campaign
            viewCampaign(result.data.id);
            
        } catch (error) {
            console.error('Error generating content:', error);
            showError('Failed to generate content. Please try again.');
        } finally {
            showLoading(false);
        }
    }
    
    // Activate campaign
    async function activateCampaign(campaignId) {
        try {
            if (!confirm('Are you sure you want to activate this campaign? This will make it live.')) {
                return;
            }
            
            showLoading(true);
            
            const response = await fetch(`${apiBaseUrl}/content/campaign/${campaignId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'active'
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error activating campaign');
            }
            
            // Show success message
            alert('Campaign activated successfully!');
            
            // Refresh campaign view
            viewCampaign(campaignId);
            
        } catch (error) {
            console.e
(Content truncated due to size limit. Use line ranges to read in chunks)