class ContactFormHandler {
  constructor() {
    this.form = document.querySelector('.form');
    this.submitButton = null;
    this.originalButtonText = '';
    this.init();
  }

  init() {
    if (this.form) {
      this.submitButton = this.form.querySelector('button[type="submit"]');
      if (this.submitButton) {
        this.originalButtonText = this.submitButton.textContent;
      }
      this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }
  }

  setButtonState(loading = false, text = null) {
    if (!this.submitButton) return;
    
    this.submitButton.disabled = loading;
    this.submitButton.textContent = text || (loading ? 'Sending...' : this.originalButtonText);
    
    if (loading) {
      this.submitButton.style.opacity = '0.7';
      this.submitButton.style.cursor = 'not-allowed';
    } else {
      this.submitButton.style.opacity = '1';
      this.submitButton.style.cursor = 'pointer';
    }
  }

  showMessage(message, type = 'success') {
    // Remove any existing messages
    const existingMessage = this.form.querySelector('.form-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create new message element
    const messageElement = document.createElement('div');
    messageElement.className = 'form-message';
    messageElement.textContent = message;
    
    // Style the message
    const isSuccess = type === 'success';
    messageElement.style.cssText = `
      padding: var(--space-md);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-lg);
      font-size: 0.875rem;
      font-weight: 500;
      background: ${isSuccess ? '#d1fae5' : '#fee2e2'};
      border: 1px solid ${isSuccess ? '#10b981' : '#ef4444'};
      color: ${isSuccess ? '#065f46' : '#991b1b'};
    `;

    // Insert message at the top of the form
    this.form.insertBefore(messageElement, this.form.firstChild);

    // Auto-remove success messages after 5 seconds
    if (isSuccess) {
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.remove();
        }
      }, 5000);
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    // Set loading state
    this.setButtonState(true);

    try {
      // Get form data
      const formData = new FormData(this.form);
      const leadData = {
        name: formData.get('name')?.toString().trim() || '',
        email: formData.get('email')?.toString().trim() || '',
        company: formData.get('company')?.toString().trim() || '',
        phone: formData.get('phone')?.toString().trim() || '',
        service: formData.get('service')?.toString().trim() || '',
        message: formData.get('message')?.toString().trim() || ''
      };

      // Validate required fields
      if (!leadData.name || !leadData.email || !leadData.message) {
        throw new Error('Please fill in all required fields (Name, Email, and Message).');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(leadData.email)) {
        throw new Error('Please enter a valid email address.');
      }

      // Check if Supabase configuration is available
      if (!window.SUPABASE_URL) {
        throw new Error('Service configuration not available. Please contact us directly at info@lambagentic.com.');
      }

      // Submit lead data via Edge Function (primary method)
      console.log('Submitting lead via Edge Function...');
      
      const result = await this.submitLeadViaEdgeFunction(leadData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit lead data');
      }

      // Success!
      console.log('Lead submitted successfully:', result.data);
      
      // Show success message
      this.showMessage('Thank you for your message! We\'ll get back to you within 24 hours.', 'success');
      
      // Reset form
      this.form.reset();
      
      // Optional: Track the conversion (if you have analytics)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'form_submit', {
          event_category: 'Contact',
          event_label: 'Lead Form'
        });
      }

    } catch (error) {
      console.error('Form submission error:', error);
      
      // Provide specific error messages based on error type
      let userMessage = 'There was an error sending your message. ';
      
      if (error.message.includes('Service configuration not available')) {
        userMessage = error.message;
      } else if (error.message.includes('Network connection') || error.message.includes('fetch')) {
        userMessage += 'Please check your internet connection and try again.';
      } else if (error.message.includes('Please fill in') || error.message.includes('valid email')) {
        userMessage = error.message; // Use the validation error message directly
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        userMessage += 'The request timed out. Please try again or contact us directly at info@lambagentic.com.';
      } else {
        userMessage += `Please try again or contact us directly at info@lambagentic.com. Error: ${error.message}`;
      }
      
      this.showMessage(userMessage, 'error');
    } finally {
      // Reset button state
      this.setButtonState(false);
    }
  }

  async submitLeadViaEdgeFunction(leadData) {
    try {
      const functionUrl = `${window.SUPABASE_URL}/functions/v1/send-lead-notification`;
      
      console.log('Calling Edge Function:', functionUrl);
      
      // Set a timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Edge Function request timed out');
        controller.abort();
      }, 30000); // 30 second timeout
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...leadData,
          source: 'website',
          status: 'new'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Edge Function response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge Function failed with status:', response.status);
        console.error('Error response:', errorText);
        
        // Try to parse error details
        let errorMessage = 'Server error occurred';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // Use the raw error text if JSON parsing fails
          errorMessage = errorText || errorMessage;
        }
        
        return {
          success: false,
          error: `Server responded with error: ${errorMessage}`
        };
      }
      
      const result = await response.json();
      console.log('Edge Function response:', result);
      
      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      console.error('Edge Function call error:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out. Please try again.'
        };
      } else if (error.message.includes('fetch') || error.name === 'TypeError') {
        return {
          success: false,
          error: 'Network connection error. Please check your internet connection and try again.'
        };
      } else {
        return {
          success: false,
          error: error.message || 'Unknown error occurred'
        };
      }
    }
  }
}

// Initialize the contact form handler when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for Supabase configuration to load
  setTimeout(() => {
    if (!window.contactFormHandler) {
      window.contactFormHandler = new ContactFormHandler();
    }
  }, 1000);
});

// Also initialize if configuration loads later
window.addEventListener('load', () => {
  if (!window.contactFormHandler) {
    setTimeout(() => {
      window.contactFormHandler = new ContactFormHandler();
    }, 2000);
  }
});