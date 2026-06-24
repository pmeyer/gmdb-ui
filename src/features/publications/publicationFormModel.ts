import type {
  BookInput,
  MagazineInput,
  PubIndexInput,
  PubType,
} from "../../graphql/generated/graphql";
import type {
  ExistingPubIndexValue,
  PubInstanceValue,
} from "../../components/input/types";
import type { FileWithDataUrl } from "../../components/imageCapture";

export type PublicationFormKind = PubType;
export type PublicationSourceMode = "EXISTING" | "NEW";

export interface PublicationFormState {
  kind: PublicationFormKind;
  sourceMode: PublicationSourceMode;
  existingPublication: ExistingPubIndexValue | null;
  publicationInstance: PubInstanceValue | null;
  name: string;
  serialNumber: string;
  volume: string;
  issue: string;
  issueName: string;
  edition: string;
  publicationDate: string;
  coverImage: FileWithDataUrl | null | undefined;
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
  publicationInstance: null,
  name: "",
  serialNumber: "",
  volume: "",
  issue: "",
  issueName: "",
  edition: "",
  publicationDate: "",
  coverImage: undefined,
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
  const publicationId = options.publicationId ??
    (formState.publicationInstance?.kind === "existing"
      ? formState.publicationInstance.identity.id
      : undefined);

  return {
    index: buildIndexInput(formState),
    info: {
      cover: formState.coverImage?.file ?? undefined,
      issue: trimmedValue(formState.issue),
      issueName: trimmedValue(formState.issueName) ?? "",
      volume: trimmedValue(formState.volume),
    },
    pubDate: trimmedValue(formState.publicationDate),
    ...(publicationId !== undefined ? { pubId: publicationId } : {}),
    transcriptions: options.includeTranscriptions ? [] : undefined,
  };
}

export function buildBookInput(
  formState: PublicationFormState,
  options: BuildPublicationInputOptions = { includeTranscriptions: true },
): BookInput {
  const publicationId = options.publicationId ??
    (formState.publicationInstance?.kind === "existing"
      ? formState.publicationInstance.identity.id
      : undefined);

  return {
    index: buildIndexInput(formState),
    info: {
      cover: formState.coverImage?.file ?? undefined,
      edition: trimmedValue(formState.edition) ?? "",
    },
    pubDate: trimmedValue(formState.publicationDate),
    ...(publicationId !== undefined ? { pubId: publicationId } : {}),
    transcriptions: options.includeTranscriptions ? [] : undefined,
  };
}
