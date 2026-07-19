import { useState, type FormEvent } from 'react';
import { Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../../useAuth';
import { login } from '../../../../api/auth.api';
import { dashboardPathForRole } from '../../../../dashboardPath';
import { loginSchema } from '../../../../validators/auth.validator';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your login details.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(parsed.data);
    setIsSubmitting(false);

    if (result.error || !result.data) {
      setError(result.error ?? 'Invalid email or password.');
      return;
    }

    await refresh();
    navigate(dashboardPathForRole(result.data.user.role), { replace: true });
  };

  return (
    <div className={styles.wrapper}>
      <form
        className={styles.form}
        onSubmit={(event) => void handleSubmit(event)}
      >
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <div className={styles.iconField}>
            <span
              className={styles.glyph}
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: 18,
              }}
            >
              <Mail size={20} />
            </span>
            <input
              className={styles.input}
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <div className={styles.iconField}>
            <span
              className={styles.glyph}
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: 18,
              }}
            >
              <Lock size={20} />
            </span>
            <input
              className={styles.input}
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </label>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
