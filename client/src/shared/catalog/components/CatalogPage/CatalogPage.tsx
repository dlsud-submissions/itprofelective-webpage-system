import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../../auth/useAuth';
import type { CatalogApiResult } from '../../api/catalogClient';
import styles from './CatalogPage.module.css';

export interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  [extra: string]: unknown;
}

export interface CatalogExtraField {
  key: string;
  label: string;
  type: 'text' | 'number';
  min?: number;
}

interface CatalogPageProps<T extends CatalogItem> {
  title: string;
  subtitle: string;
  itemNoun: string;
  extraField: CatalogExtraField;
  listItems: () => Promise<CatalogApiResult<T[]>>;
  createItem: (payload: Record<string, unknown>) => Promise<CatalogApiResult<T>>;
  updateItem: (id: string, payload: Record<string, unknown>) => Promise<CatalogApiResult<T>>;
}

interface DraftValues {
  name: string;
  description: string;
  price: string;
  extra: string;
}

const emptyDraft: DraftValues = { name: '', description: '', price: '', extra: '' };

function parseExtraValue(field: CatalogExtraField, raw: string) {
  return field.type === 'number' ? Number(raw) : raw;
}

export function CatalogPage<T extends CatalogItem>({
  title,
  subtitle,
  itemNoun,
  extraField,
  listItems,
  createItem,
  updateItem,
}: CatalogPageProps<T>) {
  const { user } = useAuth();
  const canManage = user?.role === 'staff' || user?.role === 'admin';

  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createDraft, setCreateDraft] = useState<DraftValues>(emptyDraft);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftValues>(emptyDraft);
  const [editError, setEditError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const result = await listItems();
    if (result.error || !result.data) {
      setLoadError(result.error ?? `Could not load ${itemNoun}s.`);
    } else {
      setLoadError(null);
      setItems(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);

    const price = Number(createDraft.price);
    if (!createDraft.name.trim() || Number.isNaN(price) || price < 0) {
      setCreateError(`Name and a non-negative price are required.`);
      return;
    }

    setIsCreating(true);
    const result = await createItem({
      name: createDraft.name.trim(),
      description: createDraft.description.trim() || undefined,
      price,
      [extraField.key]: createDraft.extra ? parseExtraValue(extraField, createDraft.extra) : undefined,
    });
    setIsCreating(false);

    if (result.error || !result.data) {
      setCreateError(result.error ?? `Could not create ${itemNoun}.`);
      return;
    }

    setCreateDraft(emptyDraft);
    setItems((current) => [result.data as T, ...current]);
  };

  const startEdit = (item: T) => {
    setEditingId(item.id);
    setEditError(null);
    setEditDraft({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      extra: item[extraField.key] !== undefined ? String(item[extraField.key]) : '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
    setEditDraft(emptyDraft);
  };

  const saveEdit = async (id: string) => {
    setEditError(null);

    const price = Number(editDraft.price);
    if (!editDraft.name.trim() || Number.isNaN(price) || price < 0) {
      setEditError('Name and a non-negative price are required.');
      return;
    }

    const result = await updateItem(id, {
      name: editDraft.name.trim(),
      description: editDraft.description.trim() || undefined,
      price,
      [extraField.key]: editDraft.extra ? parseExtraValue(extraField, editDraft.extra) : undefined,
    });

    if (result.error || !result.data) {
      setEditError(result.error ?? `Could not update ${itemNoun}.`);
      return;
    }

    setItems((current) => current.map((it) => (it.id === id ? (result.data as T) : it)));
    cancelEdit();
  };

  const toggleActive = async (item: T) => {
    const result = await updateItem(item.id, { isActive: !item.isActive });
    if (result.error || !result.data) return;
    setItems((current) => current.map((it) => (it.id === item.id ? (result.data as T) : it)));
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      {canManage ? (
        <section className={styles.createCard} aria-labelledby="catalog-create-title">
          <h2 id="catalog-create-title">Add a new {itemNoun}</h2>
          <form className={styles.createForm} onSubmit={(event) => void handleCreate(event)}>
            <label className={styles.field}>
              <span>Name</span>
              <input
                type="text"
                value={createDraft.name}
                onChange={(event) => setCreateDraft((d) => ({ ...d, name: event.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span>Description</span>
              <input
                type="text"
                value={createDraft.description}
                onChange={(event) => setCreateDraft((d) => ({ ...d, description: event.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span>Price</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={createDraft.price}
                onChange={(event) => setCreateDraft((d) => ({ ...d, price: event.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span>{extraField.label}</span>
              <input
                type={extraField.type}
                min={extraField.min}
                value={createDraft.extra}
                onChange={(event) => setCreateDraft((d) => ({ ...d, extra: event.target.value }))}
              />
            </label>
            {createError ? (
              <p className={styles.error} role="alert">
                {createError}
              </p>
            ) : null}
            <button className={styles.submit} type="submit" disabled={isCreating}>
              {isCreating ? 'Adding…' : `Add ${itemNoun}`}
            </button>
          </form>
        </section>
      ) : null}

      {isLoading ? <p className={styles.status}>Loading {itemNoun}s…</p> : null}
      {loadError ? (
        <p className={styles.error} role="alert">
          {loadError}
        </p>
      ) : null}

      {!isLoading && !loadError && items.length === 0 ? (
        <p className={styles.status}>No {itemNoun}s available yet.</p>
      ) : null}

      <div className={styles.grid}>
        {items.map((item) => {
          const isEditing = editingId === item.id;

          return (
            <article
              className={`${styles.card} ${canManage && !item.isActive ? styles.cardInactive : ''}`}
              key={item.id}
            >
              {isEditing ? (
                <div className={styles.editForm}>
                  <label className={styles.field}>
                    <span>Name</span>
                    <input
                      type="text"
                      value={editDraft.name}
                      onChange={(event) => setEditDraft((d) => ({ ...d, name: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Description</span>
                    <input
                      type="text"
                      value={editDraft.description}
                      onChange={(event) => setEditDraft((d) => ({ ...d, description: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Price</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={editDraft.price}
                      onChange={(event) => setEditDraft((d) => ({ ...d, price: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>{extraField.label}</span>
                    <input
                      type={extraField.type}
                      min={extraField.min}
                      value={editDraft.extra}
                      onChange={(event) => setEditDraft((d) => ({ ...d, extra: event.target.value }))}
                    />
                  </label>
                  {editError ? (
                    <p className={styles.error} role="alert">
                      {editError}
                    </p>
                  ) : null}
                  <div className={styles.cardActions}>
                    <button type="button" onClick={() => void saveEdit(item.id)}>
                      Save
                    </button>
                    <button type="button" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.cardHeader}>
                    <h3>{item.name}</h3>
                    {canManage ? (
                      <span
                        className={`${styles.badge} ${item.isActive ? styles.badgeActive : styles.badgeInactive}`}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    ) : null}
                  </div>
                  {item.description ? <p className={styles.description}>{item.description}</p> : null}
                  <p className={styles.price}>₱{item.price.toFixed(2)}</p>
                  <p className={styles.extra}>
                    {extraField.label}: {String(item[extraField.key] ?? '—')}
                  </p>
                  {canManage ? (
                    <div className={styles.cardActions}>
                      <button type="button" onClick={() => startEdit(item)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => void toggleActive(item)}>
                        {item.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
