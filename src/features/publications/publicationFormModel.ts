import type {
  BookInput,
  MagazineInput,
  PubIndexInput,
  PubType,
} from "../../graphql/generated/graphql";
import type { ExistingPubIndexValue } from "../../components/input/types";

export type PublicationFormKind = PubType;
export type PublicationSourceMode = "EXISTING" | "NEW";

export interface PublicationFormState {
  kind: PublicationFormKind;
  sourceMode: PublicationSourceMode;
  existingPublication: ExistingPubIndexValue | null;
  name: string;
  serialNumber: string;
  volume: string;
  issue: string;
  issueName: string;
  edition: string;
  publicationDate: string;
  coverImage: File | null;
  existingCoverImageUrl?: string;
}

interface BuildPublicationInputOptions {
  includeTranscriptions: boolean;
  publicationId?: number;
}

export const initialPublicationFormState: PublicationFormState = {
  kind: "MAG",
  sourceMode: "NEW",
  existingPublication: null,
  name: "",
  serialNumber: "",
  volume: "",
  issue: "",
  issueName: "",
  edition: "",
  publicationDate: "",
  coverImage: null,
};

export function trimmedValue(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export function idToString(value: number | null | undefined) {
  return value?.toString() ?? "";
}

function buildIndexInput(
  formState: PublicationFormState,
): PubIndexInput {
  if (
    formState.sourceMode === "EXISTING" &&
    formState.existingPublication !== null
  ) {
    return {
      id: formState.existingPublication.identity.id,
    };
  }

  return {
    data: {
      name: trimmedValue(formState.name) ?? "",
      serial: trimmedValue(formState.serialNumber) ?? "",
      type: formState.kind,
    },
  };
}

export function buildMagazineInput(
  formState: PublicationFormState,
  options: BuildPublicationInputOptions = { includeTranscriptions: true },
): MagazineInput {
  return {
    index: buildIndexInput(formState),
    info: {
      cover: formState.coverImage ?? undefined,
      issue: trimmedValue(formState.issue),
      issueName: trimmedValue(formState.issueName) ?? "",
      volume: trimmedValue(formState.volume),
    },
    pubDate: trimmedValue(formState.publicationDate),
    ...(options.publicationId !== undefined ? { pubId: options.publicationId } : {}),
    transcriptions: options.includeTranscriptions ? [] : undefined,
  };
}

export function buildBookInput(
  formState: PublicationFormState,
  options: BuildPublicationInputOptions = { includeTranscriptions: true },
): BookInput {
  return {
    index: buildIndexInput(formState),
    info: {
      cover: formState.coverImage ?? undefined,
      edition: trimmedValue(formState.edition) ?? "",
    },
    pubDate: trimmedValue(formState.publicationDate),
    ...(options.publicationId !== undefined ? { pubId: options.publicationId } : {}),
    transcriptions: options.includeTranscriptions ? [] : undefined,
  };
}
