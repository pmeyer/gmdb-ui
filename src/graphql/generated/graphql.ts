/**
 * Identifies an artist to match while searching songs. A criterion can match either the artist's direct song association
 * or the artist's album-artist association through the song's album.
 */
export type ArtistMatchCriteria = {
  /** Artist id to match. */
  id: unknown;
  /**
   * Optional roles to match for this artist. When omitted or empty, the artist id is matched without considering role.
   * When supplied, any one of the supplied roles may match. ALBUM_ARTIST matches the song's album artist; the other roles
   * match the artist's direct song roles.
   */
  roles?: Array<ArtistSearchRole> | null | undefined;
};

/**
 * Artist roles that can be used by artist and song search criteria. WORDS_BY, MUSIC_BY, and PERFORMED_BY refer to direct
 * song artist roles. ALBUM_ARTIST refers to the primary artist associated with a song's album.
 */
export type ArtistSearchRole =
  /** Artist is the primary artist on the song's album. */
  | 'ALBUM_ARTIST'
  /** Artist wrote the music. */
  | 'MUSIC_BY'
  /** Artist performed the transcribed song. */
  | 'PERFORMED_BY'
  /** Artist wrote the words or lyrics. */
  | 'WORDS_BY';

/** Artist classification. */
export type ArtistType =
  /** Artist is a band or group. */
  | 'BAND'
  /** Artist is a person. */
  | 'PERSON';

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
  /** Publication id to match. */
  id?: unknown;
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

/** Roles an artist can have on a song. */
export type SongArtistRole =
  /** Artist wrote the music. */
  | 'MUSIC_BY'
  /** Artist performed the transcribed song. */
  | 'PERFORMED_BY'
  /** Artist wrote the words or lyrics. */
  | 'WORDS_BY';

/**
 * Criteria for songSearch. Top-level criteria fields are combined as filters. List criteria are ignored when omitted or
 * empty.
 */
export type SongSearchCriteria = {
  /** Case-insensitive pattern match against the title of the album on which a song appears. */
  albumSearch?: string | null | undefined;
  /** Return songs appearing on any of the supplied album ids. */
  albums?: Array<unknown> | null | undefined;
  /**
   * Case-insensitive pattern match against names of artists associated directly with the song or as the song album's
   * artist.
   */
  artistSearch?: string | null | undefined;
  /**
   * Return songs matching any supplied artist criterion. Each criterion may match a direct song artist or the album
   * artist for the song.
   */
  artists?: Array<ArtistMatchCriteria> | null | undefined;
  /** Case-insensitive pattern match against the publication index name of publications in which a song appears. */
  pubNameSearch?: string | null | undefined;
  /** Return songs transcribed in any of the supplied publication ids. */
  pubs?: Array<unknown> | null | undefined;
  /** Case-insensitive pattern match against the song title. */
  titleSearch?: string | null | undefined;
};
