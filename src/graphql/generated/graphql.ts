/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: unknown; output: unknown; }
  JSON: { input: unknown; output: unknown; }
  Long: { input: unknown; output: unknown; }
  Upload: { input: unknown; output: unknown; }
};

/** Album metadata. Cover art uploads must use the GraphQL multipart request specification. */
export type AlbumData = {
  /** Optional album cover art upload. Supplying a file stores or replaces the album art resource. */
  coverArt?: InputMaybe<Scalars['Upload']['input']>;
  /** Optional primary artist for the album. */
  primaryArtist?: InputMaybe<ArtistInput>;
  /** Album release date. */
  releaseDate?: InputMaybe<Scalars['Date']['input']>;
  /** Album title. */
  title: Scalars['String']['input'];
};

/**
 * Identifies an album by id or supplies data for a new or updated album. When data is supplied with an id, the existing
 * album is updated. When data is supplied without an id, natural matching may reuse an existing album.
 */
export type AlbumInput = {
  /** Data for a new album or for updating the referenced album. */
  data?: InputMaybe<AlbumData>;
  /** Existing album id. */
  id?: InputMaybe<Scalars['Long']['input']>;
};

export enum AlbumOrderBy {
  /** Sort by album artist name. */
  Artist = 'ARTIST',
  /** Sort by album release date. */
  ReleaseDate = 'RELEASE_DATE',
  /** Sort by album title. */
  Title = 'TITLE'
}

/**
 * Ordering option for albumSearch. Multiple order specs are applied in the order supplied, with album id added as a final
 * tiebreaker.
 */
export type AlbumOrderBySpec = {
  /** Album result column to order by. */
  column: AlbumOrderBy;
  /** Sort direction. When omitted, the database default direction is used. */
  direction?: InputMaybe<OrderByDirection>;
  /** Null ordering. When omitted, the database default null ordering is used. */
  nullsOrder?: InputMaybe<OrderByNulls>;
};

/**
 * Criteria for albumSearch. Criteria fields are combined as filters. Albums without a releaseDate are included when date
 * criteria are supplied.
 */
export type AlbumSearchCriteria = {
  /** Inclusive upper bound for album release date. */
  dateEnd?: InputMaybe<Scalars['Date']['input']>;
  /** Inclusive lower bound for album release date. */
  dateStart?: InputMaybe<Scalars['Date']['input']>;
  /** Ordered list of sort specifications. */
  orderBy?: InputMaybe<Array<AlbumOrderBySpec>>;
  /** Case-insensitive pattern match against album title or album artist name. */
  searchName?: InputMaybe<Scalars['String']['input']>;
};

/** Album search result. */
export type AlbumSearchResult = {
  __typename?: 'AlbumSearchResult';
  /** Relative resource URL for album art when one exists. */
  albumArtUrl?: Maybe<Scalars['String']['output']>;
  /** Primary album artist when one is associated with the album. */
  artist?: Maybe<Artist>;
  /** Album id. */
  id: Scalars['Long']['output'];
  /** Album release date, when known. */
  releaseDate?: Maybe<Scalars['Date']['output']>;
  /** Album title. */
  title: Scalars['String']['output'];
};

/** Song position on an album and the album to associate with the song. */
export type AlbumTrackInput = {
  /** Existing or new album information. */
  album: AlbumInput;
  /** Track number on the album for this song. */
  trackNumber: Scalars['Int']['input'];
};

/** Artist reference returned by search and nested result objects. */
export type Artist = {
  __typename?: 'Artist';
  /** Artist id. */
  id: Scalars['Long']['output'];
  /** Artist display name. */
  name: Scalars['String']['output'];
  /** Artist type. */
  type: ArtistType;
};

/** Artist metadata. */
export type ArtistData = {
  /** Artist display name. */
  name: Scalars['String']['input'];
  /** Artist type. */
  type: ArtistType;
};

/**
 * Identifies an artist by id or supplies data for a new or updated artist. When data is supplied with an id, the existing
 * artist is updated. When data is supplied without an id, natural matching by name and type may reuse an existing artist.
 */
