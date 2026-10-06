import styles from './ui.module.css';

/**
 * Lockup: swash "f" monogram + wordmark ("Find Your" in Fraunces Regular, "fit" bold italic).
 * `markOnly` renders just the monogram (app icon style) for tight spaces.
 */
export default function Logo({ size = 20, inverse = false, markOnly = false, className = '' }) {
  return (
    <span
      className={`${styles.logo} ${inverse ? styles.logoInverse : ''} ${className}`}
      style={{ fontSize: size }}
      role="img"
      aria-label="Find Your Fit"
    >
      <img className={styles.logoMark} src={inverse ? '/brand/fyf-mark-white.png' : '/brand/fyf-mark.png'} alt="" aria-hidden="true" />
      {!markOnly && (
        <span aria-hidden="true">
          Find Your <span className={styles.logoFit}>fit</span>
        </span>
      )}
    </span>
  );
}
