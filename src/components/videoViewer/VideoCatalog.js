'use client';

import styles from './VideoCatalog.module.css';

export const VIDEO_ENTRY_KEY_MAP = [
    { id: 'ib-1min', label: 'IB · 1 min', description: 'Long-form recap, 60 seconds', category: 'ib', type: '1min' },
    { id: 'ib-shorts', label: 'IB · Shorts', description: 'Punchy clip ready for Shorts', category: 'ib', type: 'shorts' },
    { id: 'cat-1min', label: 'CAT · 1 min', description: 'Cat storyline, 60 seconds', category: 'cat', type: '1min' },
    { id: 'cat-shorts', label: 'CAT · Shorts', description: 'Quick cat-focused hit', category: 'cat', type: 'shorts' },
    { id: 'mermaid-1min', label: 'Mermaid · 1 min', description: 'Mermaid lore, 60 seconds', category: 'mermaid', type: '1min' },
    { id: 'mermaid-shorts', label: 'Mermaid · Shorts', description: 'Mermaid clip for Shorts', category: 'mermaid', type: 'shorts' },
];

export const VideoCatalog = ({ selectedFilterId, onSelect, counts = {}, countsLoading = false }) => (
    <aside className={styles.container}>
        <header className={styles.header}>
            <p className={styles.eyebrow}>Browse by preset</p>
            <h2 className={styles.title}>Video buckets</h2>
            <p className={styles.subtitle}>Pick a production lane to load its files.</p>
        </header>
        <ul className={styles.list}>
            {VIDEO_ENTRY_KEY_MAP.map((option) => (
                <li key={option.id}>
                    <button
                        type="button"
                        className={
                            selectedFilterId === option.id ? styles.listItemActive : styles.listItem
                        }
                        onClick={() => onSelect(option)}
                    >
                        <span className={styles.listItemHeader}>
                            <span className={styles.listItemLabel}>{option.label}</span>
                            <span
                                className={styles.countBadge}
                                aria-label={`Total files for ${option.label}`}
                            >
                                {typeof counts[option.id] === 'number'
                                    ? counts[option.id]
                                    : countsLoading
                                      ? '…'
                                      : 0}
                            </span>
                        </span>
                        <span className={styles.listItemDescription}>{option.description}</span>
                    </button>
                </li>
            ))}
        </ul>
    </aside>
);