export type ArtistInput = {
  /** Data for a new artist or for updating the referenced artist. */
  data?: InputMaybe<ArtistData>;
  /** Existing artist id. */
  id?: InputMaybe<Scalars['Long']['input']>;
};

/**
 * Identifies an artist to match while searching songs. A criterion can match either the artist's direct song association
 * or the artist's album-artist association through the song's album.
 */
export type ArtistMatchCriteria = {
  /** Artist id to match. */
  id: Scalars['Long']['input'];
  /**
   * Optional roles to match for this artist. When omitted or empty, the artist id is matched without considering role.
   * When supplied, any one of the supplied roles may match. ALBUM_ARTIST matches the song's album artist; the other roles
   * match the artist's direct song roles.
   */
  roles?: InputMaybe<Array<ArtistSearchRole>>;
};

export enum ArtistOrderBy {
  /** Sort by artist name alphabetically. */
  Name = 'NAME',
  /** Sort by artist name using title-sort semantics, ignoring leading The, A, or An. */
  NameTitleSort = 'NAME_TITLE_SORT',
  /** Sort by artist type. */
  Type = 'TYPE'
}

/** Ordering option for artistSearch. Multiple order specs are applied in the order supplied. */
export type ArtistOrderBySpec = {
  /** Artist result column to order by. */
  column: ArtistOrderBy;
  /** Sort direction. When omitted, the database default direction is used. */
  direction?: InputMaybe<OrderByDirection>;
  /** Null ordering. When omitted, the database default null ordering is used. */
  nullsOrder?: InputMaybe<OrderByNulls>;
};

/** Criteria for artistSearch. Criteria fields are combined as filters. */
export type ArtistSearchCriteria = {
  /** Ordered list of sort specifications. */
  orderBy?: InputMaybe<Array<ArtistOrderBySpec>>;
  /**
   * When true, return only artists associated with songs that have at least one transcription. When false or omitted, no
   * transcription filter is applied.
   */
  restrictToTranscribedArtists?: InputMaybe<Scalars['Boolean']['input']>;
  /** Return artists matching any of the supplied roles. Omit this field to avoid filtering by role. */
  roles?: InputMaybe<Array<ArtistSearchRole>>;
  /** Case-insensitive pattern match against artist name. */
  searchName?: InputMaybe<Scalars['String']['input']>;
  /** Return artists of the supplied type. */
  type?: InputMaybe<ArtistType>;
};

/** Artist search result, including the roles that caused or describe the match. */
export type ArtistSearchResult = {
  __typename?: 'ArtistSearchResult';
  /** Artist id. */
  id: Scalars['Long']['output'];
  /** Roles matched or represented for this artist in the result set. */
  matchedRoles: Array<ArtistSearchRole>;
  /** Artist display name. */
  name: Scalars['String']['output'];
  /** Artist type. */
  type: ArtistType;
};

/**
 * Artist roles that can be used by artist and song search criteria. WORDS_BY, MUSIC_BY, and PERFORMED_BY refer to direct
 * song artist roles. ALBUM_ARTIST refers to the primary artist associated with a song's album.
 */
export enum ArtistSearchRole {
  /** Artist is the primary artist on the song's album. */
  AlbumArtist = 'ALBUM_ARTIST',
  /** Artist wrote the music. */
  MusicBy = 'MUSIC_BY',
  /** Artist performed the transcribed song. */
  PerformedBy = 'PERFORMED_BY',
  /** Artist wrote the words or lyrics. */
  WordsBy = 'WORDS_BY'
}

/** Artist classification. */
export enum ArtistType {
  /** Artist is a band or group. */
  Band = 'BAND',
  /** Artist is a person. */
  Person = 'PERSON'
}

/** Book edition details. */
export type BookDetails = PubDetails & {
  __typename?: 'BookDetails';
  /** Relative resource URL for publication cover art when one exists. */
  cover?: Maybe<Scalars['String']['output']>;
  /** Book edition name or number. */
  edition?: Maybe<Scalars['String']['output']>;
};

