// Lovable integration service for SwitchON MultiAgent platform
const axios = require('axios');

class LovableService {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl || process.env.LOVABLE_API_URL;
    this.apiKey = apiKey || process.env.LOVABLE_API_KEY;
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      }
    });
  }

  /**
   * Create a new onboarding flow in Lovable
   * @param {Object} companyData - Company data from onboarding
   * @returns {Promise} - Response from Lovable API
   */
  async createOnboardingFlow(companyData) {
    try {
      const response = await this.axiosInstance.post('/onboarding/create', {
        companyId: companyData.id,
        companyName: companyData.name,
        industry: companyData.industry,
        financialData: {
          arr: companyData.arr,
          ticketSize: companyData.ticket_size
        },
        icp: JSON.parse(companyData.icp),
        channels: companyData.channels
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating onboarding flow in Lovable:', error);
      throw error;
    }
  }

  /**
   * Send notification to user in Lovable
   * @param {string} userId - User ID in Lovable
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} link - Optional link to redirect user
   * @returns {Promise} - Response from Lovable API
   */
  async sendNotification(userId, title, message, link = null) {
    try {
      const response = await this.axiosInstance.post('/notifications', {
        user_id: userId,
        title,
        message,
        link
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending notification in Lovable:', error);
      throw error;
    }
  }

  /**
   * Create strategy approval flow in Lovable
   * @param {Object} strategyData - Strategy data to be approved
   * @param {string} userId - User ID in Lovable
   * @returns {Promise} - Response from Lovable API
   */
  async createStrategyApprovalFlow(strategyData, userId) {
    try {
      const response = await this.axiosInstance.post('/strategies/approval', {
        user_id: userId,
        strategy_id: strategyData.id,
        strategy_title: strategyData.title,
        strategy_content: strategyData.content,
        company_id: strategyData.company_id
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating strategy approval flow in Lovable:', error);
      throw error;
    }
  }

  /**
   * Get user data from Lovable
   * @param {string} userId - User ID in Lovable
   * @returns {Promise} - Response from Lovable API
   */
  async getUserData(userId) {
    try {
      const response = await this.axiosInstance.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user data from Lovable:', error);
      throw error;
    }
  }

  /**
   * Simulate Lovable API for development purposes
   * This method mocks the Lovable API responses for local development
   * @param {string} endpoint - API endpoint to simulate
   * @param {Object} data - Request data
   * @returns {Object} - Simulated response
   */
  simulateApi(endpoint, data) {
    console.log(`Simulating Lovable API call to ${endpoint} with data:`, data);
    
    // Simulate different endpoints
    switch (endpoint) {
      case '/onboarding/create':
        return {
          success: true,
          flow_id: 'sim_' + Math.random().toString(36).substring(2, 15),
          message: 'Onboarding flow created successfully'
        };
        
      case '/notifications':
        return {
          success: true,
          notification_id: 'sim_' + Math.random().toString(36).substring(2, 15),
          message: 'Notification sent successfully'
        };
        
      case '/strategies/approval':
        return {
          success: true,
          approval_id: 'sim_' + Math.random().toString(36).substring(2, 15),
          message: 'Strategy approval flow created successfully'
        };
        
      case '/users':
        return {
          success: true,
          user: {
            id: data.userId || 'sim_user',
            email: 'user@example.com',
            name: 'Simulated User',
            company_id: data.company_id || 'sim_company'
          }
        };
        
      default:
        return {
          success: false,
          message: 'Unknown endpoint in simulation'
        };
    }
  }
}

module.exports = LovableService;
