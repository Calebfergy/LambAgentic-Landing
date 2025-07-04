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

  async waitForSupabase(maxAttempts = 10, delay = 500) {
    for (let i = 0; i < maxAttempts; i++) {
      if (window.supabaseClient) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false;
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

      // Wait for Supabase to be ready
      const supabaseReady = await this.waitForSupabase();
      
      if (!supabaseReady || !window.supabaseClient) {
        throw new Error('Database connection not available. Please try again in a moment or contact us directly.');
      }

      // Try direct database insertion (primary method)
      console.log('Attempting to save lead to database...');
      
      let insertResult;
      try {
        insertResult = await window.supabaseClient
          .from('leads')
          .insert([{
            name: leadData.name,
            email: leadData.email,
            company: leadData.company || null,
            service: leadData.service || null,
            message: leadData.message,
            phone: leadData.phone || null,
            source: 'website',
            status: 'new'
          }])
          .select()
          .single();
      } catch (fetchError) {
        console.error('Network error during database insertion:', fetchError);
        
        // Check if it's a network connectivity issue
        if (fetchError.message.includes('fetch') || fetchError.name === 'TypeError') {
          throw new Error('Network connection error. Please check your internet connection and try again.');
        }
        
        throw fetchError;
      }

      const { data, error } = insertResult;

      if (error) {
        console.error('Database insertion failed:', error);
        
        // Check if it's a permission/RLS error
        if (error.code === '42501' || error.message.includes('permission') || error.message.includes('RLS')) {
          throw new Error('Database permissions not configured properly. Please contact support.');
        }
        
        // Check if it's a connection error
        if (error.message.includes('fetch') || error.message.includes('network')) {
          throw new Error('Network connection error. Please check your internet connection and try again.');
        }
        
        throw new Error(`Database error: ${error.message}`);
      }

      // Success!
      console.log('Lead saved successfully:', data);
      
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

      // Try to send email notification in the background (optional)
      this.sendEmailNotification(leadData, data.id).catch(emailError => {
        console.warn('Email notification failed (this is optional):', emailError);
        // Don't show error to user since the main form submission succeeded
      });

    } catch (error) {
      console.error('Form submission error:', error);
      
      // Provide specific error messages based on error type
      let userMessage = 'There was an error sending your message. ';
      
      if (error.message.includes('Database connection not available')) {
        userMessage += 'Please try again in a moment or contact us directly at info@lambagentic.com.';
      } else if (error.message.includes('permissions') || error.message.includes('RLS')) {
        userMessage += 'Our system is currently being configured. Please contact us directly at info@lambagentic.com or call +1 (208) 361-1518.';
      } else if (error.message.includes('Network connection')) {
        userMessage += 'Please check your internet connection and try again.';
      } else if (error.message.includes('Please fill in') || error.message.includes('valid email')) {
        userMessage = error.message; // Use the validation error message directly
      } else {
        userMessage += `Please try again or contact us directly at info@lambagentic.com. Error: ${error.message}`;
      }
      
      this.showMessage(userMessage, 'error');
    } finally {
      // Reset button state
      this.setButtonState(false);
    }
  }

  async sendEmailNotification(leadData, leadId) {
    // Only attempt email notification if we have the required configuration
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      console.log('Skipping email notification - Supabase not configured');
      return;
    }

    try {
      const functionUrl = `${window.SUPABASE_URL}/functions/v1/send-lead-notification`;
      
      console.log('Attempting to call edge function:', functionUrl);
      
      // Set a shorter timeout for the email notification since it's optional
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Email notification request timed out');
        controller.abort();
      }, 15000); // 15 second timeout
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...leadData, leadId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Edge function response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Email notification sent successfully:', result);
      } else {
        const errorText = await response.text();
        console.warn('Email notification failed with status:', response.status);
        console.warn('Error response:', errorText);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Email notification timed out (this is optional)');
      } else {
        console.warn('Email notification error (this is optional):', error);
        console.warn('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    }
  }
}

// Initialize the contact form handler when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for Supabase to initialize
  setTimeout(() => {
    if (!window.contactFormHandler) {
      window.contactFormHandler = new ContactFormHandler();
    }
  }, 1000);
});

// Also initialize if Supabase loads later
window.addEventListener('load', () => {
  if (!window.contactFormHandler) {
    setTimeout(() => {
      window.contactFormHandler = new ContactFormHandler();
    }, 2000);
  }
});