/** Book edition metadata. Cover uploads must use the GraphQL multipart request specification. */
export type BookEditionInput = {
  /** Optional book cover image upload. Supplying a file stores or replaces the publication cover resource. */
  cover?: InputMaybe<Scalars['Upload']['input']>;
  /** Edition name or number. */
  edition?: InputMaybe<Scalars['String']['input']>;
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
  pubDate?: InputMaybe<Scalars['Date']['input']>;
  /** Optional transcriptions appearing in the book edition. */
  transcriptions?: InputMaybe<Array<TranscriptionInput>>;
};

/** Magazine issue details. */
export type MagDetails = PubDetails & {
  __typename?: 'MagDetails';
  /** Relative resource URL for publication cover art when one exists. */
  cover?: Maybe<Scalars['String']['output']>;
  /** Magazine issue number. */
  issue?: Maybe<Scalars['String']['output']>;
  /** Magazine issue display name. */
  issueName?: Maybe<Scalars['String']['output']>;
  /** Magazine volume. */
  volume?: Maybe<Scalars['String']['output']>;
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
  pubDate?: InputMaybe<Scalars['Date']['input']>;
  /** Optional transcriptions appearing in the magazine issue. */
  transcriptions?: InputMaybe<Array<TranscriptionInput>>;
};

/** Magazine issue metadata. Cover uploads must use the GraphQL multipart request specification. */
export type MagazineIssueInput = {
  /** Optional magazine cover image upload. Supplying a file stores or replaces the publication cover resource. */
  cover?: InputMaybe<Scalars['Upload']['input']>;
  /** Magazine issue number or sequence within a volume. */
  issue?: InputMaybe<Scalars['String']['input']>;
  /** Display name for the issue. */
  issueName: Scalars['String']['input'];
  /** Magazine volume, typically a number or short label. */
  volume?: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Adds or updates a book edition, optionally including its cover image and initial song transcriptions. */
  addBookEdition: PubSearchResult;
  /** Adds or updates a magazine issue, optionally including its cover image and initial song transcriptions. */
  addMagazineIssue: PubSearchResult;
  /** Replaces or adds the cover image for an existing publication. */
  addPubCoverImage: PubSearchResult;
  /**
   * Adds or updates a song transcription in an existing publication. The operation upserts the song, optional album,
   * optional artists, transcription row, and optional transcriber associations based on the supplied input.
   */
  addTranscription: PubTranscription;
  /** Inserts, updates, or resolves a publication index entry. */
  upsertPubIndex: PubIndexResult;
};


export type MutationAddBookEditionArgs = {
  bookInput: BookInput;
};


export type MutationAddMagazineIssueArgs = {
  magInput: MagazineInput;
};


export type MutationAddPubCoverImageArgs = {
  imgInput: PubCoverImageInput;
};


export type MutationAddTranscriptionArgs = {
  pubId: Scalars['Long']['input'];
  transcriptionInput: TranscriptionInput;
};


export type MutationUpsertPubIndexArgs = {
  pubIndexInput: PubIndexInput;
};

/** Sort direction for order-by specifications. */
export enum OrderByDirection {
  /** Sort from lowest to highest values. */
  Asc = 'ASC',
  /** Sort from highest to lowest values. */
  Desc = 'DESC'
}

/** Null placement for order-by specifications. */
export enum OrderByNulls {
  /** Place null values before non-null values. */
  NullsFirst = 'NULLS_FIRST',
  /** Place null values after non-null values. */
  NullsLast = 'NULLS_LAST'
}

/** Input for storing or replacing a cover image on an existing publication. */
export type PubCoverImageInput = {
  /** Cover image file. The request must use the GraphQL multipart request specification. */
  cover: Scalars['Upload']['input'];
  /** Existing publication id. */
  id: Scalars['Long']['input'];
};

/** Common publication details interface. The cover field is a relative resource URL when a cover image exists. */
export type PubDetails = {
  /** Relative resource URL for publication cover art when one exists. */
  cover?: Maybe<Scalars['String']['output']>;
};

/** Criteria for getPubIndices. */
export type PubIndexCriteria = {
  /** Return publication index entries of the supplied publication type. */
  type?: InputMaybe<PubType>;
};

/** Publication index data shared by book editions and magazine issues. */
export type PubIndexData = {
  /** Publication title. */
  name: Scalars['String']['input'];
  /** Serial identifier for the publication index, typically ISBN for books. */
  serial: Scalars['String']['input'];
  /** Publication type. Magazine issue mutations require MAG; book edition mutations require BOOK. */
  type: PubType;
};

