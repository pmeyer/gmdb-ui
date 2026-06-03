import dayjs from "dayjs";

import type { SongArtistRole } from "../../graphql/generated/graphql";
import type { TranscriptionDetailCatalogQuery } from "./TranscriptionDetailView.generated";

type PublicationResult = TranscriptionDetailCatalogQuery["pubSearch"][number];
type TranscriptionResult = NonNullable<PublicationResult["transcriptions"]>[number];
type SongArtist = NonNullable<TranscriptionResult["song"]["artists"]>[number];

interface MetadataItem {
  label: string;
  value: string;
}

export interface ArtistRoleGroup {
  label: string;
  artists: string[];
}

export interface TranscriptionDetailSummary {
  id: string;
  songTitle: string;
  sourcePublication: string;
  sourcePublicationType: string;
  sourceCoverUrl?: string;
  publicationMetadata: MetadataItem[];
  pageNumber?: string;
  transcriptionUrl?: string;
  transcribers: string[];
  artistRoleGroups: ArtistRoleGroup[];
  album?: {
    title: string;
    albumArtUrl?: string;
    artistName?: string;
    releaseDate?: string;
    trackNumber?: string;
  };
}

const artistRoleLabels: Record<SongArtistRole, string> = {
  MUSIC_BY: "Music by",
  PERFORMED_BY: "Performed by",
  WORDS_BY: "Words by",
};

const artistRoleOrder: SongArtistRole[] = [
  "PERFORMED_BY",
  "MUSIC_BY",
  "WORDS_BY",
];

function optionalText(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  return value.trim();
}

function formatDate(value: unknown) {
  const dateValue = optionalText(value);

  if (dateValue === undefined) {
    return undefined;
  }

  const parsedDate = dayjs(dateValue);

  if (!parsedDate.isValid()) {
    return dateValue;
  }

  return parsedDate.format("MMMM D, YYYY");
}

function publicationTypeLabel(publication: PublicationResult) {
  return publication.type === "MAG" ? "Magazine issue" : "Book edition";
}

function publicationDetailLabel(publication: PublicationResult) {
  const { details } = publication;

  if (details.__typename === "MagDetails") {
    const issueName = optionalText(details.issueName);
    const volume = optionalText(details.volume);
    const issue = optionalText(details.issue);

    return [
      issueName,
      volume !== undefined ? `Vol. ${volume}` : undefined,
      issue !== undefined ? `Issue ${issue}` : undefined,
    ]
      .filter((value): value is string => value !== undefined)
      .join(" · ");
  }

  return optionalText(details.edition);
}

function publicationSummary(publication: PublicationResult) {
  return [
    publication.name,
    publicationDetailLabel(publication),
    formatDate(publication.pubDate),
  ]
    .filter((value): value is string => value !== undefined && value.length > 0)
    .join(", ");
}

function publicationMetadata(publication: PublicationResult): MetadataItem[] {
  const details = publication.details;
  const serialNumber = optionalText(publication.serialNumber);
  const publicationDate = formatDate(publication.pubDate);

  if (details.__typename === "MagDetails") {
    const volume = optionalText(details.volume);
    const issue = optionalText(details.issue);
    const issueName = optionalText(details.issueName);

    return [
      serialNumber !== undefined
        ? { label: "Serial number", value: serialNumber }
        : undefined,
      publicationDate !== undefined
        ? { label: "Publication date", value: publicationDate }
        : undefined,
      volume !== undefined ? { label: "Volume", value: volume } : undefined,
      issue !== undefined ? { label: "Issue", value: issue } : undefined,
      issueName !== undefined
        ? { label: "Issue name", value: issueName }
        : undefined,
    ].filter((item): item is MetadataItem => item !== undefined);
  }

  const edition = optionalText(details.edition);

  return [
    serialNumber !== undefined
      ? { label: "Serial number", value: serialNumber }
      : undefined,
    publicationDate !== undefined
      ? { label: "Publication date", value: publicationDate }
      : undefined,
    edition !== undefined ? { label: "Edition", value: edition } : undefined,
  ].filter((item): item is MetadataItem => item !== undefined);
}

function artistRoleGroups(artists: readonly SongArtist[] | null | undefined) {
  const groupedArtists = new Map<SongArtistRole, Set<string>>();

  artistRoleOrder.forEach((role) => {
    groupedArtists.set(role, new Set<string>());
  });

  artists?.forEach((artist) => {
    const name = optionalText(artist.name);

    if (name === undefined) {
      return;
    }

    artist.roles.forEach((role) => {
      groupedArtists.get(role)?.add(name);
    });
  });

  return artistRoleOrder
    .map((role) => ({
      label: artistRoleLabels[role],
      artists: Array.from(groupedArtists.get(role) ?? []),
    }))
    .filter((group) => group.artists.length > 0);
}

function transcriberNames(transcription: TranscriptionResult) {
  return (
    transcription.transcribers
      ?.map((transcriber) => optionalText(transcriber.name))
      .filter((name): name is string => name !== undefined) ?? []
  );
}

function albumSummary(transcription: TranscriptionResult) {
  const album = transcription.song.album;

  if (album === null) {
    return undefined;
  }

  return {
    title: album.title,
    albumArtUrl: optionalText(album.albumArtUrl),
    artistName: optionalText(album.artist?.name),
    releaseDate: formatDate(album.releaseDate),
    trackNumber: album.trackNumber !== null ? album.trackNumber.toString() : undefined,
  };
}

export function findTranscriptionDetail(
  publication: PublicationResult | undefined,
  transcriptionId: string,
): TranscriptionDetailSummary | undefined {
  const transcription = publication?.transcriptions?.find(
    (candidate) => String(candidate.id) === transcriptionId,
  );

  if (publication === undefined || transcription === undefined) {
    return undefined;
  }

  return {
    id: String(transcription.id),
    songTitle: transcription.song.title,
    sourcePublication: publicationSummary(publication),
    sourcePublicationType: publicationTypeLabel(publication),
    sourceCoverUrl: optionalText(publication.details.cover),
    publicationMetadata: publicationMetadata(publication),
    pageNumber:
      transcription.pageNumber !== null
        ? transcription.pageNumber.toString()
        : undefined,
    transcriptionUrl: optionalText(transcription.url),
    transcribers: transcriberNames(transcription),
    artistRoleGroups: artistRoleGroups(transcription.song.artists),
    album: albumSummary(transcription),
  };
}
