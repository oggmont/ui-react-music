import { isApiError } from '@/api/client';

/** Turn an API error from POST/PATCH /playlists into what PlaylistFormDialog shows. */
export function playlistFormFailure(error) {
  if (isApiError(error, 422, 'playlist_limit_reached')) {
    return { formError: 'You have 20 playlists, the most allowed. Delete one to make a new one.' };
  }
  if (isApiError(error, 422) && error.details.length) {
    const fieldErrors = {};
    for (const { field, message } of error.details) {
      if (field === 'name' || field === 'description') fieldErrors[field] = message;
    }
    if (Object.keys(fieldErrors).length) return { fieldErrors };
  }
  return { formError: error?.message ?? 'Something went wrong. Try again.' };
}
