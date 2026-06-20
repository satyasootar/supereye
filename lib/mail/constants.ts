/** Emails fetched per Gmail API batch (list + full message bodies). */
export const MAIL_BATCH_SIZE = 30;

/** Batches to prefetch in the background after the first batch loads. */
export const MAIL_PREFETCH_BATCHES = 2;

/** Page size for the mail threads API and infinite-scroll UI. */
export const MAIL_THREADS_PAGE_SIZE = 30;

/** Stored in sync_state.last_sync_token when historical backfill is finished. */
export const MAIL_BACKFILL_COMPLETE = '__COMPLETE__';

/** Parallel Gmail messages.get calls per batch. */
export const MAIL_FETCH_CONCURRENCY = 8;
