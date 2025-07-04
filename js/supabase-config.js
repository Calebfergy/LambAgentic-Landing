// Supabase configuration
// Note: In production, these should be environment variables
// For now, they need to be set manually or through your deployment process

window.SUPABASE_URL = 'https://your-project-id.supabase.co';
window.SUPABASE_ANON_KEY = 'your-anon-key-here';

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
  }
});