/**
 * Identifies a publication index by id or supplies data for a new or updated index. When data is supplied with an id, the
 * existing index is updated. When data is supplied without an id, natural matching may reuse an existing index.
 */
export type PubIndexInput = {
  /** Data for a new index or for updating the referenced index. */
  data?: InputMaybe<PubIndexData>;
  /** Existing publication index id. */
  id?: InputMaybe<Scalars['Long']['input']>;
};

/** Publication index result. */
export type PubIndexResult = {
  __typename?: 'PubIndexResult';
  /** Publication index id. */
  id: Scalars['Long']['output'];
  /** Publication index name. */
  name: Scalars['String']['output'];
  /** Publication serial number. */
  serialNumber: Scalars['String']['output'];
  /** Publication type. */
  type: PubType;
};

/**
 * Criteria for pubSearch. Criteria fields are combined as filters. Publications without a pubDate are included when date
 * criteria are supplied.
 */
export type PubSearchCriteria = {
  /** Inclusive upper bound for publication date. */
  dateEnd?: InputMaybe<Scalars['Date']['input']>;
  /** Inclusive lower bound for publication date. */
  dateStart?: InputMaybe<Scalars['Date']['input']>;
  /**
   * When true, return only publications with at least one transcription. When false or omitted, no transcription filter
   * is applied.
   */
  hasTranscriptions?: InputMaybe<Scalars['Boolean']['input']>;
  /** Case-insensitive pattern match against publication index name, magazine issue name, or book edition. */
  searchName?: InputMaybe<Scalars['String']['input']>;
  /** Return publications of the supplied type. */
  type?: InputMaybe<PubType>;
};

/** Publication search result. The details concrete type depends on the publication type. */
export type PubSearchResult = {
  __typename?: 'PubSearchResult';
  /** Publication-specific details. */
  details: PubDetails;
  /** Publication id. */
  id: Scalars['Long']['output'];
  /** Publication index name. */
  name: Scalars['String']['output'];
  /** Publication date, when known. */
  pubDate?: Maybe<Scalars['Date']['output']>;
  /** Publication index id. */
  pubIndexId: Scalars['Long']['output'];
  /** Publication index serial number. */
  serialNumber: Scalars['String']['output'];
  /** Transcriptions appearing in this publication. */
  transcriptions?: Maybe<Array<PubTranscription>>;
  /** Publication type. */
  type: PubType;
};

/** Transcription data returned with publication-oriented operations. */
export type PubTranscription = {
  __typename?: 'PubTranscription';
  /** Transcription id. */
  id: Scalars['Long']['output'];
  /** First page of the transcription within the publication. */
  pageNumber?: Maybe<Scalars['Int']['output']>;
  /** Song being transcribed. */
  song: Song;
  /** Transcribers credited for this transcription. */
  transcribers?: Maybe<Array<Transcriber>>;
  /** Relative resource URL for the transcription file when one exists. */
  url?: Maybe<Scalars['String']['output']>;
};

/** Type of publication represented by a publication index or publication result. */
export enum PubType {
  /** Book publication. */
  Book = 'BOOK',
  /** Periodically issued magazine publication. */
  Mag = 'MAG'
}

export type Query = {
  __typename?: 'Query';
  /**
   * Finds albums matching the supplied criteria. Criteria fields are combined as filters; omit criteria or pass an empty
   * criteria object to return the unfiltered album set.
   */
  albumSearch: Array<AlbumSearchResult>;
  /**
   * Finds artists with song or album associations. Criteria fields are combined as filters; omit criteria or pass an
   * empty criteria object to return the unfiltered artist set.
   */
  artistSearch: Array<ArtistSearchResult>;
  /**
   * Returns publication index entries, optionally filtered by publication type. Results are ordered by publication index
   * name ascending.
   */
  getPubIndices: Array<PubIndexResult>;
  /**
   * Finds publications such as books and magazine issues. Criteria fields are combined as filters; omit criteria or pass
   * an empty criteria object to return the unfiltered publication set in the default publication order.
   */
  pubSearch: Array<PubSearchResult>;
  /**
   * Finds songs matching the supplied criteria. Criteria fields are combined as filters; omit criteria or pass an empty
   * criteria object to return the unfiltered song set.
   */
  songSearch: Array<SongSearchResult>;
  /**
   * Finds transcribers. When searchName is supplied, it is matched against transcriber names using a case-insensitive
   * pattern match; omit searchName to return all transcribers.
   */
  transcriberSearch: Array<Transcriber>;
};


