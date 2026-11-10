import { Lock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { ConfirmDialog, Modal, ModalActions } from '@/components/Modal';
import { MAX_PLAYLISTS, PLAYLIST_DESCRIPTION_MAX, PLAYLIST_NAME_MAX } from '@/lib/limits';
import styles from './PlaylistFormDialog.module.css';

/**
 * S5 Create playlist and the Edit details dialog: one form, name and description.
 *
 * `onSubmit({ name, description }, changes)` returns a promise. If it rejects with
 * `{ fieldErrors, formError, reload }`, the dialog shows them (and reloads the values on a 412).
 */
export function PlaylistFormDialog({ mode = 'create', initial, ownedCount, track, onSubmit, onClose }) {
  const editing = mode === 'edit';
  const [baseline, setBaseline] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
  });
  const [name, setName] = useState(baseline.name);
  const [description, setDescription] = useState(baseline.description);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const dirty = name !== baseline.name || description !== baseline.description;
  const canSubmit = name.trim().length > 0 && (!editing || dirty) && !submitting;

  function requestClose() {
    if (dirty && !submitting) setConfirmDiscard(true);
    else onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    const values = { name: name.trim(), description: description.trim() };
    const changes = {};
    if (values.name !== baseline.name.trim()) changes.name = values.name;
    if (values.description !== baseline.description.trim()) changes.description = values.description || null;
    setSubmitting(true);
    setErrors({});
    try {
      await onSubmit(values, changes);
    } catch (failure) {
      if (failure?.reload) {
        setBaseline(failure.reload);
        setName(failure.reload.name);
        setDescription(failure.reload.description);
      }
      setErrors({ ...(failure?.fieldErrors ?? {}), form: failure?.formError });
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal
        open
        onOpenChange={(open) => !open && requestClose()}
        title={editing ? 'Edit details' : 'New playlist'}
        description={track ? `“${track.name}” will be the first song.` : undefined}
      >
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Field
            label="Name"
            value={name}
            maxLength={PLAYLIST_NAME_MAX}
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            counter={`${name.length}/${PLAYLIST_NAME_MAX}`}
            data-autofocus
          />
          <Field
            label="Description"
            optional
            multiline
            value={description}
            maxLength={PLAYLIST_DESCRIPTION_MAX}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
            counter={`${description.length}/${PLAYLIST_DESCRIPTION_MAX}`}
          />
          {editing ? (
            <p className={styles.note}>Public while anyone has it as a favorite, private otherwise.</p>
          ) : (
            <p className={styles.note}>
              <Lock size={16} aria-hidden="true" />
              <span>
                Private: only you can see it. Favorite it to make it public.
                {ownedCount != null && ` You have ${ownedCount} of ${MAX_PLAYLISTS} playlists.`}
              </span>
            </p>
          )}
          {errors.form && (
            <p className={styles.formError} role="alert">
              {errors.form}
            </p>
          )}
          <ModalActions>
            <Button variant="ghost" onClick={requestClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!canSubmit}>
              {editing ? (submitting ? 'Saving…' : 'Save') : submitting ? 'Creating…' : 'Create'}
            </Button>
          </ModalActions>
        </form>
      </Modal>
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title={editing ? 'Discard your changes?' : 'Discard this playlist?'}
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        confirmVariant="danger"
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
      >
        <p>What you typed will be lost.</p>
      </ConfirmDialog>
    </>
  );
}
