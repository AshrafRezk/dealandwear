import styles from './Footer.module.css';

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.links}>
          <a href="https://www.instagram.com/deal.andwear" target="_blank" rel="noopener noreferrer" className={styles.link}>
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

