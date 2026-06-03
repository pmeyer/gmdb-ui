import dayjs from "dayjs";

import type { PublicationCardProps } from "../../components/catalog";
import type { PubType } from "../../graphql/generated/graphql";

interface PublicationTranscriptionSummary {
  id: unknown;
  pageNumber?: number | null;
  song: {
    title: string;
  };
}

type PublicationDetails =
  | {
      __typename: "BookDetails";
      cover: string | null;
      edition: string | null;
    }
  | {
      __typename: "MagDetails";
      cover: string | null;
      volume: string | null;
      issue: string | null;
      issueName: string | null;
    };

export interface PublicationSearchResult {
  id: unknown;
  name: string;
  type: PubType;
  pubDate: unknown;
  serialNumber: string;
  details: PublicationDetails;
  transcriptions: PublicationTranscriptionSummary[] | null;
}

export interface PublicationMetadataItem {
  label: string;
  value: string;
}

export interface PublicationTranscriptionItem {
  id: string;
  title: string;
  pageNumber?: string;
}

export interface PublicationDetailSummary {
  type: PublicationCardProps["type"];
  typeLabel: string;
  title: string;
  coverImageUrl?: string;
  serialNumber?: string;
  publicationDate?: string;
  metadata: PublicationMetadataItem[];
  sourceSummary: string;
  transcriptions: PublicationTranscriptionItem[];
}

function optionalText(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  return value;
}

function formatPublicationDate(value: unknown) {
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

function magazineField(
  details: PublicationDetails,
  field: "volume" | "issue" | "issueName",
) {
  return details.__typename === "MagDetails" ? optionalText(details[field]) : undefined;
}

function bookEdition(details: PublicationDetails) {
  return details.__typename === "BookDetails"
    ? optionalText(details.edition)
    : undefined;
}

function publicationType(type: PubType): PublicationCardProps["type"] {
  return type === "MAG" ? "magazine" : "book";
}

function publicationTypeLabel(type: PubType) {
  return type === "MAG" ? "Magazine issue" : "Book edition";
}

function transcriptionPreview(publication: PublicationSearchResult) {
  return (
    publication.transcriptions
      ?.map((transcription) => optionalText(transcription.song.title))
      .filter((title): title is string => title !== undefined) ?? []
  );
}

export function mapPublicationToCardProps(
  publication: PublicationSearchResult,
): PublicationCardProps {
  const preview = transcriptionPreview(publication);

  return {
    type: publicationType(publication.type),
    title: publication.name,
    coverImageUrl: optionalText(publication.details.cover),
    serialNumber: optionalText(publication.serialNumber),
    volume: magazineField(publication.details, "volume"),
    issue: magazineField(publication.details, "issue"),
    issueName: magazineField(publication.details, "issueName"),
    edition: bookEdition(publication.details),
    publicationDate: formatPublicationDate(publication.pubDate),
    transcriptionCount: publication.transcriptions?.length,
    transcriptionPreview: preview,
  };
}

export function mapPublicationToDetailSummary(
  publication: PublicationSearchResult,
): PublicationDetailSummary {
  const volume = magazineField(publication.details, "volume");
  const issue = magazineField(publication.details, "issue");
  const issueName = magazineField(publication.details, "issueName");
  const edition = bookEdition(publication.details);
  const publicationDate = formatPublicationDate(publication.pubDate);
  const metadata: PublicationMetadataItem[] = [
    volume !== undefined ? { label: "Volume", value: volume } : undefined,
    issue !== undefined ? { label: "Issue", value: issue } : undefined,
    issueName !== undefined ? { label: "Issue name", value: issueName } : undefined,
    edition !== undefined ? { label: "Edition", value: edition } : undefined,
    publicationDate !== undefined
      ? { label: "Publication date", value: publicationDate }
      : undefined,
  ].filter((item): item is PublicationMetadataItem => item !== undefined);

  return {
    type: publicationType(publication.type),
    typeLabel: publicationTypeLabel(publication.type),
    title: publication.name,
    coverImageUrl: optionalText(publication.details.cover),
    serialNumber: optionalText(publication.serialNumber),
    publicationDate,
    metadata,
    sourceSummary: [publication.name, publicationDate]
      .filter((value): value is string => value !== undefined && value.trim().length > 0)
      .join(", "),
    transcriptions:
      publication.transcriptions
        ?.map((transcription) => ({
          id: String(transcription.id),
          title: transcription.song.title,
          pageNumber:
            transcription.pageNumber !== null && transcription.pageNumber !== undefined
              ? transcription.pageNumber.toString()
              : undefined,
        }))
        .filter((transcription) => transcription.title.trim().length > 0) ?? [],
  };
}
