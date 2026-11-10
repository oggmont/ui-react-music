import { isRouteErrorResponse, useRouteError } from 'react-router';
import { ButtonLink } from '@/components/Button';
import { EmptyState } from '@/components/States';
import styles from './Layouts.module.css';

/** Last-resort error boundary for the routes. */
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <div className={styles.screen}>
      <EmptyState
        title={notFound ? "This page doesn't exist" : 'Something went wrong'}
        action={
          <ButtonLink variant="primary" size="sm" to="/">
            Go to Home
          </ButtonLink>
        }
      >
        {notFound ? 'Check the address, or start from Home.' : 'Reload the page, or start from Home.'}
      </EmptyState>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className={styles.screen}>
      <EmptyState
        title="This page doesn't exist"
        action={
          <ButtonLink variant="primary" size="sm" to="/">
            Go to Home
          </ButtonLink>
        }
      >
        Check the address, or start from Home.
      </EmptyState>
    </div>
  );
}
