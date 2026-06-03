import dayjs from "dayjs";

import type { SongTranscriptionCardProps } from "../../components/catalog";
import type { SongCatalogQuery } from "./SongCatalogView.generated";

type SongSearchResult = SongCatalogQuery["songSearch"][number];
type SongTranscription = NonNullable<SongSearchResult["transcriptions"]>[number];
type TranscriptionPublication = NonNullable<SongTranscription["pub"]>;

export interface SongTranscriptionCatalogItem {
  id: string;
  publicationId?: string;
  url?: string;
  cardProps: SongTranscriptionCardProps;
}

function optionalText(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  return value;
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

function publicationDetailLabel(publication: TranscriptionPublication) {
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

function publicationSummary(publication: TranscriptionPublication | null) {
  if (publication === null) {
    return undefined;
  }

  const detailLabel = publicationDetailLabel(publication);
  const publicationDate = formatDate(publication.pubDate);

  return [publication.name, detailLabel, publicationDate]
    .filter((value): value is string => value !== undefined && value.trim().length > 0)
    .join(", ");
}

function artistNames(song: SongSearchResult) {
  const directArtists =
    song.artists
      ?.map((artist) => optionalText(artist.name))
      .filter((name): name is string => name !== undefined) ?? [];

  if (directArtists.length > 0) {
    return directArtists;
  }

  const albumArtist = optionalText(song.album?.artist?.name);

  return albumArtist !== undefined ? [albumArtist] : undefined;
}

function transcriberNames(transcription: SongTranscription) {
  const names =
    transcription.transcribers
      ?.map((transcriber) => optionalText(transcriber.name))
      .filter((name): name is string => name !== undefined) ?? [];

  return names.length > 0 ? names : undefined;
}

function publicationId(transcription: SongTranscription) {
  if (transcription.pub === null) {
    return undefined;
  }

  const { id } = transcription.pub;

  if (typeof id === "string" || typeof id === "number") {
    return id.toString();
  }

  return undefined;
}

function mapSongTranscription(
  song: SongSearchResult,
  transcription: SongTranscription,
): SongTranscriptionCatalogItem {
  return {
    id: String(transcription.id),
    publicationId: publicationId(transcription),
    url: optionalText(transcription.url),
    cardProps: {
      title: song.title,
      artistNames: artistNames(song),
      albumTitle: optionalText(song.album?.title),
      albumArtUrl: optionalText(song.album?.albumArtUrl),
      publicationSummary: publicationSummary(transcription.pub),
      pageNumber: transcription.pageNumber ?? undefined,
      transcribers: transcriberNames(transcription),
    },
  };
}

export function mapSongsToTranscriptionCatalogItems(
  songs: readonly SongSearchResult[] | undefined,
) {
  return (
    songs?.flatMap((song) =>
      song.transcriptions?.map((transcription) =>
        mapSongTranscription(song, transcription),
      ) ?? [],
    ) ?? []
  );
}
