import styles from './Auth.module.css';

export default function AuthLayout({ eyebrow, title, lead, children, footer }) {
  return (
    <div className={styles.wrap}>
      <section className={styles.panel}>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className={styles.title}>{title}</h1>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
        {children}
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </section>
    </div>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <p className={styles.error} role="alert">
      {message}
    </p>
  );
}
