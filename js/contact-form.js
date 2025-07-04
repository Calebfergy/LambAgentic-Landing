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

      // Try direct database insertion first (primary method)
      let success = false;
      let errorMessage = '';

      if (window.supabaseClient) {
        try {
          const { data, error } = await window.supabaseClient
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

          if (error) {
            console.error('Direct database insertion failed:', error);
            errorMessage = error.message;
          } else {
            success = true;
            console.log('Lead saved successfully via direct insertion:', data);
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          errorMessage = dbError.message;
        }
      }

      // If direct insertion failed, try edge function as fallback
      if (!success) {
        try {
          const functionUrl = `${window.SUPABASE_URL}/functions/v1/send-lead-notification`;
          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(leadData)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Edge function failed: ${response.status} - ${errorText}`);
          }

          const result = await response.json();
          if (result.success) {
            success = true;
            console.log('Lead saved successfully via edge function:', result);
          } else {
            throw new Error(result.error || 'Edge function returned unsuccessful result');
          }
        } catch (edgeError) {
          console.error('Edge function error:', edgeError);
          errorMessage = edgeError.message;
        }
      }

      if (success) {
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
      } else {
        // Show error message with fallback contact info
        this.showMessage(
          `We're experiencing technical difficulties. Please contact us directly at info@lambagentic.com or call +1 (208) 361-1518. Error: ${errorMessage}`, 
          'error'
        );
      }

    } catch (error) {
      console.error('Form submission error:', error);
      this.showMessage(
        `There was an error sending your message. Please try again or contact us directly at info@lambagentic.com. Error: ${error.message}`, 
        'error'
      );
    } finally {
      // Reset button state
      this.setButtonState(false);
    }
  }
}

// Initialize the contact form handler when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for Supabase to initialize
  setTimeout(() => {
    new ContactFormHandler();
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