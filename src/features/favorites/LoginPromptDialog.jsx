import { useLocation } from 'react-router';
import { ButtonLink } from '@/components/Button';
import { Modal, ModalActions } from '@/components/Modal';

/** Signed out on a public page: actions that need an account ask you to log in first. */
export function LoginPromptDialog({ open, onOpenChange }) {
  const location = useLocation();
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Log in to favorite playlists"
      description="Favorites appear on your profile. You can keep up to 5."
    >
      <ModalActions>
        <ButtonLink variant="ghost" to="/signup">
          Sign up
        </ButtonLink>
        <ButtonLink variant="primary" to="/login" state={{ from: location }} data-primary>
          Log in
        </ButtonLink>
      </ModalActions>
    </Modal>
  );
}
