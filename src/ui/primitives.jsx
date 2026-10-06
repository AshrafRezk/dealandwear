import { forwardRef, useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import styles from './ui.module.css';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', block = false, loading = false, to, href, icon, iconEnd, children, className, disabled, ...rest },
  ref,
) {
  const cls = cx(styles.btn, styles[`btn_${variant}`], styles[`btn_${size}`], block && styles.btnBlock, className);
  const content = (
    <>
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : icon ? <Icon name={icon} size={18} /> : null}
      {children ? <span>{children}</span> : null}
      {iconEnd && !loading ? <Icon name={iconEnd} size={18} /> : null}
    </>
  );
  if (to) {
    return (
      <Link ref={ref} to={to} className={cls} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={cls} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} type="button" className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
});

export function IconButton({ icon, label, className, active, ...rest }) {
  return (
    <button type="button" className={cx(styles.iconBtn, active && styles.iconBtnActive, className)} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={20} />
    </button>
  );
}

export const Field = forwardRef(function Field({ label, hint, error, as = 'input', children, className, id, ...rest }, ref) {
  const autoId = useId();
  const fieldId = id || autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const Control = as;
  return (
    <div className={cx(styles.field, error && styles.fieldError, className)}>
      {label ? (
        <label htmlFor={fieldId} className={styles.fieldLabel}>
          {label}
        </label>
      ) : null}
      <Control
        ref={ref}
        id={fieldId}
        className={styles.fieldControl}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...rest}
      >
        {children}
      </Control>
      {hint && !error ? (
        <p id={hintId} className={styles.fieldHint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.fieldErrorText} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export function Checkbox({ label, className, ...rest }) {
  return (
    <label className={cx(styles.checkbox, className)}>
      <input type="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  );
}

export function Chip({ selected, children, className, ...rest }) {
  return (
    <button type="button" className={cx(styles.chip, selected && styles.chipSelected, className)} aria-pressed={selected ? true : false} {...rest}>
      {selected ? <Icon name="check" size={14} /> : null}
      {children}
    </button>
  );
}

export function Tag({ tone = 'default', children, className }) {
  return <span className={cx(styles.tag, styles[`tag_${tone}`], className)}>{children}</span>;
}

export function FitBadge({ value, compact = false }) {
  const { t } = useTranslation();
  if (!Number.isFinite(value)) return null;
  return <span className={styles.fitBadge}>{t(compact ? 'product.matchShort' : 'product.fitMatch', { value })}</span>;
}

export function ProgressBar({ value, label, className }) {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div className={cx(styles.progress, className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <div className={styles.progressFill} style={{ inlineSize: `${pct}%` }} />
    </div>
  );
}

export function Skeleton({ width, height = 16, className, style }) {
  return <span className={cx(styles.skeleton, className)} style={{ inlineSize: width, blockSize: height, ...style }} aria-hidden="true" />;
}

export function Accordion({ items }) {
  return (
    <div className={styles.accordion}>
      {items
        .filter((i) => i && i.content)
        .map((item) => (
          <details key={item.id} className={styles.accordionItem} open={item.open}>
            <summary className={styles.accordionSummary}>
              <span>{item.title}</span>
              <Icon name="plus" size={16} className={styles.accordionIcon} />
            </summary>
            <div className={styles.accordionBody}>{item.content}</div>
          </details>
        ))}
    </div>
  );
}

/** Modal panel: a bottom sheet on mobile, a side panel on desktop. Traps focus and closes on Escape. */
export function Sheet({ open, onClose, title, children, footer, side = 'end' }) {
  const { t } = useTranslation();
  const panelRef = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    lastFocus.current = document.activeElement;
    const panel = panelRef.current;
    const focusables = () => panel.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
    (focusables()[0] || panel).focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab') {
        const list = Array.from(focusables());
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lastFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={styles.sheetRoot}>
      <div className={styles.sheetBackdrop} onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} className={cx(styles.sheet, side === 'start' && styles.sheetStart)} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <div className={styles.sheetHeader}>
          <h2 className={styles.sheetTitle}>{title}</h2>
          <IconButton icon="close" label={t('common.close')} onClick={onClose} />
        </div>
        <div className={styles.sheetBody}>{children}</div>
        {footer ? <div className={styles.sheetFooter}>{footer}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({ icon = 'sparkle', title, body, action, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>
        <Icon name={icon} size={28} />
      </span>
      <Heading className={styles.emptyTitle}>{title}</Heading>
      {body ? <p className={styles.emptyBody}>{body}</p> : null}
      {action ? <div className={styles.emptyAction}>{action}</div> : null}
    </div>
  );
}

export function Spinner({ label }) {
  const { t } = useTranslation();
  return (
    <div className={styles.spinnerWrap} role="status">
      <span className={styles.spinnerLg} aria-hidden="true" />
      <span className="visually-hidden">{label || t('common.loading')}</span>
    </div>
  );
}
