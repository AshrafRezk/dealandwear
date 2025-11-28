import ChatAssistant from '../components/ChatAssistant/ChatAssistant';
import InstallPrompt from '../components/PWA/InstallPrompt';
import styles from './Home.module.css';

function Home() {
  return (
    <div className={styles.home}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Your AI Styling Assistant</h1>
          <p className={styles.subtitle}>
            Discover your perfect style with personalized brand recommendations powered by AI
          </p>
        </div>
        <div className={styles.chatWrapper}>
          <ChatAssistant />
        </div>
      </div>
      <InstallPrompt />
    </div>
  );
}

export default Home;

