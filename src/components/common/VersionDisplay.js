'use client';

import styles from './VersionDisplay.module.css';

export default function VersionDisplay() {
    // Get the build version from environment variable
    // If not set (local development), default to "dev"
    const buildVersion = process.env.NEXT_PUBLIC_BUILD_VERSION || 'dev';

    return (
        <div className={styles.versionDisplay}>
            Version: {buildVersion}
        </div>
    );
}
