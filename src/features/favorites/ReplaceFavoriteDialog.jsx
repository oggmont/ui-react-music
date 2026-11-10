import { useState } from 'react';
import { Button } from '@/components/Button';
import { Cover } from '@/components/Cover';
import { Modal, ModalActions } from '@/components/Modal';
import { byOwner } from '@/lib/format';
import { replaceConsequence } from '@/lib/rules';
import { sortByName } from '@/lib/text';
import styles from './ReplaceFavoriteDialog.module.css';

/**
 * Favoriting a sixth playlist (D-07): pick one of your five to swap out. Each row says what
 * happens to that playlist (BR-12). Never fails silently.
 */
export function ReplaceFavoriteDialog({ incoming, favorites, me, onCancel, onReplace }) {
  const [pickedId, setPickedId] = useState(null);
  const picked = favorites.find((f) => f.playlist_id === pickedId);

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onCancel()}
      title="Your favorites are full"
      description={
        <>
          You can have 5. Pick one to replace with <b className={styles.strong}>{incoming.name}</b>.
        </>
      }
    >
      <div className={styles.list} role="radiogroup" aria-label="Favorite to replace">
        {sortByName(favorites).map((favorite) => (
          <label key={favorite.playlist_id} className={styles.pick}>
            <Cover playlist={favorite} className={styles.cover} />
            <span className={styles.text}>
              <b>{favorite.name}</b>
              <span className={styles.meta}>
                {byOwner(favorite.owner, me)} · {replaceConsequence(favorite, me)}
              </span>
            </span>
            <input
              type="radio"
              name="replace-favorite"
              value={favorite.playlist_id}
              checked={pickedId === favorite.playlist_id}
              onChange={() => setPickedId(favorite.playlist_id)}
            />
          </label>
        ))}
      </div>
      <ModalActions>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" data-primary disabled={!picked} onClick={() => onReplace(picked)}>
          Replace
        </Button>
      </ModalActions>
    </Modal>
  );
}
