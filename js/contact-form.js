class ContactFormHandler {
    constructor() {
        this.form = document.querySelector('.form');
        this.submitButton = this.form?.querySelector('button[type="submit"]');
        this.successMessage = document.getElementById('success-message');
        this.errorMessage = document.getElementById('error-message');
        
        if (this.form) {
            this.init();
        }
    }

    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.setupRealTimeValidation();
    }

    setupRealTimeValidation() {
        const emailInput = this.form.querySelector('input[name="email"]');
        if (emailInput) {
            emailInput.addEventListener('blur', this.validateEmail.bind(this));
            emailInput.addEventListener('input', this.clearFieldError.bind(this));
        }

        // Clear errors on input for all fields
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateEmail(event) {
        const email = event.target.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            this.showFieldError(event.target, 'Please enter a valid email address');
            return false;
        }
        
        this.clearFieldError(event.target);
        return true;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#dc2626';
        errorDiv.style.fontSize = '0.875rem';
        errorDiv.style.marginTop = '0.25rem';
        
        field.parentNode.appendChild(errorDiv);
        field.style.borderColor = '#dc2626';
    }

    clearFieldError(field) {
        // Check if field and its parent node exist
        if (!field || !field.parentNode) {
            return;
        }
        
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        field.style.borderColor = '';
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        console.log('Form submission started');
        
        // Clear previous messages
        this.hideMessages();
        
        // Validate form
        if (!this.validateForm()) {
            console.log('Form validation failed');
            return;
        }
        
        // Show loading state
        this.setLoadingState(true);
        
        try {
            // Get form data
            const formData = this.getFormData();
            console.log('Form data collected:', { 
                name: formData.name, 
                email: formData.email, 
                hasMessage: !!formData.message 
            });
            
            // Submit lead via edge function
            const result = await this.submitLeadViaEdgeFunction(formData);
            
            if (result.success) {
                console.log('Lead submitted successfully:', result.leadId);
                this.showSuccess('Thank you for your message! We\'ll get back to you soon.');
                this.form.reset();
                
                // Track analytics event
                this.trackFormSubmission('success', result.leadId);
            } else {
                throw new Error(result.error || 'Failed to submit form');
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showError(`Sorry, there was an error submitting your message: ${error.message}`);
            this.trackFormSubmission('error', null, error.message);
        } finally {
            this.setLoadingState(false);
        }
    }

    validateForm() {
        const requiredFields = ['name', 'email', 'message'];
        let isValid = true;
        
        // Clear all previous field errors
        const errorDivs = this.form.querySelectorAll('.field-error');
        errorDivs.forEach(div => div.remove());
        
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.style.borderColor = '';
        });
        
        // Check required fields
        requiredFields.forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (!field || !field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            }
        });
        
        // Validate email format
        const emailField = this.form.querySelector('[name="email"]');
        if (emailField && emailField.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailField.value.trim())) {
                this.showFieldError(emailField, 'Please enter a valid email address');
                isValid = false;
            }
        }
        
        return isValid;
    }

    getFormData() {
        const formData = new FormData(this.form);
        return {
            name: formData.get('name')?.toString().trim() || '',
            email: formData.get('email')?.toString().trim() || '',
            company: formData.get('company')?.toString().trim() || '',
            service: formData.get('service')?.toString().trim() || '',
            message: formData.get('message')?.toString().trim() || '',
            phone: formData.get('phone')?.toString().trim() || ''
        };
    }

    async submitLeadViaEdgeFunction(leadData) {
        console.log('Submitting lead via edge function');
        
        try {
            // Call the edge function directly with fetch
            const response = await fetch(`${window.SUPABASE_URL}/functions/v1/send-lead-notification`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'apikey': window.SUPABASE_ANON_KEY
                },
                body: JSON.stringify(leadData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Edge Function failed with status:', response.status);
                console.error('Error response:', errorText);
                
                let errorMessage;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.error || 'Unknown error';
                } catch (parseError) {
                    errorMessage = errorText || `HTTP ${response.status}`;
                }
                
                throw new Error(`Server responded with error: ${errorMessage}`);
            }

            const result = await response.json();
            console.log('Edge function response:', result);
            
            return { 
                success: true, 
                leadId: result.leadId, 
                data: result 
            };
            
        } catch (error) {
            console.error('Edge function submission error:', error);
            
            // Provide user-friendly error messages
            if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
                throw new Error('Network connection error. Please check your internet connection and try again.');
            } else if (error.message.includes('401') || error.message.includes('authorization')) {
                throw new Error('Server configuration error. Please contact support.');
            } else {
                throw error;
            }
        }
    }

    setLoadingState(isLoading) {
        if (this.submitButton) {
            this.submitButton.disabled = isLoading;
            this.submitButton.textContent = isLoading ? 'Sending...' : 'Send Message';
        }
        
        // Add visual loading indicator
        if (isLoading) {
            this.submitButton?.classList.add('loading');
        } else {
            this.submitButton?.classList.remove('loading');
        }
    }

    showSuccess(message) {
        this.hideMessages();
        if (this.successMessage) {
            this.successMessage.textContent = message;
            this.successMessage.style.display = 'block';
            this.successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    showError(message) {
        this.hideMessages();
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
            this.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    hideMessages() {
        if (this.successMessage) {
            this.successMessage.style.display = 'none';
        }
        if (this.errorMessage) {
            this.errorMessage.style.display = 'none';
        }
    }

    trackFormSubmission(status, leadId = null, errorMessage = null) {
        // Track form submission for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
                event_category: 'Contact Form',
                event_label: status,
                value: leadId ? 1 : 0,
                custom_parameters: {
                    lead_id: leadId,
                    error_message: errorMessage
                }
            });
        }
        
        // Console log for debugging
        console.log('Form submission tracked:', {
            status,
            leadId,
            errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}

// Initialize the contact form handler when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing contact form handler');
    
    // Check if Supabase is configured
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured. Make sure supabase-config.js is loaded first.');
        
        // Show configuration warning
        const forms = document.querySelectorAll('.form');
        forms.forEach(form => {
            const warning = document.createElement('div');
            warning.style.cssText = `
                background: #fef3c7;
                border: 1px solid #f59e0b;
                color: #92400e;
                padding: 1rem;
                border-radius: 0.5rem;
                margin-bottom: 1rem;
                font-size: 0.875rem;
            `;
            warning.innerHTML = `
                <strong>Configuration Required:</strong> 
                The contact form requires Supabase configuration. 
                Please update the settings in js/supabase-config.js
            `;
            form.parentNode.insertBefore(warning, form);
        });
    }
    
    // Initialize the contact form handler
    new ContactFormHandler();
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContactFormHandler;
}