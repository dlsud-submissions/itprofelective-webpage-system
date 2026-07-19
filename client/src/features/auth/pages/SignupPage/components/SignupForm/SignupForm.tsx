import { useState, type FormEvent } from 'react';
import { Lock, Mail, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../../useAuth';
import { register } from '../../../../api/auth.api';
import { signupSchema } from '../../../../validators/auth.validator';
import styles from './SignupForm.module.css';

export function SignupForm() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = signupSchema.safeParse({ name, email, password });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your details.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(parsed.data);
    setIsSubmitting(false);

    if (result.error || !result.data) {
      setError(result.error ?? 'Unable to create account.');
      return;
    }

    await refresh();
    navigate('/', { replace: true });
  };

  return (
    <div className={styles.wrapper}>
      <form
        className={styles.form}
        onSubmit={(event) => void handleSubmit(event)}
      >
        <label className={styles.field}>
          <span className={styles.label}>Full name</span>
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
              <UserRound size={20} />
            </span>
            <input
              className={styles.input}
              autoComplete="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        </label>

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
              autoComplete="new-password"
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
          {isSubmitting ? 'Creating account' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
