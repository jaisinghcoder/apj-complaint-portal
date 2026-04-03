const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@apj.com';
const supportPhone = import.meta.env.VITE_SUPPORT_PHONE || '+1-800-123-4567';
const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-block">
          <strong>Legal</strong>
          <div className="footer-info">
          <a href="/terms" target="_blank" rel="noreferrer">Terms</a>
          <a href="/privacy" target="_blank" rel="noreferrer">Privacy</a>
          
          <a href="/contact">Contact</a>
        </div>
        </div>

        
        <div className="footer-block">
          <strong>Support</strong>
          <div className="footer-info">
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          <a href={`tel:${supportPhone}`}>{supportPhone}</a>
          <a href="/help" target="_blank" rel="noreferrer">Help</a>
          </div>
        </div>
         
        <div className="footer-block footer-follow">
          <strong>Follow Us</strong>
          <div className="footer-social">
            <div className="social-item">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M22 5.92c-.66.29-1.37.49-2.12.58.76-.45 1.34-1.16 1.61-2.02-.71.42-1.5.73-2.34.9A3.66 3.66 0 0015.5 4c-2.02 0-3.66 1.63-3.66 3.64 0 .29.03.57.1.84C8.1 8.28 5.1 6.7 3.07 4.16c-.32.55-.5 1.2-.5 1.88 0 1.3.66 2.44 1.66 3.11-.61-.02-1.18-.19-1.68-.46v.05c0 1.76 1.26 3.23 2.93 3.56-.31.08-.64.12-.98.12-.24 0-.47-.02-.7-.06.47 1.47 1.83 2.54 3.44 2.57A7.34 7.34 0 012 19.54 10.34 10.34 0 007.29 21c6.88 0 10.65-5.7 10.65-10.64v-.48A7.6 7.6 0 0022 5.92z" fill="currentColor"/>
                </svg>
              </a>
              <span className="social-label">Twitter</span>
            </div>
            <div className="social-item">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.2V12h2.2V9.6c0-2.2 1.3-3.4 3.3-3.4.95 0 1.95.17 1.95.17v2.15h-1.1c-1.1 0-1.45.69-1.45 1.4V12h2.47l-.4 2.9H14.5v7A10 10 0 0022 12z" fill="currentColor"/>
                </svg>
              </a>
              <span className="social-label">Facebook</span>
            </div>
            <div className="social-item">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M20.45 20.45h-3.55v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85v5.5H8.93V9h3.41v1.56h.05c.48-.9 1.66-1.85 3.42-1.85 3.66 0 4.34 2.41 4.34 5.54v6.7zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.11 20.45H3.57V9h3.54v11.45z" fill="currentColor"/>
                </svg>
              </a>
              <span className="social-label">LinkedIn</span>
            </div>
          </div>
        </div>
      </div>
      <hr />
      <div className="footer-bottom">
        <div style={{ marginTop: 6 }}>
          <strong>APJ COMPLAINT PORTAL</strong>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} · v{appVersion}Built for efficient community grievance tracking.</p>
        </div>
      </div>
      <hr />
    </footer>
  );
}