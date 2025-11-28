import styles from './About.module.css';

function About() {
  return (
    <div className={styles.about}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>About Deal & Wear</h1>
          <p className={styles.tagline}>AI-Powered Personal Styling for Everyone</p>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Mission</h2>
          <p className={styles.text}>
            At Deal & Wear, we believe that everyone deserves to look and feel their best. 
            Our AI-powered styling assistant helps you discover your perfect style by understanding 
            your preferences, occasion, and budget. We make fashion accessible and personalized.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>💬</div>
              <h3 className={styles.featureTitle}>Chat with AI</h3>
              <p className={styles.featureText}>
                Have a conversation with our AI styling assistant. Answer a few simple questions 
                about your style preferences and needs.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🎯</div>
              <h3 className={styles.featureTitle}>Get Recommendations</h3>
              <p className={styles.featureText}>
                Receive personalized brand and outfit recommendations tailored to your style, 
                occasion, and budget.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>✨</div>
              <h3 className={styles.featureTitle}>Discover Your Style</h3>
              <p className={styles.featureText}>
                Explore brands from budget-friendly to luxury, all curated to match your unique 
                fashion sense.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Why Choose Deal & Wear?</h2>
          <ul className={styles.benefits}>
            <li>🎨 Personalized style recommendations</li>
            <li>💰 Budget-conscious options</li>
            <li>🏪 Wide range of brands</li>
            <li>🤖 AI-powered insights</li>
            <li>📱 Works on all devices</li>
            <li>🆓 Completely free to use</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default About;

