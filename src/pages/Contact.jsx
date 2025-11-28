import { useState } from 'react';
import styles from './Contact.module.css';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 3000);
  };

  return (
    <div className={styles.contact}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Get in Touch</h1>
          <p className={styles.subtitle}>
            Have questions or feedback? We'd love to hear from you!
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.formSection}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.label}>Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className={styles.textarea}
                  rows="6"
                  required
                />
              </div>

              <button type="submit" className={styles.submitButton}>
                {submitted ? '✓ Sent!' : 'Send Message'}
              </button>
            </form>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>📧</div>
              <h3 className={styles.infoTitle}>Email</h3>
              <p className={styles.infoText}>hello@dealandwear.com</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>🌐</div>
              <h3 className={styles.infoTitle}>Follow Us</h3>
              <div className={styles.socialLinks}>
                <a href="https://www.instagram.com/deal.andwear" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  Instagram
                </a>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>💬</div>
              <h3 className={styles.infoTitle}>Chat Support</h3>
              <p className={styles.infoText}>
                Use our AI styling assistant on the home page for instant help!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;

