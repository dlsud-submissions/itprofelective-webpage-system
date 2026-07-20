import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listProducts, type Product } from '../../../catalog/api/products.api';
import { listServices, type Service } from '../../../catalog/api/services.api';
import { createPurchase, type PurchaseItemType } from '../../api/purchases.api';
import styles from './ShopPage.module.css';

interface PurchaseFeedback {
  kind: 'success' | 'error';
  message: string;
}

export function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Keyed by item id so each card manages its own quantity and feedback.
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, PurchaseFeedback>>(
    {}
  );
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [productsResult, servicesResult] = await Promise.all([
        listProducts(),
        listServices(),
      ]);

      if (productsResult.error || servicesResult.error) {
        setLoadError(
          productsResult.error ??
            servicesResult.error ??
            'Could not load the shop.'
        );
      } else {
        setProducts(productsResult.data ?? []);
        setServices(servicesResult.data ?? []);
      }
      setIsLoading(false);
    };

    void load();
  }, []);

  const handleBuy = async (itemType: PurchaseItemType, itemId: string) => {
    const quantity =
      itemType === 'product' ? Number(quantities[itemId] || '1') : 1;

    if (!Number.isInteger(quantity) || quantity < 1) {
      setFeedback((current) => ({
        ...current,
        [itemId]: {
          kind: 'error',
          message: 'Quantity must be a positive whole number.',
        },
      }));
      return;
    }

    setBuyingId(itemId);
    const result = await createPurchase({ itemType, itemId, quantity });
    setBuyingId(null);

    if (result.error || !result.data) {
      setFeedback((current) => ({
        ...current,
        [itemId]: {
          kind: 'error',
          message: result.error ?? 'Purchase failed. Please try again.',
        },
      }));
      return;
    }

    const purchase = result.data;
    setFeedback((current) => ({
      ...current,
      [itemId]: {
        kind: 'success',
        message: `Purchased ${purchase.quantity}x ${purchase.itemName} for ₱${purchase.totalPrice.toFixed(2)}.`,
      },
    }));

    if (itemType === 'product') {
      setQuantities((current) => ({ ...current, [itemId]: '1' }));
      setProducts((current) =>
        current.map((product) =>
          product.id === itemId
            ? { ...product, stock: product.stock - purchase.quantity }
            : product
        )
      );
    }
  };

  const renderFeedback = (itemId: string) => {
    const itemFeedback = feedback[itemId];
    if (!itemFeedback) return null;

    return (
      <p
        className={
          itemFeedback.kind === 'success' ? styles.success : styles.error
        }
        role={itemFeedback.kind === 'error' ? 'alert' : 'status'}
      >
        {itemFeedback.message}
      </p>
    );
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Shop</h1>
        <p className={styles.subtitle}>
          Purchase products and book services at Golden Fur.
        </p>
        <nav className={styles.navLinks}>
          <Link to="/dashboard/customer">Back to dashboard</Link>
          <Link to="/dashboard/purchases">View purchase history</Link>
        </nav>
      </header>

      {isLoading ? <p className={styles.status}>Loading the shop…</p> : null}
      {loadError ? (
        <p className={styles.error} role="alert">
          {loadError}
        </p>
      ) : null}

      {!isLoading && !loadError ? (
        <>
          <section
            className={styles.section}
            aria-labelledby="shop-products-title"
          >
            <h2 id="shop-products-title">Products</h2>
            {products.length === 0 ? (
              <p className={styles.status}>No products available yet.</p>
            ) : (
              <div className={styles.grid}>
                {products.map((product) => {
                  const outOfStock = product.stock < 1;

                  return (
                    <article className={styles.card} key={product.id}>
                      <h3>{product.name}</h3>
                      {product.description ? (
                        <p className={styles.description}>
                          {product.description}
                        </p>
                      ) : null}
                      <p className={styles.price}>
                        ₱{product.price.toFixed(2)}
                      </p>
                      <p className={styles.meta}>
                        {outOfStock
                          ? 'Out of stock'
                          : `${product.stock} in stock`}
                      </p>
                      <div className={styles.buyRow}>
                        <label className={styles.quantityField}>
                          <span>Qty</span>
                          <input
                            type="number"
                            min={1}
                            max={product.stock}
                            value={quantities[product.id] ?? '1'}
                            disabled={outOfStock}
                            onChange={(event) =>
                              setQuantities((current) => ({
                                ...current,
                                [product.id]: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <button
                          className={styles.buyButton}
                          type="button"
                          disabled={outOfStock || buyingId === product.id}
                          onClick={() => void handleBuy('product', product.id)}
                        >
                          {buyingId === product.id ? 'Buying…' : 'Buy'}
                        </button>
                      </div>
                      {renderFeedback(product.id)}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section
            className={styles.section}
            aria-labelledby="shop-services-title"
          >
            <h2 id="shop-services-title">Services</h2>
            {services.length === 0 ? (
              <p className={styles.status}>No services available yet.</p>
            ) : (
              <div className={styles.grid}>
                {services.map((service) => (
                  <article className={styles.card} key={service.id}>
                    <h3>{service.name}</h3>
                    {service.description ? (
                      <p className={styles.description}>
                        {service.description}
                      </p>
                    ) : null}
                    <p className={styles.price}>₱{service.price.toFixed(2)}</p>
                    {service.category ? (
                      <p className={styles.meta}>{service.category}</p>
                    ) : null}
                    <div className={styles.buyRow}>
                      <button
                        className={styles.buyButton}
                        type="button"
                        disabled={buyingId === service.id}
                        onClick={() => void handleBuy('service', service.id)}
                      >
                        {buyingId === service.id ? 'Purchasing…' : 'Purchase'}
                      </button>
                    </div>
                    {renderFeedback(service.id)}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
