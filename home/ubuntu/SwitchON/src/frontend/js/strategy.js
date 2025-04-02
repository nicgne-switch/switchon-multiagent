// Strategy visualization and approval frontend for SwitchON MultiAgent platform
document.addEventListener('DOMContentLoaded', function() {
    // Get company ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get('company');
    const userId = localStorage.getItem('userId') || 'default_user'; // In production, get from auth
    
    const apiBaseUrl = '/api'; // Update with actual API URL in production
    
    // Elements
    const strategyContainer = document.getElementById('strategy-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const generateButton = document.getElementById('generate-strategy-btn');
    const strategyList = document.getElementById('strategy-list');
    
    // Initialize page
    init();
    
    // Initialize function
    async function init() {
        if (!companyId) {
            showError('No company ID provided. Please go back to the dashboard.');
            return;
        }
        
        // Load existing strategies
        await loadStrategies();
        
        // Set up event listeners
        if (generateButton) {
            generateButton.addEventListener('click', generateStrategy);
        }
    }
    
    // Load existing strategies
    async function loadStrategies() {
        try {
            showLoading(true);
            
            const response = await fetch(`${apiBaseUrl}/strategy/company/${companyId}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error loading strategies');
            }
            
            // Display strategies
            displayStrategies(result.data);
            
        } catch (error) {
            console.error('Error loading strategies:', error);
            showError('Failed to load strategies. Please try again.');
        } finally {
            showLoading(false);
        }
    }
    
    // Display strategies in the list
    function displayStrategies(strategies) {
        if (!strategyList) return;
        
        strategyList.innerHTML = '';
        
        if (strategies.length === 0) {
            strategyList.innerHTML = '<div class="alert alert-info">No strategies found. Generate your first strategy!</div>';
            return;
        }
        
        strategies.forEach(strategy => {
            const statusBadge = getStatusBadge(strategy.status);
            const date = new Date(strategy.created_at).toLocaleDateString();
            
            const strategyItem = document.createElement('div');
            strategyItem.className = 'strategy-item card mb-3';
            strategyItem.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title">${strategy.title}</h5>
                        ${statusBadge}
                    </div>
                    <p class="card-text text-muted">Created on ${date}</p>
                    <div class="d-flex justify-content-end">
                        <button class="btn btn-outline-primary btn-sm view-strategy" data-id="${strategy.id}">View Strategy</button>
                    </div>
                </div>
            `;
            
            strategyList.appendChild(strategyItem);
            
            // Add event listener to view button
            strategyItem.querySelector('.view-strategy').addEventListener('click', () => {
                viewStrategy(strategy.id);
            });
        });
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
            case 'archived':
                badgeClass = 'bg-dark';
                break;
            default:
                badgeClass = 'bg-secondary';
        }
        
        return `<span class="badge ${badgeClass}">${badgeText}</span>`;
    }
    
    // View strategy details
    async function viewStrategy(strategyId) {
        try {
            showLoading(true);
            
            const response = await fetch(`${apiBaseUrl}/strategy/${strategyId}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error loading strategy');
            }
            
            // Display strategy details
            displayStrategyDetails(result.data);
            
        } catch (error) {
            console.error('Error viewing strategy:', error);
            showError('Failed to load strategy details. Please try again.');
        } finally {
            showLoading(false);
        }
    }
    
    // Display strategy details
    function displayStrategyDetails(strategy) {
        if (!strategyContainer) return;
        
        const statusBadge = getStatusBadge(strategy.status);
        const date = new Date(strategy.created_at).toLocaleDateString();
        
        strategyContainer.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h3>${strategy.title}</h3>
                    ${statusBadge}
                </div>
                <div class="card-body">
                    <p class="text-muted">Created on ${date}</p>
                    <div class="strategy-content">
                        ${formatStrategyContent(strategy.content)}
                    </div>
                </div>
                <div class="card-footer d-flex justify-content-between">
                    <button class="btn btn-secondary" id="back-to-list">Back to List</button>
                    <div>
                        ${strategy.status === 'draft' ? 
                            `<button class="btn btn-success" id="approve-strategy" data-id="${strategy.id}">Approve Strategy</button>` : 
                            ''}
                        <button class="btn btn-primary" id="edit-strategy" data-id="${strategy.id}">Edit Strategy</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('back-to-list').addEventListener('click', () => {
            strategyContainer.innerHTML = '';
            loadStrategies();
        });
        
        const approveButton = document.getElementById('approve-strategy');
        if (approveButton) {
            approveButton.addEventListener('click', () => {
                approveStrategy(strategy.id);
            });
        }
        
        document.getElementById('edit-strategy').addEventListener('click', () => {
            editStrategy(strategy);
        });
    }
    
    // Format strategy content with proper HTML
    function formatStrategyContent(content) {
        // Split content by line breaks and create paragraphs
        const paragraphs = content.split('\n\n');
        let formattedContent = '';
        
        paragraphs.forEach(paragraph => {
            // Check if paragraph is a heading
            if (paragraph.startsWith('#')) {
                const level = paragraph.match(/^#+/)[0].length;
                const text = paragraph.replace(/^#+\s*/, '');
                formattedContent += `<h${level + 2}>${text}</h${level + 2}>`;
            } 
            // Check if paragraph is a list
            else if (paragraph.match(/^\d+\.\s/) || paragraph.match(/^-\s/)) {
                const items = paragraph.split('\n');
                formattedContent += '<ul>';
                items.forEach(item => {
                    const text = item.replace(/^(\d+\.|-)\s/, '');
                    formattedContent += `<li>${text}</li>`;
                });
                formattedContent += '</ul>';
            } 
            // Regular paragraph
            else {
                formattedContent += `<p>${paragraph}</p>`;
            }
        });
        
        return formattedContent;
    }
    
    // Generate new strategy
    async function generateStrategy() {
        try {
            if (!confirm('Are you sure you want to generate a new strategy? This may take a minute.')) {
                return;
            }
            
            showLoading(true);
            generateButton.disabled = true;
            generateButton.textContent = 'Generating...';
            
            const response = await fetch(`${apiBaseUrl}/strategy/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    company_id: companyId,
                    user_id: userId
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error generating strategy');
            }
            
            // Show success message
            alert('Strategy generated successfully!');
            
            // View the new strategy
            viewStrategy(result.data.id);
            
        } catch (error) {
            console.error('Error generating strategy:', error);
            showError('Failed to generate strategy. Please try again.');
        } finally {
            showLoading(false);
            generateButton.disabled = false;
            generateButton.textContent = 'Generate New Strategy';
        }
    }
    
    // Approve strategy
    async function approveStrategy(strategyId) {
        try {
            if (!confirm('Are you sure you want to approve this strategy? This will make it active.')) {
                return;
            }
            
            showLoading(true);
            
            const response = await fetch(`${apiBaseUrl}/strategy/${strategyId}/status`, {
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
                throw new Error(result.error || 'Error approving strategy');
            }
            
            // Show success message
            alert('Strategy approved successfully!');
            
            // Refresh strategy view
            viewStrategy(strategyId);
            
        } catch (error) {
            console.error('Error approving strategy:', error);
            showError('Failed to approve strategy. Please try again.');
        } finally {
            showLoading(false);
        }
    }
    
    // Edit strategy
    function editStrategy(strategy) {
        if (!strategyContainer) return;
        
        strategyContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Edit Strategy</h3>
                </div>
                <div class="card-body">
                    <form id="edit-strategy-form">
                        <div class="mb-3">
                            <label for="strategy-title" class="form-label">Strategy Title</label>
                            <input type="text" class="form-control" id="strategy-title" value="${strategy.title}" required>
                        </div>
                        <div class="mb-3">
                            <label for="strategy-content" class="form-label">Strategy Content</label>
                            <textarea class="form-control" id="strategy-content" rows="15" required>${strategy.content}</textarea>
                        </div>
                        <div class="d-flex justify-content-between">
                            <button type="button" class="btn btn-secondary" id="cancel-edit">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('cancel-edit').addEventListener('click', () => {
            viewStrategy(strategy.id);
        });
        
        document.getElementById('edit-strategy-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('strategy-title').value;
            const content = document.getElementById('strategy-content').value;
            
            await updateStrategyContent(strategy.id, title, content);
        });
    }
    
    // Update strategy content
    async function updateStrategyContent(strategyId, title, content) {
        try {
            showLoading(true);
            
            const response = await fetch(`${apiBaseUrl}/strategy/${strategyId}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    content
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error updating strategy');
            }
            
            // Show success message
            alert('Strategy updated successfully!');
            
            // Refresh strategy view
            viewStrategy(strategyId);
            
        } catch (error) {
            console.error('Error updating strategy:', error);
            showError('Failed to update strategy. Please try again.');
        } finally {
            showLoading(false);
        }
    }
    
    // Show/hide loading indicator
    function showLoading(show) {
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'block' : 'none';
        }
    }
    
    // Show error message
    function showError(message) {
        alert(message);
    }
});
