import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaylistFormDialog } from './PlaylistFormDialog';

function setup(props = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(<PlaylistFormDialog ownedCount={9} onSubmit={onSubmit} onClose={onClose} {...props} />);
  return { onSubmit, onClose, user: userEvent.setup() };
}

describe('PlaylistFormDialog', () => {
  it('creates: Create stays disabled until the name has a non-space character', async () => {
    const { user, onSubmit } = setup();
    expect(screen.getByRole('dialog', { name: 'New playlist' })).toBeInTheDocument();
    const name = screen.getByLabelText('Name');
    expect(name).toHaveFocus();
    const create = screen.getByRole('button', { name: 'Create' });
    expect(create).toBeDisabled();

    await user.type(name, '   ');
    expect(create).toBeDisabled();
    await user.clear(name);
    await user.type(name, 'Sunday Morning');
    expect(screen.getByText('14/120')).toBeInTheDocument();
    expect(screen.getByText(/You have 9 of 20 playlists/)).toBeInTheDocument();

    await user.click(create);
    expect(onSubmit).toHaveBeenCalledWith(
      { name: 'Sunday Morning', description: '' },
      { name: 'Sunday Morning' },
    );
  });

  it('asks before discarding what was typed', async () => {
    const { user, onClose } = setup();
    await user.type(screen.getByLabelText('Name'), 'Draft');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('alertdialog', { name: 'Discard this playlist?' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes at once when nothing was typed', async () => {
    const { user, onClose } = setup();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('edits: Save stays disabled until something changes, and sends only the changes', async () => {
    const { user, onSubmit } = setup({
      mode: 'edit',
      initial: { name: 'Road Trip', description: 'Songs for the drive.' },
    });
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText(/Description/), ' Add yours!');
    await user.click(save);
    expect(onSubmit).toHaveBeenCalledWith(
      { name: 'Road Trip', description: 'Songs for the drive. Add yours!' },
      { description: 'Songs for the drive. Add yours!' },
    );
  });

  it('shows errors and reloads the values when the playlist changed meanwhile (412)', async () => {
    const onSubmit = vi.fn().mockRejectedValue({
      reload: { name: 'Road Trip!', description: '' },
      formError: 'This playlist changed while you were editing. Check the details and save again.',
    });
    const { user } = setup({ mode: 'edit', initial: { name: 'Road Trip', description: '' }, onSubmit });
    await user.type(screen.getByLabelText('Name'), ' 2');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This playlist changed');
    expect(screen.getByLabelText('Name')).toHaveValue('Road Trip!');
  });
});
