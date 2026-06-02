import dayjs from "dayjs";

import type { PublicationCardProps } from "../../components/catalog";
import type { PublicationCatalogQuery } from "./PublicationCatalogView.generated";

type PublicationSearchResult = PublicationCatalogQuery["pubSearch"][number];
type PublicationDetails = PublicationSearchResult["details"];

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
    type: publication.type === "MAG" ? "magazine" : "book",
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
