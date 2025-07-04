// Contact form handler with Supabase integration
class ContactFormHandler {
  constructor() {
    this.form = document.querySelector('.form');
    this.submitButton = null;
    this.originalButtonText = '';
    this.supabaseClient = null;
    
    if (this.form) {
      this.init();
    }
  }

  async init() {
    this.submitButton = this.form.querySelector('button[type="submit"]');
    this.originalButtonText = this.submitButton?.textContent || 'Send Message';
    
    // Initialize Supabase client
    await this.initSupabase();
    
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    
    // Add real-time validation
    this.addValidation();
  }

  async initSupabase() {
    try {
      // Check if Supabase is available
      if (typeof window.supabase === 'undefined') {
        // Load Supabase client library
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // Initialize Supabase client
      if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
        this.supabaseClient = window.supabase.createClient(
          window.SUPABASE_URL,
          window.SUPABASE_ANON_KEY
        );
      }
    } catch (error) {
      console.warn('Failed to initialize Supabase client:', error);
    }
  }

  addValidation() {
    const emailInput = this.form.querySelector('#email');
    const nameInput = this.form.querySelector('#name');
    const messageInput = this.form.querySelector('#message');

    // Email validation
    if (emailInput) {
      emailInput.addEventListener('blur', this.validateEmail.bind(this));
      emailInput.addEventListener('input', this.clearError.bind(this));
    }

    // Name validation
    if (nameInput) {
      nameInput.addEventListener('blur', this.validateName.bind(this));
      nameInput.addEventListener('input', this.clearError.bind(this));
    }

    // Message validation
    if (messageInput) {
      messageInput.addEventListener('blur', this.validateMessage.bind(this));
      messageInput.addEventListener('input', this.clearError.bind(this));
    }
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

  validateName(event) {
    const name = event.target.value.trim();
    
    if (name && name.length < 2) {
      this.showFieldError(event.target, 'Name must be at least 2 characters long');
      return false;
    }
    
    this.clearFieldError(event.target);
    return true;
  }

  validateMessage(event) {
    const message = event.target.value.trim();
    
    if (message && message.length < 10) {
      this.showFieldError(event.target, 'Message must be at least 10 characters long');
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
    errorDiv.style.color = 'var(--error)';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = 'var(--space-xs)';
    
    field.parentNode.appendChild(errorDiv);
    field.style.borderColor = 'var(--error)';
  }

  clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
    field.style.borderColor = '';
  }

  clearError(event) {
    this.clearFieldError(event.target);
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(this.form);
    const data = {
      name: formData.get('name')?.toString().trim() || '',
      email: formData.get('email')?.toString().trim() || '',
      company: formData.get('company')?.toString().trim() || '',
      service: formData.get('service')?.toString() || '',
      message: formData.get('message')?.toString().trim() || '',
      phone: formData.get('phone')?.toString().trim() || ''
    };

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      this.showError('Please fill in all required fields (Name, Email, and Message).');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      this.showError('Please enter a valid email address.');
      return;
    }

    // Validate message length
    if (data.message.length < 10) {
      this.showError('Please provide a more detailed message (at least 10 characters).');
      return;
    }

    // Show loading state
    this.setLoadingState(true);

    try {
      let success = false;
      let errorMessage = '';

      // Try direct Supabase insertion first
      if (this.supabaseClient) {
        try {
          const { data: leadData, error } = await this.supabaseClient
            .from('leads')
            .insert([{
              name: data.name,
              email: data.email,
              company: data.company || null,
              service: data.service || null,
              message: data.message,
              phone: data.phone || null,
              source: 'website'
            }])
            .select()
            .single();

          if (error) {
            throw error;
          }

          success = true;
          console.log('Lead saved successfully:', leadData);
        } catch (supabaseError) {
          console.warn('Direct Supabase insertion failed:', supabaseError);
          errorMessage = supabaseError.message || 'Database error';
        }
      }

      // Fallback to Edge Function if direct insertion failed
      if (!success) {
        try {
          const functionUrl = `${window.SUPABASE_URL}/functions/v1/send-lead-notification`;
          
          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(data)
          });

          const result = await response.json();

          if (response.ok && result.success) {
            success = true;
          } else {
            throw new Error(result.error || 'Edge function failed');
          }
        } catch (functionError) {
          console.warn('Edge function fallback failed:', functionError);
          errorMessage = functionError.message || 'Function error';
        }
      }

      if (success) {
        this.showSuccess('Thank you for your message! We\'ll get back to you within 24 hours.');
        this.form.reset();
        
        // Track successful submission
        this.trackFormSubmission(data);
      } else {
        throw new Error(errorMessage || 'All submission methods failed');
      }

    } catch (error) {
      console.error('Form submission error:', error);
      
      // Show user-friendly error message
      if (error.message.includes('leads_email_key')) {
        this.showError('It looks like you\'ve already submitted a message with this email address. We\'ll get back to you soon!');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        this.showError('Network error. Please check your internet connection and try again.');
      } else {
        this.showError('Sorry, there was an error submitting your message. Please try again or contact us directly at info@lambagentic.com');
      }
    } finally {
      this.setLoadingState(false);
    }
  }

  setLoadingState(loading) {
    if (!this.submitButton) return;

    if (loading) {
      this.submitButton.disabled = true;
      this.submitButton.textContent = 'Sending...';
      this.submitButton.style.opacity = '0.7';
    } else {
      this.submitButton.disabled = false;
      this.submitButton.textContent = this.originalButtonText;
      this.submitButton.style.opacity = '1';
    }
  }

  showError(message) {
    this.removeMessages();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-message form-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: var(--space-md);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-lg);
      font-size: 0.875rem;
    `;
    
    this.form.insertBefore(errorDiv, this.form.firstChild);
    
    // Scroll to error message
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  showSuccess(message) {
    this.removeMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'form-message form-success';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      padding: var(--space-md);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-lg);
      font-size: 0.875rem;
    `;
    
    this.form.insertBefore(successDiv, this.form.firstChild);
    
    // Scroll to success message
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  removeMessages() {
    const existingMessages = this.form.querySelectorAll('.form-message');
    existingMessages.forEach(msg => msg.remove());
  }

  trackFormSubmission(data) {
    // Track form submission for analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_submit', {
        event_category: 'Contact',
        event_label: data.service || 'General Inquiry',
        value: 1
      });
    }

    // You can add other analytics tracking here
    console.log('Form submitted successfully:', {
      service: data.service,
      hasCompany: !!data.company,
      hasPhone: !!data.phone
    });
  }
}

// Initialize contact form handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ContactFormHandler();
});

// Export for potential use in other scripts
window.ContactFormHandler = ContactFormHandler;