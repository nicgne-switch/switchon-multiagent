// Connect frontend to backend for the onboarding process
// This file should be included in the frontend HTML

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('onboardingForm');
    const apiBaseUrl = '/api'; // Update with actual API URL in production
    
    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        const submitButton = document.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;
        
        // Collect all form data
        const formData = {
            company: {
                name: document.getElementById('companyName').value,
                industry: document.getElementById('industry').value,
                size: document.getElementById('companySize').value
            },
            financial: {
                arr: document.getElementById('arr').value,
                ticketSize: document.getElementById('ticketSize').value,
                salesCycle: document.getElementById('salesCycle').value
            },
            icp: {
                industries: Array.from(document.getElementById('customerIndustry').selectedOptions).map(opt => opt.value),
                sizes: Array.from(document.getElementById('customerSize').selectedOptions).map(opt => opt.value),
                decisionMakers: Array.from(document.getElementById('decisionMakers').selectedOptions).map(opt => opt.value)
            },
            marketing: {
                channels: Array.from(document.getElementById('currentChannels').selectedOptions).map(opt => opt.value),
                painPoints: document.getElementById('painPoints').value,
                goals: document.getElementById('goals').value
            }
        };
        
        try {
            // Send data to backend API
            const response = await fetch(`${apiBaseUrl}/onboarding/company`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error submitting onboarding data');
            }
            
            // Create user associated with the company
            const userEmail = prompt('Please enter your email to complete registration:');
            if (userEmail) {
                const userResponse = await fetch(`${apiBaseUrl}/onboarding/user`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: userEmail,
                        company_id: result.data.id,
                        role: 'admin'
                    })
                });
                
                const userResult = await userResponse.json();
                
                if (!userResponse.ok) {
                    throw new Error(userResult.error || 'Error creating user');
                }
            }
            
            // Show success message
            alert('Thank you for submitting your information! We are now generating your custom strategy.');
            
            // Redirect to dashboard or confirmation page
            window.location.href = '/dashboard.html?company=' + result.data.id;
            
        } catch (error) {
            console.error('Error during onboarding:', error);
            alert('There was an error processing your information. Please try again.');
            
            // Reset button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    });
});
