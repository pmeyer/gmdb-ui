/**
 * Criteria for pubSearch. Criteria fields are combined as filters. Publications without a pubDate are included when date
 * criteria are supplied.
 */
export type PubSearchCriteria = {
  /** Inclusive upper bound for publication date. */
  dateEnd?: unknown;
  /** Inclusive lower bound for publication date. */
  dateStart?: unknown;
  /**
   * When true, return only publications with at least one transcription. When false or omitted, no transcription filter
   * is applied.
   */
  hasTranscriptions?: boolean | null | undefined;
  /** Case-insensitive pattern match against publication index name, magazine issue name, or book edition. */
  searchName?: string | null | undefined;
  /** Return publications of the supplied type. */
  type?: PubType | null | undefined;
};

/** Type of publication represented by a publication index or publication result. */
export type PubType =
  /** Book publication. */
  | 'BOOK'
  /** Periodically issued magazine publication. */
  | 'MAG';
