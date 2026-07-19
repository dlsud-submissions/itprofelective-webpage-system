import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../../auth/useAuth';
import styles from './DashboardPage.module.css';

export interface DashboardLink {
  to: string;
  label: string;
  description: string;
}

interface DashboardPageProps {
  title: string;
  roleLabel: string;
  links: DashboardLink[];
  note?: string;
}

export function DashboardPage({
  title,
  roleLabel,
  links,
  note,
}: DashboardPageProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{title}</h1>
          <p className={styles.subtitle}>Welcome back, {user?.name}.</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.roleBadge}>{roleLabel}</span>
          <button
            className={styles.signOut}
            type="button"
            onClick={() => void handleSignOut()}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className={styles.linkGrid}>
        {links.map((link) => (
          <Link key={link.to} to={link.to} className={styles.linkCard}>
            <h2>{link.label}</h2>
            <p>{link.description}</p>
          </Link>
        ))}
      </div>

      {note ? <p className={styles.note}>{note}</p> : null}
    </main>
  );
}
