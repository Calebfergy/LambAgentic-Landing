// Supabase configuration
// Note: In production, these should be environment variables
// For now, they need to be set manually or through your deployment process

window.SUPABASE_URL = 'https://bjqxrxorcrrtstjkavlo.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqcXhyeG9yY3JydHN0amthdmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzkwNDEsImV4cCI6MjA1ODI1NTA0MX0.DH4CRtcU2IqyMf-xJqAVpfLSZItdYUlpA6sTmBmBxiY';

// Load Supabase client library
(function() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload = function() {
    // Initialize global Supabase client properly
    if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase) {
      try {
        window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully');
        
        // Test the connection
          .then(({ error }) => {
            if (error) {
              console.warn('Supabase connection test failed:', error.message);
              if (error.message.includes('relation "leads" does not exist')) {
                console.error('The leads table does not exist. Please run the database migration.');
              }
            } else {
              console.log('Supabase connection test successful');
            }
          })
          .catch(err => {
            console.warn('Supabase connection test error:', err);
          });
      } catch (initError) {
        console.error('Failed to initialize Supabase client:', initError);
      }
    }
  };
  script.onerror = function() {
    console.error('Failed to load Supabase client library');
  };
  document.head.appendChild(script);
})();

// Function to check if Supabase is properly configured
function checkSupabaseConfig() {
  if (!window.SUPABASE_URL || window.SUPABASE_URL.includes('your-project-id')) {
    console.warn('Supabase URL not configured. Please update js/supabase-config.js with your actual Supabase project URL.');
    return false;
  }
  
  if (!window.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY.includes('your-anon-key')) {
    console.warn('Supabase anon key not configured. Please update js/supabase-config.js with your actual Supabase anon key.');
    return false;
  }
  
  return true;
}

// Check configuration on load
document.addEventListener('DOMContentLoaded', () => {
  if (!checkSupabaseConfig()) {
    // Show a user-friendly message if Supabase is not configured
    const forms = document.querySelectorAll('.form');
    forms.forEach(form => {
      const notice = document.createElement('div');
      notice.style.cssText = `
        background: #fef3c7;
        border: 1px solid #f59e0b;
        color: #92400e;
        padding: var(--space-md);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-lg);
        font-size: 0.875rem;
      `;
      notice.textContent = 'Contact form is currently being configured. Please contact us directly at info@lambagentic.com';
      form.insertBefore(notice, form.firstChild);
    });
  } else {
    console.log('Supabase configuration verified');
  }
});