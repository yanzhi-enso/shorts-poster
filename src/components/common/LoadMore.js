'use client';

import { useEffect, useRef } from 'react';
import styles from './LoadMore.module.css';

/**
 * IntersectionObserver sentinel that fires `onLoadMore` once it enters the viewport.
 * `isLoading` prevents thrashing by ignoring intersections while a fetch is in flight.
 */
export default function LoadMore({
    onLoadMore,
    disabled,
    isLoading = false,
    className = '',
}) {
    const ref = useRef(null);
    const loadingRef = useRef(isLoading);

    useEffect(() => {
        loadingRef.current = isLoading;
    }, [isLoading]);

    useEffect(() => {
        if (disabled) {
            return undefined;
        }

        const node = ref.current;
        const root = node?.parentElement ?? null;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !loadingRef.current) {
                        console.log('LoadMore: Triggering onLoadMore');
                        onLoadMore();
                    }
                });
            },
            {
                root,
                rootMargin: '400px',
            },
        );

        if (node) {
            observer.observe(node);
        }

        return () => {
            observer.disconnect();
        };
    }, [onLoadMore, disabled]);

    if (disabled) {
        return null;
    }

    return (
        <div
            ref={ref}
            className={`${styles.trigger} ${className}`.trim()}
            role="presentation"
            aria-hidden="true"
        >
            Load more
        </div>
    );
}
