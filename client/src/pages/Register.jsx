import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import '../styles/Register.css';

export default function Register() {
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!acceptTerms) {
      setError('You must accept terms and conditions to register.');
      return;
    }
    if (!acceptPrivacy) {
      setError('You must accept the privacy policy to register.');
      return;
    }

    try {
      setSubmitting(true);
      await register(name, email, password);
      navigate('/dashboard', { replace: true, state: { registered: true } });
    } catch (e2) {
      setError(e2.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="register-card">
        <h1>Register</h1>
        <p className="muted">Create an account to submit complaints.</p>

        <form onSubmit={onSubmit} className="form">
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
            />
          </label>

          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
            />
          </label>

          <label>
            Password
            <div style={{ position: 'relative' }}>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                required
                style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </label>

          <div className="terms-row">
            <input
              id="acceptTerms"
              className="terms-checkbox"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => { setAcceptTerms(e.target.checked); if (error) setError(''); }}
              aria-label="Accept Terms and Conditions"
              aria-invalid={error ? 'true' : 'false'}
            />
            <label className="terms-label" htmlFor="acceptTerms">I agree to the</label>
            <button type="button" className="link-button" onClick={() => setShowTerms(true)}>Terms & Conditions.</button>
          </div>

          <div className="terms-row">
            <input
              id="acceptPrivacy"
              className="terms-checkbox"
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(e) => { setAcceptPrivacy(e.target.checked); if (error) setError(''); }}
              aria-label="Accept Privacy Policy"
            />
            <label className="terms-label" htmlFor="acceptPrivacy">I agree to the </label>
            <button type="button" className="link-button" onClick={() => setShowPrivacy(true)}>Privacy Policy.</button>
          </div>

          {showTerms ? (
            <div className="terms-modal-overlay" role="dialog" aria-modal="true">
              <div className="terms-modal">
                <h2>Terms & Conditions</h2>
                <div style={{ whiteSpace: 'pre-wrap' }}>{`Terms and Conditions

APJ Complaint Portal

1. Introduction

Welcome to the APJ Complaint Portal (”Portal”), an online platform designed to facilitate complaint registration and resolution. By accessing or using this Portal, you agree to comply with these Terms and Conditions. If you do not agree, please discontinue use immediately.

2. Eligibility

* Users must be at least 18 years old or use the Portal under supervision.
* Users must provide accurate and valid information while registering.

3. User Account Responsibilities

* You are responsible for maintaining the confidentiality of your username and password.
* Any activity performed through your account will be considered your responsibility.
* Notify the administrator immediately in case of unauthorized access.

4. Purpose of the Portal

* The Portal is intended solely for lodging and tracking complaints related to services or issues.
* Users must ensure that complaints are genuine, relevant, and lawful.

5. Complaint Guidelines

Users agree that:

* All complaints must be factual and clearly described.
* No abusive, defamatory, or offensive language should be used.
* False or misleading complaints may lead to account suspension.

6. Data Privacy and Security

* Personal information submitted will be handled in accordance with applicable Indian data protection laws.
* The Portal uses reasonable security measures to protect user data.
* Information may be used only for complaint processing and system improvement.

7. Complaint Handling and Resolution

* APJ will make reasonable efforts to resolve complaints in a timely manner.
* Resolution time may vary depending on the complexity of the issue.
* Filing a complaint does not guarantee a specific resolution outcome.

8. Prohibited Activities

Users are strictly prohibited from:

* Submitting false or malicious complaints
* Attempting unauthorized system access or hacking
* Uploading harmful content such as viruses or malware
* Using the Portal for illegal purposes

9. Limitation of Liability

APJ shall not be held responsible for:

* Delays in complaint processing due to unforeseen circumstances
* Technical issues beyond system control
* Any indirect or consequential damages arising from use of the Portal

10. Account Suspension or Termination

APJ reserves the right to suspend or terminate user accounts without prior notice if:

* Terms are violated
* Suspicious or harmful activity is detected

11. Changes to Terms

APJ reserves the right to update these Terms and Conditions at any time. Continued use of the Portal after changes indicates acceptance of the revised terms.

12. Governing Law

These Terms shall be governed by and interpreted in accordance with the laws of India. Any disputes shall be subject to the jurisdiction of local courts.

13. Contact Information

For support or queries, users may contact:
Email: support@apjportal.com
Phone: +91-8877665544
`}</div>
                <div className="modal-actions">
                  <button type="button" onClick={() => { setAcceptTerms(true); setShowTerms(false); }} className="agree-btn">Agree</button>
                  <button type="button" onClick={() => setShowTerms(false)}>Close</button>
                </div>
              </div>
            </div>
          ) : null}

          {showPrivacy ? (
            <div className="terms-modal-overlay" role="dialog" aria-modal="true">
              <div className="terms-modal">
                <h2>Privacy Policy</h2>
                <div style={{ whiteSpace: 'pre-wrap' }}>{`Privacy Policy for APJ Complaint Portal

Effective Date: 01-01-2024

1. Introduction

APJ Complaint Portal ("we", "us", "our") is committed to protecting the privacy of users of our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use the Portal.

2. Information We Collect

- Personal Information: Name, email address, phone number, and other contact details you provide during registration or when submitting a complaint.
- Complaint Details: Information and materials you provide related to your complaint, including descriptions, attachments, and supporting documentation.
- Usage Data: Information about how you interact with the Portal, such as IP address, browser type, pages viewed, and timestamps.

3. How We Use Your Information

We may use the information we collect to:

- Register and manage your account.
- Process and respond to complaints.
- Communicate with you about your complaints and account.
- Improve and maintain our services.
- Comply with legal obligations.

4. Disclosure of Information

We may share your information with:

- Service providers who assist with Portal operations.
- Legal authorities when required by law or to protect rights and safety.
- Other parties with your consent.

5. Data Security

We take reasonable administrative, technical, and physical measures to protect your personal information. However, no method of transmission over the Internet is completely secure.

6. Data Retention

We retain personal information only as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements.

7. Your Rights

Depending on your jurisdiction, you may have rights to access, correct, or delete your personal data. Contact us at support@apjportal.com for requests.

8. Changes to this Policy

We may update this Privacy Policy from time to time. Continued use of the Portal after changes indicates acceptance of the revised policy.

9. Contact

If you have questions about this Privacy Policy, contact us at support@apjportal.com.
`}</div>
                <div className="modal-actions">
                  <button type="button" onClick={() => { setAcceptPrivacy(true); setShowPrivacy(false); }} className="agree-btn">Agree</button>
                  <button type="button" onClick={() => setShowPrivacy(false)}>Close</button>
                </div>
              </div>
            </div>
          ) : null}

          {error ? <div className="error">{error}</div> : null}

          <button disabled={submitting} type="submit">{submitting ? 'Creating…' : 'Register'}</button>
        </form>

        <div className="row">
          <span className="muted">Already have an account?</span> <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