export type QueryAlbumSearchArgs = {
  criteria?: AlbumSearchCriteria;
};


export type QueryArtistSearchArgs = {
  criteria?: ArtistSearchCriteria;
};


export type QueryGetPubIndicesArgs = {
  criteria?: PubIndexCriteria;
};


export type QueryPubSearchArgs = {
  criteria?: PubSearchCriteria;
};


export type QuerySongSearchArgs = {
  criteria?: SongSearchCriteria;
};


export type QueryTranscriberSearchArgs = {
  searchName?: InputMaybe<Scalars['String']['input']>;
};

/** Song data returned as a nested object from other result types. */
export type Song = {
  __typename?: 'Song';
  /** Album track context when the song is associated with an album. */
  album?: Maybe<SongAlbum>;
  /** Artists directly associated with the song. */
  artists?: Maybe<Array<SongArtist>>;
  /** Song id. */
  id: Scalars['Long']['output'];
  /** Song title. */
  title: Scalars['String']['output'];
};

/** Album context for a song, including the song's track number on that album. */
export type SongAlbum = {
  __typename?: 'SongAlbum';
  /** Relative resource URL for album art when cover art exists. */
  albumArtUrl?: Maybe<Scalars['String']['output']>;
  /** Primary album artist when one is associated with the album. */
  artist?: Maybe<Artist>;
  /** Album id. */
  id: Scalars['Long']['output'];
  /** Album release date. */
  releaseDate?: Maybe<Scalars['Date']['output']>;
  /** Album title. */
  title: Scalars['String']['output'];
  /** Song track number on this album. */
  trackNumber?: Maybe<Scalars['Int']['output']>;
};

/** Artist associated directly with a song and the roles the artist has on that song. */
export type SongArtist = {
  __typename?: 'SongArtist';
  /** Artist id. */
  id: Scalars['Long']['output'];
  /** Artist display name. */
  name: Scalars['String']['output'];
  /** Direct song roles for this artist. */
  roles: Array<SongArtistRole>;
  /** Artist type. */
  type: ArtistType;
};

/** Identifies or supplies an artist directly associated with a song. */
export type SongArtistInput = {
  /** Data for a new artist or for updating the referenced artist. */
  data?: InputMaybe<ArtistData>;
  /** Existing artist id. */
  id?: InputMaybe<Scalars['Long']['input']>;
  /** Roles this artist has on the song. */
  roles: Array<SongArtistRole>;
};

/** Roles an artist can have on a song. */
export enum SongArtistRole {
  /** Artist wrote the music. */
  MusicBy = 'MUSIC_BY',
  /** Artist performed the transcribed song. */
  PerformedBy = 'PERFORMED_BY',
  /** Artist wrote the words or lyrics. */
  WordsBy = 'WORDS_BY'
}

/** Song metadata and optional related album and artist data. */
export type SongData = {
  /** Optional album track data for the song. */
  albumTrack?: InputMaybe<AlbumTrackInput>;
  /** Artists associated directly with the song and their roles. Omit this field to leave existing associations unchanged. */
  artists?: InputMaybe<Array<SongArtistInput>>;
  /** Song title. */
  title: Scalars['String']['input'];
};

/**
 * Identifies a song by id or supplies data for a new or updated song. When data is supplied with an id, the existing song
 * is updated. When data is supplied without an id, natural matching may reuse an existing song.
 */
export type SongInput = {
  /** Data for a new song or for updating the referenced song. */
  data?: InputMaybe<SongData>;
  /** Existing song id. */
  id?: InputMaybe<Scalars['Long']['input']>;
};

/**
 * Criteria for songSearch. Top-level criteria fields are combined as filters. List criteria are ignored when omitted or
 * empty.
 */
