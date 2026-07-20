import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listMyPurchases, type Purchase } from '../../api/purchases.api';
import styles from './PurchaseHistoryPage.module.css';

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const result = await listMyPurchases();
      if (result.error || !result.data) {
        setLoadError(result.error ?? 'Could not load your purchases.');
      } else {
        setPurchases(result.data);
      }
      setIsLoading(false);
    };

    void load();
  }, []);

  const totalSpent = purchases.reduce(
    (sum, purchase) => sum + purchase.totalPrice,
    0
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Purchase History</h1>
        <p className={styles.subtitle}>
          Everything you have purchased at Golden Fur, newest first.
        </p>
        <nav className={styles.navLinks}>
          <Link to="/dashboard/customer">Back to dashboard</Link>
          <Link to="/dashboard/shop">Go to shop</Link>
        </nav>
      </header>

      {isLoading ? (
        <p className={styles.status}>Loading your purchases…</p>
      ) : null}
      {loadError ? (
        <p className={styles.error} role="alert">
          {loadError}
        </p>
      ) : null}

      {!isLoading && !loadError && purchases.length === 0 ? (
        <p className={styles.status}>
          You have no purchases yet.{' '}
          <Link to="/dashboard/shop">Visit the shop</Link> to get started.
        </p>
      ) : null}

      {!isLoading && !loadError && purchases.length > 0 ? (
        <section className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Item</th>
                <th scope="col">Type</th>
                <th scope="col" className={styles.numeric}>
                  Qty
                </th>
                <th scope="col" className={styles.numeric}>
                  Unit price
                </th>
                <th scope="col" className={styles.numeric}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td>{dateFormatter.format(new Date(purchase.createdAt))}</td>
                  <td>{purchase.itemName}</td>
                  <td>
                    <span
                      className={`${styles.typeBadge} ${
                        purchase.itemType === 'product'
                          ? styles.typeProduct
                          : styles.typeService
                      }`}
                    >
                      {purchase.itemType}
                    </span>
                  </td>
                  <td className={styles.numeric}>{purchase.quantity}</td>
                  <td className={styles.numeric}>
                    ₱{purchase.unitPrice.toFixed(2)}
                  </td>
                  <td className={styles.numeric}>
                    ₱{purchase.totalPrice.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5}>Total spent</td>
                <td className={styles.numeric}>₱{totalSpent.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      ) : null}
    </main>
  );
}
