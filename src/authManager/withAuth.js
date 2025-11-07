'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './authContext';

const withAuth = (WrappedComponent) => {
    const AuthenticatedComponent = (props) => {
        const { isAuthenticated, loading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            // Only redirect if we're not loading and user is not authenticated
            if (!loading && !isAuthenticated) {
                router.push('/auth');
            }
        }, [isAuthenticated, loading, router]);

        // Show loading state while checking authentication
        if (loading) {
            return (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    fontSize: '18px',
                    color: '#666'
                }}>
                    Loading...
                </div>
            );
        }

        // Don't render the component if user is not authenticated
        if (!isAuthenticated) {
            return null;
        }

        // Render the wrapped component if authenticated
        return <WrappedComponent {...props} />;
    };

    // Set display name for debugging
    AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return AuthenticatedComponent;
};

export default withAuth;