export type SongSearchCriteria = {
  /** Case-insensitive pattern match against the title of the album on which a song appears. */
  albumSearch?: InputMaybe<Scalars['String']['input']>;
  /** Return songs appearing on any of the supplied album ids. */
  albums?: InputMaybe<Array<Scalars['Long']['input']>>;
  /**
   * Case-insensitive pattern match against names of artists associated directly with the song or as the song album's
   * artist.
   */
  artistSearch?: InputMaybe<Scalars['String']['input']>;
  /**
   * Return songs matching any supplied artist criterion. Each criterion may match a direct song artist or the album
   * artist for the song.
   */
  artists?: InputMaybe<Array<ArtistMatchCriteria>>;
  /** Case-insensitive pattern match against the publication index name of publications in which a song appears. */
  pubNameSearch?: InputMaybe<Scalars['String']['input']>;
  /** Return songs transcribed in any of the supplied publication ids. */
  pubs?: InputMaybe<Array<Scalars['Long']['input']>>;
  /** Case-insensitive pattern match against the song title. */
  titleSearch?: InputMaybe<Scalars['String']['input']>;
};

/** Song search result with optional album, artist, and transcription details. */
export type SongSearchResult = {
  __typename?: 'SongSearchResult';
  /** Album track context when the song is associated with an album. */
  album?: Maybe<SongAlbum>;
  /** Artists directly associated with the song. */
  artists?: Maybe<Array<SongArtist>>;
  /** Song id. */
  id: Scalars['Long']['output'];
  /** Song title. */
  title: Scalars['String']['output'];
  /** Transcriptions for this song. */
  transcriptions?: Maybe<Array<Transcription>>;
};

/** Transcriber reference. */
export type Transcriber = {
  __typename?: 'Transcriber';
  /** Transcriber id. */
  id: Scalars['Long']['output'];
  /** Transcriber display name. */
  name: Scalars['String']['output'];
};

/**
 * Identifies a transcriber by id or supplies a name for a new or updated transcriber. Natural matching by name may reuse an
 * existing transcriber.
 */
export type TranscriberInput = {
  /** Existing transcriber id. */
  id?: InputMaybe<Scalars['Long']['input']>;
  /** Transcriber name. */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Transcription data returned with song search results. */
export type Transcription = {
  __typename?: 'Transcription';
  /** Transcription id. */
  id: Scalars['Long']['output'];
  /** First page of the transcription within the publication. */
  pageNumber?: Maybe<Scalars['Int']['output']>;
  /** Publication containing the transcription. */
  pub?: Maybe<TranscriptionPub>;
  /** Transcribers credited for this transcription. */
  transcribers?: Maybe<Array<Transcriber>>;
  /** Relative resource URL for the transcription file when one exists. */
  url?: Maybe<Scalars['String']['output']>;
};

/**
 * Input for adding or updating a transcription for a song in a publication. The transcription is uniquely resolved by the
 * song and publication.
 */
export type TranscriptionInput = {
  /** Optional transcription file upload. Supplying a file stores or replaces the transcription resource. */
  file?: InputMaybe<Scalars['Upload']['input']>;
  /** First page of the transcription within the publication. */
  pageNumber: Scalars['Int']['input'];
  /** Existing or new song being transcribed. */
  song: SongInput;
  /**
   * Optional transcriber list. When omitted, existing associations are left alone for an update; when supplied as an
   * empty list, existing transcriber associations are removed.
   */
  transcribers?: InputMaybe<Array<TranscriberInput>>;
};

/** Publication data returned with a transcription. */
export type TranscriptionPub = {
  __typename?: 'TranscriptionPub';
  /** Publication-specific details. */
  details: PubDetails;
  /** Publication id. */
  id: Scalars['Long']['output'];
  /** Publication index name. */
  name: Scalars['String']['output'];
  /** Publication date, when known. */
  pubDate?: Maybe<Scalars['Date']['output']>;
  /** Publication index id. */
  pubIndexId: Scalars['Long']['output'];
  /** Publication index serial number. */
  serialNumber: Scalars['String']['output'];
  /** Publication type. */
  type: PubType;
};
