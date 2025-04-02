// Action approval and execution frontend for SwitchON MultiAgent platform
document.addEventListener('DOMContentLoaded', function() {
    // Get company ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get('company');
    const userId = localStorage.getItem('userId') || 'default_user'; // In production, get from auth
    
    const apiBaseUrl = '/api'; // Update with actual API URL in production
    
    // Elements
    const actionContainer = document.getElementById('action-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const createActionBtn = document.getElementById('create-action-btn');
    const actionList = document.getElementById('action-list');
    const statusFilter = document.getElementById('status-filter');
    const typeFilter = document.getElementById('type-filter');
    const createActionModal = new bootstrap.Modal(document.getElementById('createActionModal'));
    const createActionForm = document.getElementById('create-action-form');
    const assignedToSelect = document.getElementById('assigned-to');
    const campaignSelect = document.getElementById('campaign-select');
    
    // Initialize page
    init();
    
    // Initialize function
    async function init() {
        if (!companyId) {
            showError('No company ID provided. Please go back to the dashboard.');
            return;
        }
        
        // Load existing actions
        await loadActions();
        
        // Load users for assignment
        await loadUsers();
        
        // Load campaigns for selection
        await loadCampaigns();
        
        // Set up event listeners
        if (createActionBtn) {
            createActionBtn.addEventListener('click', openCreateActionModal);
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', filterActions);
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', filterActions);
        }
        
        if (createActionForm) {
            createActionForm.addEventListener('submit', handleActionCreation);
        }
    }
    
    // Load existing actions
    async function loadActions() {
        try {
            showLoading(true);
            
            const response = await fetch(`${apiBaseUrl}/actions/company/${companyId}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error loading actions');
            }
            
            // Store actions in global variable for filtering
            window.actions = result.data;
            
            // Display actions
            displayActions(result.data);
            
        } catch (error) {
            console.error('Error loading actions:', error);
            showError('Failed to load actions. Please try again.');
        } finally {
            showLoading(false);
        }
    }
    
    // Load users for assignment
    async function loadUsers() {
        try {
            const response = await fetch(`${apiBaseUrl}/onboarding/company/${companyId}/users`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error loading users');
            }
            
            // Populate assigned to select
            assignedToSelect.innerHTML = '<option value="" selected>Unassigned</option>';
            
            result.data.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.email;
                assignedToSelect.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error loading users:', error);
            // Add a default option if users can't be loaded
            assignedToSelect.innerHTML = '<option value="" selected>Unassigned</option>';
            assignedToSelect.innerHTML += '<option value="sample_user">Sample User</option>';
        }
    }
    
    // Load campaigns for selection
    async function loadCampaigns() {
        try {
            const response = await fetch(`${apiBaseUrl}/content/company/${companyId}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error loading campaigns');
            }
            
            // Populate campaign select
            campaignSelect.innerHTML = '<option value="" selected>None</option>';
            
            result.data.forEach(campaign => {
                const option = document.createElement('option');
                option.value = campaign.id;
                option.textContent = campaign.name;
                campaignSelect.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error loading campaigns:', error);
            // Add a default option if campaigns can't be loaded
            campaignSelect.innerHTML = '<option value="" selected>None</option>';
            campaignSelect.innerHTML += '<option value="sample_campaign">Sample Campaign</option>';
        }
    }
    
    // Display actions in the list
    function displayActions(actions) {
        if (!actionList) return;
        
        actionList.innerHTML = '';
        
        if (actions.length === 0) {
            actionList.innerHTML = '<div class="alert alert-info">No actions found. Create your first action!</div>';
            return;
        }
        
        actions.forEach(action => {
            const statusBadge = getStatusBadge(action.status);
            const typeBadge = getTypeBadge(action.type);
            const date = new Date(action.created_at).toLocaleDateString();
            
            const actionItem = document.createElement('div');
            actionItem.className = 'action-item card mb-3';
            actionItem.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>${typeBadge}</div>
                        ${statusBadge}
                    </div>
                    <p class="card-text">${action.content.substring(0, 50)}${action.content.length > 50 ? '...' : ''}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${date}</small>
                        <button class="btn btn-outline-primary btn-sm view-action" data-id="${action.id}">View</button>
                    </div>
                </div>
            `;
            
            actionList.appendChild(actionItem);
            
            // Add event listener to view button
            actionItem.querySelector('.view-action').addEventListener('click', () => {
                viewAction(action.id);
            });
        });
    }
    
    // Filter actions by status and type
    function filterActions() {
        const status = statusFilter.value;
        const type = typeFilter.value;
        
        if (!window.actions) return;
        
        let filteredActions = window.actions;
        
        if (status) {
            filteredActions = filteredActions.filter(action => action.status === status);
        }
        
        if (type) {
            filteredActions = filteredActions.filter(action => action.type === type);
        }
        
        displayActions(filteredActions);
    }
    
    // Generate status badge HTML
    function getStatusBadge(status) {
        let badgeClass = '';
        let badgeText = status.charAt(0).toUpperCase() + status.slice(1);
        
        switch (status) {
            case 'pending':
                badgeClass = 'bg-warning text-dark';
                break;
            case 'approved':
                badgeClass = 'bg-success';
                break;
            case 'rejected':
                badgeClass = 'bg-danger';
                break;
            case 'completed':
                badgeClass = 'bg-info';
                break;
            default:
                badgeClass = 'bg-secondary';
        }
        
        return `<span class="badge ${badgeClass}">${badgeText}</span>`;
    }
    
    // Generate type badge HTML
    function getTypeBadge(type) {
        let typeClass = '';
        let typeText = type.charAt(0).toUpperCase() + type.slice(1);
        
        switch (type) {
            case 'email':
                typeClass = 'type-email';
                break;
            case 'linkedin':
                typeClass = 'type-linkedin';
                break;
            case 'sms':
                typeClass = 'type-sms';
                break;
            case 'meeting':
                typeClass = 'type-meeting';
                break;
            case 'optimization':
                typeClass = 'type-optimization';
                break;
            default:
                typeClass = '';
        }
        
        return `<span class="type-badge ${typeClass}">${typeText}</span>`;
    }
    
    // View action details
    async function viewAction(actionId) {
        try {
            showLoading(true);
            
            const response = await fetch(`${apiBaseUrl}/actions/${actionId}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error loading action');
            }
            
            // Display action details
            displayActionDetails(result.data);
            
        } catch (error) {
            console.error('Error viewing action:', error);
            showError('Failed to load action details. Please try again.');
        } finally {
            showLoading(false);
        }
    }
    
    // Display action details
    function displayActionDetails(action) {
        if (!actionContainer) return;
        
        const statusBadge = getStatusBadge(action.status);
        const typeBadge = getTypeBadge(action.type);
        const date = new Date(action.created_at).toLocaleDateString();
        const dueDate = action.due_date ? new Date(action.due_date).toLocaleDateString() : 'Not set';
        const assignedTo = action.assigned_to || 'Unassigned';
        
        actionContainer.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        ${typeBadge}
                        <h3 class="ms-3 mb-0">Action Details</h3>
                    </div>
                    ${statusBadge}
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p><strong>Created:</strong> ${date}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Due Date:</strong> ${dueDate}</p>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p><strong>Assigned To:</strong> ${assignedTo}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Campaign:</strong> ${action.campaign_id ? 'Linked' : 'None'}</p>
                        </div>
                    </div>
                    <h5>Description:</h5>
                    <div class="action-content">
                        ${action.content}
                    </div>
                </div>
                <div class="card-footer d-flex justify-content-between">
                    <button class="btn btn-secondary" id="back-to-list">Back to List</button>
                    <div>
                        ${action.status === 'pending' ? `
                            <button class="btn btn-danger me-2" id="reject-action" data-id="${action.id}">Reject</button>
                            <button class="btn btn-success me-2" id="approve-action" data-id="${action.id}">Approve</button>
                        ` : ''}
                        ${action.status === 'approved' && action.status !== 'completed' ? `
                            <button class="btn btn-info" id="complete-action" data-id="${action.id}">Mark Completed</button>
                        ` : ''}
                        ${!action.assigned_to ? `
                            <button class="btn btn-primary" id="assign-action" data-id="${action.id}">Assign</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('back-to-list').addEventListener('click', () => {
            actionContainer.innerHTML = '';
            loadActions();
        });
        
        const approveButton = document.getElementById('approve-action');
        if (approveButton) {
            approveButton.addEventListener('click', () => {
                updateActionStatus(action.id, 'approved');
            });
        }
        
        const rejectButton = document.getElementById('reject-action');
        if (rejectButton) {
            rejectButton.addEventListener('click', () => {
                updateActionStatus(action.id, 'rejected');
            });
        }
        
        const completeButton = document.getElementById('complete-action');
        if (completeButton) {
            completeButton.addEventListener('click', () => {
                updateActionStatus(action.id, 'completed');
            });
        }
        
        const assignButton = document.getElementById('assign-action');
        if (assignButton) {
            assignButton.addEventListener('click', () => {
                showAssignModal(action);
            });
        }
    }
    
    // Show assign modal
    function showAssignModal(action) {
        // Create a modal for assignment
        const modalHtml = `
            <div class="modal fade" id="assignActionModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Assign Action</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="assign-action-form">
                                <div class="mb-3">
                                    <label for="assign-to" class="form-label">Assign To</label>
                                    <select class="form-select" id="assign-to" required>
                                        <option value="" selected disabled>Choose a user</option>
                                        <!-- User options will be populated dynamically -->
                                    </select>
                                </div>
                                <div class="d-flex justify-content-end">
                                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" class="btn btn-primary">Assign</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
    
(Content truncated due to size limit. Use line ranges to read in chunks)