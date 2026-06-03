/** Album metadata. Cover art uploads must use the GraphQL multipart request specification. */
export type AlbumData = {
  /** Optional album cover art upload. Supplying a file stores or replaces the album art resource. */
  coverArt?: unknown;
  /** Optional primary artist for the album. */
  primaryArtist?: ArtistInput | null | undefined;
  /** Album release date. */
  releaseDate?: unknown;
  /** Album title. */
  title: string;
};

/**
 * Identifies an album by id or supplies data for a new or updated album. When data is supplied with an id, the existing
 * album is updated. When data is supplied without an id, natural matching may reuse an existing album.
 */
export type AlbumInput = {
  /** Data for a new album or for updating the referenced album. */
  data?: AlbumData | null | undefined;
  /** Existing album id. */
  id?: unknown;
};

/** Song position on an album and the album to associate with the song. */
export type AlbumTrackInput = {
  /** Existing or new album information. */
  album: AlbumInput;
  /** Track number on the album for this song. */
  trackNumber: number;
};

/** Artist metadata. */
export type ArtistData = {
  /** Artist display name. */
  name: string;
  /** Artist type. */
  type: ArtistType;
};

/**
 * Identifies an artist by id or supplies data for a new or updated artist. When data is supplied with an id, the existing
 * artist is updated. When data is supplied without an id, natural matching by name and type may reuse an existing artist.
 */
export type ArtistInput = {
  /** Data for a new artist or for updating the referenced artist. */
  data?: ArtistData | null | undefined;
  /** Existing artist id. */
  id?: unknown;
};

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

/** Book edition metadata. Cover uploads must use the GraphQL multipart request specification. */
export type BookEditionInput = {
  /** Optional book cover image upload. Supplying a file stores or replaces the publication cover resource. */
  cover?: unknown;
  /** Edition name or number. */
  edition?: string | null | undefined;
};

/**
 * Input for adding or updating a book edition. The publication index identifies the book title, while info carries
 * edition-specific metadata.
 */
export type BookInput = {
  /** Existing or new publication index for the book title. */
  index: PubIndexInput;
  /** Book edition-specific metadata. */
  info?: BookEditionInput;
  /** Date associated with this book edition. When omitted, the publication is stored without a publication date. */
  pubDate?: unknown;
  /** Optional transcriptions appearing in the book edition. */
  transcriptions?: Array<TranscriptionInput> | null | undefined;
};

/**
 * Input for adding or updating a magazine issue. The publication index identifies the magazine title, while info carries
 * issue-specific metadata.
 */
export type MagazineInput = {
  /** Existing or new publication index for the magazine title. */
  index: PubIndexInput;
  /** Magazine issue-specific metadata. */
  info: MagazineIssueInput;
  /** Date associated with this magazine issue. When omitted, the publication is stored without a publication date. */
  pubDate?: unknown;
  /** Optional transcriptions appearing in the magazine issue. */
  transcriptions?: Array<TranscriptionInput> | null | undefined;
};

/** Magazine issue metadata. Cover uploads must use the GraphQL multipart request specification. */
export type MagazineIssueInput = {
  /** Optional magazine cover image upload. Supplying a file stores or replaces the publication cover resource. */
  cover?: unknown;
  /** Magazine issue number or sequence within a volume. */
  issue?: string | null | undefined;
  /** Display name for the issue. */
  issueName: string;
  /** Magazine volume, typically a number or short label. */
  volume?: string | null | undefined;
};

/** Criteria for getPubIndices. */
export type PubIndexCriteria = {
  /** Return publication index entries of the supplied publication type. */
  type?: PubType | null | undefined;
};

/** Publication index data shared by book editions and magazine issues. */
export type PubIndexData = {
  /** Publication title. */
  name: string;
  /** Serial identifier for the publication index, typically ISBN for books. */
  serial: string;
  /** Publication type. Magazine issue mutations require MAG; book edition mutations require BOOK. */
  type: PubType;
};

/**
 * Identifies a publication index by id or supplies data for a new or updated index. When data is supplied with an id, the
 * existing index is updated. When data is supplied without an id, natural matching may reuse an existing index.
 */
export type PubIndexInput = {
  /** Data for a new index or for updating the referenced index. */
  data?: PubIndexData | null | undefined;
  /** Existing publication index id. */
  id?: unknown;
};

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

/** Identifies or supplies an artist directly associated with a song. */
export type SongArtistInput = {
  /** Data for a new artist or for updating the referenced artist. */
  data?: ArtistData | null | undefined;
  /** Existing artist id. */
  id?: unknown;
  /** Roles this artist has on the song. */
  roles: Array<SongArtistRole>;
};

/** Roles an artist can have on a song. */
export type SongArtistRole =
  /** Artist wrote the music. */
  | 'MUSIC_BY'
  /** Artist performed the transcribed song. */
  | 'PERFORMED_BY'
  /** Artist wrote the words or lyrics. */
  | 'WORDS_BY';

/** Song metadata and optional related album and artist data. */
export type SongData = {
  /** Optional album track data for the song. */
  albumTrack?: AlbumTrackInput | null | undefined;
  /** Artists associated directly with the song and their roles. Omit this field to leave existing associations unchanged. */
  artists?: Array<SongArtistInput> | null | undefined;
  /** Song title. */
  title: string;
};

/**
 * Identifies a song by id or supplies data for a new or updated song. When data is supplied with an id, the existing song
 * is updated. When data is supplied without an id, natural matching may reuse an existing song.
 */
export type SongInput = {
  /** Data for a new song or for updating the referenced song. */
  data?: SongData | null | undefined;
  /** Existing song id. */
  id?: unknown;
};

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

/**
 * Identifies a transcriber by id or supplies a name for a new or updated transcriber. Natural matching by name may reuse an
 * existing transcriber.
 */
export type TranscriberInput = {
  /** Existing transcriber id. */
  id?: unknown;
  /** Transcriber name. */
  name?: string | null | undefined;
};

/**
 * Input for adding or updating a transcription for a song in a publication. The transcription is uniquely resolved by the
 * song and publication.
 */
export type TranscriptionInput = {
  /** Optional transcription file upload. Supplying a file stores or replaces the transcription resource. */
  file?: unknown;
  /** First page of the transcription within the publication. */
  pageNumber: number;
  /** Existing or new song being transcribed. */
  song: SongInput;
  /**
   * Optional transcriber list. When omitted, existing associations are left alone for an update; when supplied as an
   * empty list, existing transcriber associations are removed.
   */
  transcribers?: Array<TranscriberInput> | null | undefined;
};
