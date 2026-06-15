import type { ChangeEvent, ReactNode, SyntheticEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  Step,
  StepButton,
  Stepper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import type {
  ArtistInput,
  ArtistType,
  BookInput,
  MagazineInput,
  SongArtistRole,
  SongInput,
  TranscriberInput,
  TranscriptionInput,
} from "../../graphql/generated/graphql";
import {
  buildBookInput,
  buildMagazineInput,
  idToString,
  initialPublicationFormState,
  trimmedValue,
  type PublicationFormKind,
  type PublicationFormState,
} from "../publications/publicationFormModel";
import {
  AddSongTranscriptionBookDocument,
  AddSongTranscriptionLookupsDocument,
  AddSongTranscriptionMagazineDocument,
  type AddSongTranscriptionLookupsQuery,
} from "./AddSongTranscriptionView.generated";

type PublicationOption = AddSongTranscriptionLookupsQuery["pubSearch"][number];
type SongOption = AddSongTranscriptionLookupsQuery["songSearch"][number];
type SongAlbumOption = NonNullable<SongOption["album"]>;

type EntityMode = "EXISTING" | "NEW";
type AlbumMode = "NONE" | EntityMode;
type StepId = "publication" | "song" | "album" | "transcription" | "review";

interface AddSongTranscriptionViewProps {
  onCancel: () => void;
  onSaved: (publicationId: string) => void;
}

interface ArtistSelection {
  id?: unknown;
  name: string;
  type: ArtistType;
  sourceMode: EntityMode;
}

interface AlbumSelection {
  id: unknown;
  title: string;
  releaseDate: string;
  artist: ArtistSelection | null;
}

interface TranscriberSelection {
  id?: unknown;
  name: string;
  sourceMode: EntityMode;
}

interface AlbumFormState {
  mode: AlbumMode;
  existingAlbum: AlbumSelection | null;
  title: string;
  trackNumber: string;
  releaseDate: string;
  coverArt: File | null;
  primaryArtist: ArtistSelection | null;
  primaryArtistInput: string;
  primaryArtistType: ArtistType;
}

interface SongFormState {
  mode: EntityMode;
  existingSong: SongOption | null;
  title: string;
  artistsByRole: Record<SongArtistRole, ArtistSelection[]>;
}

interface TranscriptionFormState {
  pageNumber: string;
  file: File | null;
  transcribers: TranscriberSelection[];
}

interface ValidationErrors {
  album?: string;
  pageNumber?: string;
  pdfFile?: string;
  publication?: string;
  publicationIssueName?: string;
  publicationName?: string;
  publicationSerialNumber?: string;
  song?: string;
  trackNumber?: string;
}

interface SummaryRowProps {
  label: string;
  value: ReactNode;
}

const steps: { id: StepId; label: string }[] = [
  { id: "publication", label: "Publication" },
  { id: "song", label: "Song" },
  { id: "album", label: "Album" },
  { id: "transcription", label: "Transcription" },
  { id: "review", label: "Review" },
];

const artistRoles: { role: SongArtistRole; label: string }[] = [
  { role: "PERFORMED_BY", label: "Performed by" },
  { role: "MUSIC_BY", label: "Music by" },
  { role: "WORDS_BY", label: "Words by" },
];

const initialSongFormState: SongFormState = {
  mode: "NEW",
  existingSong: null,
  title: "",
  artistsByRole: {
    MUSIC_BY: [],
    PERFORMED_BY: [],
    WORDS_BY: [],
  },
};

const initialAlbumFormState: AlbumFormState = {
  mode: "NONE",
  existingAlbum: null,
  title: "",
  trackNumber: "",
  releaseDate: "",
  coverArt: null,
  primaryArtist: null,
  primaryArtistInput: "",
  primaryArtistType: "PERSON",
};

const initialTranscriptionFormState: TranscriptionFormState = {
  pageNumber: "",
  file: null,
  transcribers: [],
};

function isNonBlank(value: string) {
  return trimmedValue(value) !== undefined;
}

function unknownDateToInput(value: unknown) {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function isPublicationOption(value: PublicationOption | string | null) {
  return typeof value === "object" && value !== null;
}

function publicationOptionLabel(option: PublicationOption | string) {
  if (typeof option === "string") {
    return option;
  }

  const detail =
    option.details.__typename === "MagDetails"
      ? option.details.issueName
      : option.details.edition;

  return [option.name, detail, option.serialNumber]
    .filter((part): part is string => part !== null && part !== "")
    .join(" · ");
}

function publicationKindLabel(kind: PublicationFormKind) {
  return kind === "MAG" ? "Magazine issue" : "Book edition";
}

function publicationNameLabel(kind: PublicationFormKind) {
  return kind === "MAG" ? "Magazine name" : "Book title";
}

function publicationSerialLabel(kind: PublicationFormKind) {
  return kind === "MAG" ? "Serial number (ISSN)" : "Serial number (ISBN)";
}

function lookupOptionKey(option: { id: unknown }) {
  return idToString(option.id);
}

function artistOptionLabel(option: ArtistSelection | string) {
  return typeof option === "string" ? option : `${option.name} (${option.type})`;
}

function transcriberOptionLabel(option: TranscriberSelection | string) {
  return typeof option === "string" ? option : option.name;
}

function albumOptionLabel(option: AlbumSelection | string) {
  return typeof option === "string" ? option : option.title;
}

function sameArtistOption(option: ArtistSelection, value: ArtistSelection | string) {
  return (
    typeof value !== "string" &&
    option.name === value.name &&
    option.type === value.type &&
    idToString(option.id) === idToString(value.id)
  );
}

function sameTranscriberOption(
  option: TranscriberSelection,
  value: TranscriberSelection | string,
) {
  return (
    typeof value !== "string" &&
    option.name === value.name &&
    idToString(option.id) === idToString(value.id)
  );
}

function sameAlbumOption(option: AlbumSelection, value: AlbumSelection | string) {
  return typeof value !== "string" && idToString(option.id) === idToString(value.id);
}

function uniqueById<T extends { id: unknown }>(options: T[]) {
  const seen = new Set<string>();

  return options.filter((option) => {
    const key = lookupOptionKey(option);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function mapExistingPublicationToForm(
  publication: PublicationOption,
): PublicationFormState {
  return {
    kind: publication.type,
    sourceMode: "EXISTING",
    existingPublication: {
      __typename: "PubIndexResult",
      id: publication.pubIndexId,
      name: publication.name,
      type: publication.type,
      serialNumber: publication.serialNumber,
    },
    name: publication.name,
    serialNumber: publication.serialNumber,
    volume:
      publication.details.__typename === "MagDetails"
        ? (publication.details.volume ?? "")
        : "",
    issue:
      publication.details.__typename === "MagDetails"
        ? (publication.details.issue ?? "")
        : "",
    issueName:
      publication.details.__typename === "MagDetails"
        ? (publication.details.issueName ?? "")
        : "",
    edition:
      publication.details.__typename === "BookDetails"
        ? (publication.details.edition ?? "")
        : "",
    publicationDate: unknownDateToInput(publication.pubDate),
    coverImage: null,
    existingCoverImageUrl: publication.details.cover ?? undefined,
  };
}

function validatePublicationForm(formState: PublicationFormState): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!isNonBlank(formState.name)) {
    errors.publicationName =
      formState.kind === "MAG"
        ? "Magazine name is required."
        : "Book title is required.";
  }

  if (formState.sourceMode === "NEW" && !isNonBlank(formState.serialNumber)) {
    errors.publicationSerialNumber =
      formState.kind === "MAG" ? "ISSN is required." : "ISBN is required.";
  }

  if (formState.kind === "MAG" && !isNonBlank(formState.issueName)) {
    errors.publicationIssueName = "Issue name is required for magazine issues.";
  }

  return errors;
}

function hasErrors(errors: ValidationErrors) {
  return Object.keys(errors).length > 0;
}

function toArtistSelection(value: ArtistSelection | string): ArtistSelection {
  return typeof value === "string"
    ? {
        name: value,
        type: "PERSON",
        sourceMode: "NEW",
      }
    : value;
}

function toTranscriberSelection(
  value: TranscriberSelection | string,
): TranscriberSelection {
  return typeof value === "string"
    ? {
        name: value,
        sourceMode: "NEW",
      }
    : value;
}

function buildArtistInput(artist: ArtistSelection): ArtistInput {
  if (artist.sourceMode === "EXISTING" && artist.id !== undefined) {
    return {
      id: artist.id,
    };
  }

  return {
    data: {
      name: artist.name.trim(),
      type: artist.type,
    },
  };
}

function buildSongInput(songForm: SongFormState, albumForm: AlbumFormState): SongInput {
  if (songForm.mode === "EXISTING" && songForm.existingSong !== null) {
    return {
      id: songForm.existingSong.id,
    };
  }

  const artistInputs = artistRoles.flatMap(({ role }) =>
    songForm.artistsByRole[role].map((artist) => ({
      ...buildArtistInput(artist),
      roles: [role],
    })),
  );

  return {
    data: {
      title: songForm.title.trim(),
      artists: artistInputs,
      albumTrack:
        albumForm.mode === "NONE"
          ? undefined
          : {
              trackNumber: Number(albumForm.trackNumber),
              album:
                albumForm.mode === "EXISTING" && albumForm.existingAlbum !== null
                  ? {
                      id: albumForm.existingAlbum.id,
                    }
                  : {
                      data: {
                        title: albumForm.title.trim(),
                        releaseDate: trimmedValue(albumForm.releaseDate),
                        coverArt: albumForm.coverArt ?? undefined,
                        primaryArtist:
                          albumForm.primaryArtist === null
                            ? undefined
                            : buildArtistInput(albumForm.primaryArtist),
                      },
                    },
            },
    },
  };
}

function buildTranscriberInputs(
  transcribers: TranscriberSelection[],
): TranscriberInput[] {
  return transcribers
    .filter((transcriber) => isNonBlank(transcriber.name))
    .map((transcriber) =>
      transcriber.sourceMode === "EXISTING" && transcriber.id !== undefined
        ? {
            id: transcriber.id,
          }
        : {
            name: transcriber.name.trim(),
          },
    );
}

function buildTranscriptionInput(
  songForm: SongFormState,
  albumForm: AlbumFormState,
  transcriptionForm: TranscriptionFormState,
): TranscriptionInput {
  return {
    file: transcriptionForm.file ?? undefined,
    pageNumber: Number(transcriptionForm.pageNumber),
    song: buildSongInput(songForm, albumForm),
    transcribers: buildTranscriberInputs(transcriptionForm.transcribers),
  };
}

function buildMagazineSubmission(
  publicationForm: PublicationFormState,
  transcriptionInput: TranscriptionInput,
  publicationId?: unknown,
): MagazineInput {
  return {
    ...buildMagazineInput(publicationForm, {
      includeTranscriptions: false,
      publicationId,
    }),
    transcriptions: [transcriptionInput],
  };
}

function buildBookSubmission(
  publicationForm: PublicationFormState,
  transcriptionInput: TranscriptionInput,
  publicationId?: unknown,
): BookInput {
  return {
    ...buildBookInput(publicationForm, {
      includeTranscriptions: false,
      publicationId,
    }),
    transcriptions: [transcriptionInput],
  };
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 0.5,
        gridTemplateColumns: { xs: "1fr", sm: "180px minmax(0, 1fr)" },
      }}
    >
      <Typography component="dt" variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography component="dd" variant="body2" sx={{ m: 0 }}>
        {value}
      </Typography>
    </Box>
  );
}

export function AddSongTranscriptionView({
  onCancel,
  onSaved,
}: AddSongTranscriptionViewProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [publicationMode, setPublicationMode] = useState<EntityMode>("EXISTING");
  const [selectedPublication, setSelectedPublication] =
    useState<PublicationOption | null>(null);
  const [publicationForm, setPublicationForm] = useState<PublicationFormState>(
    initialPublicationFormState,
  );
  const [songForm, setSongForm] = useState<SongFormState>(initialSongFormState);
  const [albumForm, setAlbumForm] = useState<AlbumFormState>(initialAlbumFormState);
  const [transcriptionForm, setTranscriptionForm] =
    useState<TranscriptionFormState>(initialTranscriptionFormState);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const { data, error: lookupError } = useQuery(AddSongTranscriptionLookupsDocument, {
    variables: {
      publicationCriteria: {},
      songCriteria: {},
    },
  });
  const [addMagazineIssue, addMagazineIssueState] = useMutation(
    AddSongTranscriptionMagazineDocument,
  );
  const [addBookEdition, addBookEditionState] = useMutation(
    AddSongTranscriptionBookDocument,
  );

  const publicationOptions = useMemo(() => data?.pubSearch ?? [], [data?.pubSearch]);
  const songOptions = useMemo(() => data?.songSearch ?? [], [data?.songSearch]);
  const isSaving = addMagazineIssueState.loading || addBookEditionState.loading;
  const mutationError = addMagazineIssueState.error ?? addBookEditionState.error;

  const artistOptions = useMemo<ArtistSelection[]>(() => {
    const songArtists = songOptions.flatMap((song) =>
      (song.artists ?? []).map((artist) => ({
        id: artist.id,
        name: artist.name,
        type: artist.type,
        sourceMode: "EXISTING" as const,
      })),
    );
    const albumArtists = songOptions
      .map((song) => song.album?.artist)
      .filter((artist): artist is NonNullable<SongAlbumOption["artist"]> =>
        artist !== null && artist !== undefined,
      )
      .map((artist) => ({
        id: artist.id,
        name: artist.name,
        type: artist.type,
        sourceMode: "EXISTING" as const,
      }));
    const selectedArtists = [
      ...artistRoles.flatMap(({ role }) => songForm.artistsByRole[role]),
      albumForm.primaryArtist,
    ].filter((artist): artist is ArtistSelection => artist !== null);

    return [...songArtists, ...albumArtists, ...selectedArtists].filter(
      (artist, index, allArtists) =>
        allArtists.findIndex(
          (candidate) =>
            candidate.name === artist.name &&
            candidate.type === artist.type &&
            idToString(candidate.id) === idToString(artist.id),
        ) === index,
    );
  }, [albumForm.primaryArtist, songForm.artistsByRole, songOptions]);

  const albumOptions = useMemo<AlbumSelection[]>(
    () =>
      uniqueById(
        songOptions
          .map((song) => song.album)
          .filter((album): album is SongAlbumOption => album !== null)
          .map((album) => ({
            id: album.id,
            title: album.title,
            releaseDate: unknownDateToInput(album.releaseDate),
            artist:
              album.artist === null
                ? null
                : {
                    id: album.artist.id,
                    name: album.artist.name,
                    type: album.artist.type,
                    sourceMode: "EXISTING" as const,
                  },
          })),
      ),
    [songOptions],
  );

  const transcriberOptions = useMemo<TranscriberSelection[]>(
    () =>
      uniqueById(
        songOptions.flatMap((song) =>
          (song.transcriptions ?? []).flatMap((transcription) =>
            (transcription.transcribers ?? []).map((transcriber) => ({
              id: transcriber.id,
              name: transcriber.name,
              sourceMode: "EXISTING" as const,
            })),
          ),
        ),
      ),
    [songOptions],
  );

  const validateStep = useCallback(
    (stepId: StepId) => {
      const nextErrors: ValidationErrors = {};

      if (stepId === "publication") {
        if (publicationMode === "EXISTING" && selectedPublication === null) {
          nextErrors.publication = "Choose a publication before continuing.";
        }

        if (publicationMode === "NEW") {
          Object.assign(nextErrors, validatePublicationForm(publicationForm));
        }
      }

      if (stepId === "song") {
        if (songForm.mode === "EXISTING" && songForm.existingSong === null) {
          nextErrors.song = "Choose an existing song or switch to a new song.";
        }

        if (songForm.mode === "NEW" && !isNonBlank(songForm.title)) {
          nextErrors.song = "Song title is required for a new song.";
        }
      }

      if (stepId === "album" && albumForm.mode !== "NONE") {
        if (!isNonBlank(albumForm.trackNumber) || Number(albumForm.trackNumber) < 1) {
          nextErrors.trackNumber = "Track number is required when album information is supplied.";
        }

        if (albumForm.mode === "EXISTING" && albumForm.existingAlbum === null) {
          nextErrors.album = "Choose an existing album or switch to a new album.";
        }

        if (albumForm.mode === "NEW" && !isNonBlank(albumForm.title)) {
          nextErrors.album = "Album title is required for a new album.";
        }
      }

      if (stepId === "transcription") {
        if (
          !isNonBlank(transcriptionForm.pageNumber) ||
          Number(transcriptionForm.pageNumber) < 1
        ) {
          nextErrors.pageNumber = "Starting page number is required.";
        }

        if (transcriptionForm.file === null) {
          nextErrors.pdfFile = "Choose a transcription PDF before review.";
        }
      }

      setValidationErrors(nextErrors);
      return !hasErrors(nextErrors);
    },
    [
      albumForm.existingAlbum,
      albumForm.mode,
      albumForm.title,
      albumForm.trackNumber,
      publicationForm,
      publicationMode,
      selectedPublication,
      songForm.existingSong,
      songForm.mode,
      songForm.title,
      transcriptionForm.file,
      transcriptionForm.pageNumber,
    ],
  );

  const handleStepClick = useCallback(
    (stepIndex: number) => {
      if (stepIndex <= activeStep) {
        setActiveStep(stepIndex);
        setValidationErrors({});
      }
    },
    [activeStep],
  );

  const handleNext = useCallback(() => {
    const stepId = steps[activeStep].id;

    if (validateStep(stepId)) {
      setActiveStep((currentStep) => Math.min(currentStep + 1, steps.length - 1));
    }
  }, [activeStep, validateStep]);

  const handleBack = useCallback(() => {
    setValidationErrors({});
    setActiveStep((currentStep) => Math.max(currentStep - 1, 0));
  }, []);

  const handlePublicationModeChange = useCallback(
    (_event: SyntheticEvent, nextMode: EntityMode | null) => {
      if (nextMode === null) {
        return;
      }

      setPublicationMode(nextMode);
      setValidationErrors({});
    },
    [],
  );

  const handlePublicationChange = useCallback(
    (_event: SyntheticEvent, nextPublication: PublicationOption | string | null) => {
      if (isPublicationOption(nextPublication)) {
        setSelectedPublication(nextPublication);
        return;
      }

      setSelectedPublication(null);
    },
    [],
  );

  const handlePublicationKindChange = useCallback(
    (_event: SyntheticEvent, nextKind: PublicationFormKind | null) => {
      if (nextKind === null) {
        return;
      }

      setPublicationForm((current) => ({
        ...initialPublicationFormState,
        kind: nextKind,
        name: current.name,
      }));
    },
    [],
  );

  const handlePublicationTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;

      setPublicationForm((current) => ({
        ...current,
        [name]: value,
      }));
    },
    [],
  );

  const handlePublicationCoverChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setPublicationForm((current) => ({
        ...current,
        coverImage: event.target.files?.[0] ?? null,
      }));
    },
    [],
  );

  const handleSongModeChange = useCallback(
    (_event: SyntheticEvent, nextMode: EntityMode | null) => {
      if (nextMode === null) {
        return;
      }

      setSongForm((current) => ({
        ...current,
        mode: nextMode,
      }));
      setValidationErrors({});
    },
    [],
  );

  const handleSongChange = useCallback(
    (_event: SyntheticEvent, nextSong: SongOption | string | null) => {
      setSongForm((current) => ({
        ...current,
        existingSong: typeof nextSong === "object" ? nextSong : null,
      }));
    },
    [],
  );

  const handleSongTitleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSongForm((current) => ({
      ...current,
      title: event.target.value,
    }));
  }, []);

  const handleArtistRoleChange = useCallback(
    (role: SongArtistRole) =>
      (_event: SyntheticEvent, nextArtists: (ArtistSelection | string)[]) => {
        setSongForm((current) => ({
          ...current,
          artistsByRole: {
            ...current.artistsByRole,
            [role]: nextArtists.map(toArtistSelection),
          },
        }));
      },
    [],
  );

  const handleArtistTypeChange = useCallback(
    (role: SongArtistRole, artistName: string) =>
      (event: SelectChangeEvent<ArtistType>) => {
        setSongForm((current) => ({
          ...current,
          artistsByRole: {
            ...current.artistsByRole,
            [role]: current.artistsByRole[role].map((artist) =>
              artist.sourceMode === "NEW" && artist.name === artistName
                ? {
                    ...artist,
                    type: event.target.value,
                  }
                : artist,
            ),
          },
        }));
      },
    [],
  );

  const handleAlbumModeChange = useCallback(
    (_event: SyntheticEvent, nextMode: AlbumMode | null) => {
      if (nextMode === null) {
        return;
      }

      setAlbumForm((current) => ({
        ...current,
        mode: nextMode,
      }));
      setValidationErrors({});
    },
    [],
  );

  const handleAlbumChange = useCallback(
    (_event: SyntheticEvent, nextAlbum: AlbumSelection | string | null) => {
      setAlbumForm((current) => ({
        ...current,
        existingAlbum: typeof nextAlbum === "object" ? nextAlbum : null,
      }));
    },
    [],
  );

  const handleAlbumTextChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setAlbumForm((current) => ({
      ...current,
      [name]: value,
    }));
  }, []);

  const handleAlbumCoverChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setAlbumForm((current) => ({
      ...current,
      coverArt: event.target.files?.[0] ?? null,
    }));
  }, []);

  const handlePrimaryArtistChange = useCallback(
    (_event: SyntheticEvent, nextArtist: ArtistSelection | string | null) => {
      setAlbumForm((current) => ({
        ...current,
        primaryArtist:
          typeof nextArtist === "string"
            ? {
                name: nextArtist,
                type: current.primaryArtistType,
                sourceMode: "NEW",
              }
            : nextArtist,
        primaryArtistInput:
          typeof nextArtist === "string" ? nextArtist : (nextArtist?.name ?? ""),
      }));
    },
    [],
  );

  const handlePrimaryArtistInputChange = useCallback(
    (_event: SyntheticEvent, nextInputValue: string, reason: string) => {
      if (reason !== "input" && reason !== "clear") {
        return;
      }

      setAlbumForm((current) => ({
        ...current,
        primaryArtistInput: nextInputValue,
        primaryArtist:
          nextInputValue.length === 0
            ? null
            : {
                name: nextInputValue,
                type: current.primaryArtistType,
                sourceMode: "NEW",
              },
      }));
    },
    [],
  );

  const handlePrimaryArtistTypeChange = useCallback(
    (event: SelectChangeEvent<ArtistType>) => {
      setAlbumForm((current) => ({
        ...current,
        primaryArtistType: event.target.value,
        primaryArtist:
          current.primaryArtist !== null && current.primaryArtist.sourceMode === "NEW"
            ? {
                ...current.primaryArtist,
                type: event.target.value,
              }
            : current.primaryArtist,
      }));
    },
    [],
  );

  const handleTranscriptionTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;

      setTranscriptionForm((current) => ({
        ...current,
        [name]: value,
      }));
    },
    [],
  );

  const handlePdfChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setTranscriptionForm((current) => ({
      ...current,
      file: event.target.files?.[0] ?? null,
    }));
  }, []);

  const handleTranscribersChange = useCallback(
    (_event: SyntheticEvent, nextTranscribers: (TranscriberSelection | string)[]) => {
      setTranscriptionForm((current) => ({
        ...current,
        transcribers: nextTranscribers.map(toTranscriberSelection),
      }));
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (!validateStep("transcription")) {
      setActiveStep(3);
      return;
    }

    const publicationState =
      publicationMode === "EXISTING" && selectedPublication !== null
        ? mapExistingPublicationToForm(selectedPublication)
        : publicationForm;
    const publicationId =
      publicationMode === "EXISTING" ? selectedPublication?.id : undefined;
    const transcriptionInput = buildTranscriptionInput(
      songForm,
      albumForm,
      transcriptionForm,
    );

    async function saveTranscription() {
      if (publicationState.kind === "MAG") {
        const result = await addMagazineIssue({
          variables: {
            magInput: buildMagazineSubmission(
              publicationState,
              transcriptionInput,
              publicationId,
            ),
          },
        });

        onSaved(idToString(result.data?.addMagazineIssue.id));
        return;
      }

      const result = await addBookEdition({
        variables: {
          bookInput: buildBookSubmission(
            publicationState,
            transcriptionInput,
            publicationId,
          ),
        },
      });

      onSaved(idToString(result.data?.addBookEdition.id));
    }

    void saveTranscription();
  }, [
    addBookEdition,
    addMagazineIssue,
    albumForm,
    onSaved,
    publicationForm,
    publicationMode,
    selectedPublication,
    songForm,
    transcriptionForm,
    validateStep,
  ]);

  const currentStepId = steps[activeStep].id;
  const isMagazine = publicationForm.kind === "MAG";
  const selectedPublicationLabel =
    selectedPublication === null
      ? "No publication selected"
      : publicationOptionLabel(selectedPublication);
  const songSummary =
    songForm.mode === "EXISTING" && songForm.existingSong !== null
      ? songForm.existingSong.title
      : songForm.title;
  const albumSummary =
    albumForm.mode === "NONE"
      ? "No album information"
      : albumForm.mode === "EXISTING" && albumForm.existingAlbum !== null
        ? albumForm.existingAlbum.title
        : albumForm.title;

  return (
    <Stack component="section" spacing={{ xs: 3, sm: 4 }}>
      <Box>
        <Button onClick={onCancel} type="button" variant="text">
          Back to songs
        </Button>
      </Box>

      <Box sx={{ maxWidth: 860 }}>
        <Typography
          component="h2"
          variant="h4"
          sx={{ fontSize: { xs: "1.7rem", sm: "2.125rem" }, fontWeight: 800 }}
        >
          Add song transcription
        </Typography>
        <Typography component="p" variant="body1" sx={{ color: "text.secondary", mt: 1.25 }}>
          Start with the source publication, then add the song, optional album
          context, the transcription PDF, and a final review.
        </Typography>
      </Box>

      <Paper
        variant="outlined"
        sx={{ bgcolor: "background.paper", borderRadius: 2, p: { xs: 2, sm: 3 } }}
      >
        <Stepper activeStep={activeStep} alternativeLabel sx={{ display: { xs: "none", md: "flex" } }}>
          {steps.map((step, index) => (
            <Step key={step.id} completed={index < activeStep}>
              <StepButton onClick={() => { handleStepClick(index); }}>
                {step.label}
              </StepButton>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
            Step {activeStep + 1} of {steps.length}
          </Typography>
          <Typography component="h3" variant="h6">
            {steps[activeStep].label}
          </Typography>
        </Box>
      </Paper>

      {lookupError !== undefined && (
        <Alert severity="warning" variant="outlined">
          Lookup data could not be loaded from the catalog API. Existing choices
          may be incomplete until the API is available.
        </Alert>
      )}

      <Paper
        variant="outlined"
        sx={{ bgcolor: "background.paper", borderRadius: 2, p: { xs: 2.5, sm: 4 } }}
      >
        {currentStepId === "publication" && (
          <Stack spacing={3}>
            <Box>
              <Typography component="h3" variant="h5">
                Publication
              </Typography>
              <Typography component="p" variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                A transcription must belong to a magazine issue or book edition.
              </Typography>
            </Box>

            <ToggleButtonGroup
              aria-label="Publication entry mode"
              color="primary"
              exclusive
              onChange={handlePublicationModeChange}
              value={publicationMode}
              sx={{ alignSelf: "flex-start", "& .MuiToggleButton-root": { textTransform: "none" } }}
            >
              <ToggleButton value="EXISTING">Existing publication</ToggleButton>
              <ToggleButton value="NEW">New publication</ToggleButton>
            </ToggleButtonGroup>

            {publicationMode === "EXISTING" ? (
              <Autocomplete
                getOptionLabel={publicationOptionLabel}
                isOptionEqualToValue={(option, value) =>
                  typeof value !== "string" && idToString(option.id) === idToString(value.id)
                }
                onChange={handlePublicationChange}
                openOnFocus
                options={publicationOptions}
                value={selectedPublication}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={validationErrors.publication !== undefined}
                    helperText={
                      validationErrors.publication ??
                      "Select the issue or edition that contains the transcription."
                    }
                    label="Existing publication"
                    required
                  />
                )}
              />
            ) : (
              <Stack spacing={3}>
                <ToggleButtonGroup
                  aria-label="New publication type"
                  color="primary"
                  exclusive
                  onChange={handlePublicationKindChange}
                  value={publicationForm.kind}
                  sx={{ maxWidth: 520, "& .MuiToggleButton-root": { textTransform: "none" } }}
                >
                  <ToggleButton value="MAG">Magazine issue</ToggleButton>
                  <ToggleButton value="BOOK">Book edition</ToggleButton>
                </ToggleButtonGroup>

                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                  }}
                >
                  <TextField
                    error={validationErrors.publicationName !== undefined}
                    helperText={validationErrors.publicationName}
                    label={publicationNameLabel(publicationForm.kind)}
                    name="name"
                    onChange={handlePublicationTextChange}
                    required
                    value={publicationForm.name}
                  />
                  <TextField
                    error={validationErrors.publicationSerialNumber !== undefined}
                    helperText={validationErrors.publicationSerialNumber}
                    label={publicationSerialLabel(publicationForm.kind)}
                    name="serialNumber"
                    onChange={handlePublicationTextChange}
                    required
                    value={publicationForm.serialNumber}
                  />
                  {isMagazine ? (
                    <>
                      <TextField
                        helperText="Optional issue volume."
                        label="Volume"
                        name="volume"
                        onChange={handlePublicationTextChange}
                        value={publicationForm.volume}
                      />
                      <TextField
                        helperText="Optional issue number."
                        label="Issue"
                        name="issue"
                        onChange={handlePublicationTextChange}
                        value={publicationForm.issue}
                      />
                      <TextField
                        error={validationErrors.publicationIssueName !== undefined}
                        helperText={validationErrors.publicationIssueName}
                        label="Issue name"
                        name="issueName"
                        onChange={handlePublicationTextChange}
                        required
                        value={publicationForm.issueName}
                      />
                    </>
                  ) : (
                    <TextField
                      helperText="Optional edition text."
                      label="Edition"
                      name="edition"
                      onChange={handlePublicationTextChange}
                      value={publicationForm.edition}
                    />
                  )}
                  <TextField
                    helperText="Optional publication date."
                    label="Publication date"
                    name="publicationDate"
                    onChange={handlePublicationTextChange}
                    slotProps={{ inputLabel: { shrink: true } }}
                    type="date"
                    value={publicationForm.publicationDate}
                  />
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
                  <Button component="label" type="button" variant="outlined">
                    Choose cover image
                    <input accept="image/*" hidden onChange={handlePublicationCoverChange} type="file" />
                  </Button>
                  <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
                    {publicationForm.coverImage?.name ?? "Optional cover image."}
                  </Typography>
                </Stack>
              </Stack>
            )}
          </Stack>
        )}

        {currentStepId === "song" && (
          <Stack spacing={3}>
            <Box>
              <Typography component="h3" variant="h5">
                Song
              </Typography>
              <Typography component="p" variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                Choose a cataloged song or enter a new song with role-based artists.
              </Typography>
            </Box>

            <ToggleButtonGroup
              aria-label="Song entry mode"
              color="primary"
              exclusive
              onChange={handleSongModeChange}
              value={songForm.mode}
              sx={{ alignSelf: "flex-start", "& .MuiToggleButton-root": { textTransform: "none" } }}
            >
              <ToggleButton value="EXISTING">Existing song</ToggleButton>
              <ToggleButton value="NEW">New song</ToggleButton>
            </ToggleButtonGroup>

            {songForm.mode === "EXISTING" ? (
              <Autocomplete
                getOptionLabel={(option) => (typeof option === "string" ? option : option.title)}
                isOptionEqualToValue={(option, value) =>
                  typeof value !== "string" && idToString(option.id) === idToString(value.id)
                }
                onChange={handleSongChange}
                openOnFocus
                options={songOptions}
                value={songForm.existingSong}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={validationErrors.song !== undefined}
                    helperText={
                      validationErrors.song ??
                      "Select the cataloged song for this transcription."
                    }
                    label="Existing song"
                    required
                  />
                )}
              />
            ) : (
              <Stack spacing={3}>
                <TextField
                  error={validationErrors.song !== undefined}
                  helperText={validationErrors.song ?? "Required title for the new song."}
                  label="Song title"
                  onChange={handleSongTitleChange}
                  required
                  value={songForm.title}
                />

                <Stack spacing={2}>
                  {artistRoles.map(({ role, label }) => {
                    const newArtists = songForm.artistsByRole[role].filter(
                      (artist) => artist.sourceMode === "NEW",
                    );

                    return (
                      <Stack key={role} spacing={1.5}>
                        <Autocomplete<ArtistSelection, true, false, true>
                          freeSolo
                          getOptionLabel={artistOptionLabel}
                          isOptionEqualToValue={sameArtistOption}
                          multiple
                          onChange={handleArtistRoleChange(role)}
                          openOnFocus
                          options={artistOptions}
                          value={songForm.artistsByRole[role]}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              helperText="Select existing artists or type a new artist name."
                              label={label}
                            />
                          )}
                        />
                        {newArtists.length > 0 && (
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexWrap: "wrap" }}>
                            {newArtists.map((artist) => (
                              <FormControl key={`${role}-${artist.name}`} size="small" sx={{ minWidth: 180 }}>
                                <InputLabel id={`${role}-${artist.name}-type-label`}>
                                  Type for {artist.name}
                                </InputLabel>
                                <Select
                                  label={`Type for ${artist.name}`}
                                  labelId={`${role}-${artist.name}-type-label`}
                                  onChange={handleArtistTypeChange(role, artist.name)}
                                  value={artist.type}
                                >
                                  <MenuItem value="PERSON">Person</MenuItem>
                                  <MenuItem value="BAND">Band</MenuItem>
                                </Select>
                              </FormControl>
                            ))}
                          </Stack>
                        )}
                      </Stack>
                    );
                  })}
                </Stack>
              </Stack>
            )}
          </Stack>
        )}

        {currentStepId === "album" && (
          <Stack spacing={3}>
            <Box>
              <Typography component="h3" variant="h5">
                Album
              </Typography>
              <Typography component="p" variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                Album details are optional and can be skipped when the source publication is enough.
              </Typography>
            </Box>

            <ToggleButtonGroup
              aria-label="Album entry mode"
              color="primary"
              exclusive
              onChange={handleAlbumModeChange}
              value={albumForm.mode}
              sx={{ alignSelf: "flex-start", "& .MuiToggleButton-root": { textTransform: "none" } }}
            >
              <ToggleButton value="NONE">No album</ToggleButton>
              <ToggleButton value="EXISTING">Existing album</ToggleButton>
              <ToggleButton value="NEW">New album</ToggleButton>
            </ToggleButtonGroup>

            {albumForm.mode !== "NONE" && (
              <Stack spacing={3}>
                <TextField
                  error={validationErrors.trackNumber !== undefined}
                  helperText={validationErrors.trackNumber ?? "Required when album information is supplied."}
                  label="Track number"
                  name="trackNumber"
                  onChange={handleAlbumTextChange}
                  required
                  type="number"
                  value={albumForm.trackNumber}
                />

                {albumForm.mode === "EXISTING" ? (
                  <Autocomplete
                    getOptionLabel={albumOptionLabel}
                    isOptionEqualToValue={sameAlbumOption}
                    onChange={handleAlbumChange}
                    openOnFocus
                    options={albumOptions}
                    value={albumForm.existingAlbum}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={validationErrors.album !== undefined}
                        helperText={validationErrors.album}
                        label="Existing album"
                        required
                      />
                    )}
                  />
                ) : (
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                      }}
                    >
                      <TextField
                        error={validationErrors.album !== undefined}
                        helperText={validationErrors.album}
                        label="Album title"
                        name="title"
                        onChange={handleAlbumTextChange}
                        required
                        value={albumForm.title}
                      />
                      <TextField
                        helperText="Optional release date."
                        label="Release date"
                        name="releaseDate"
                        onChange={handleAlbumTextChange}
                        slotProps={{ inputLabel: { shrink: true } }}
                        type="date"
                        value={albumForm.releaseDate}
                      />
                    </Box>

                    <Autocomplete<ArtistSelection, false, false, true>
                      freeSolo
                      getOptionLabel={artistOptionLabel}
                      inputValue={albumForm.primaryArtistInput}
                      isOptionEqualToValue={sameArtistOption}
                      onChange={handlePrimaryArtistChange}
                      onInputChange={handlePrimaryArtistInputChange}
                      openOnFocus
                      options={artistOptions}
                      value={albumForm.primaryArtist}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          helperText="Optional primary artist for this album."
                          label="Primary artist"
                        />
                      )}
                    />

                    {albumForm.primaryArtist?.sourceMode === "NEW" && (
                      <FormControl size="small" sx={{ maxWidth: 220 }}>
                        <InputLabel id="primary-artist-type-label">Primary artist type</InputLabel>
                        <Select
                          label="Primary artist type"
                          labelId="primary-artist-type-label"
                          onChange={handlePrimaryArtistTypeChange}
                          value={albumForm.primaryArtistType}
                        >
                          <MenuItem value="PERSON">Person</MenuItem>
                          <MenuItem value="BAND">Band</MenuItem>
                        </Select>
                      </FormControl>
                    )}

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
                      <Button component="label" type="button" variant="outlined">
                        Choose album cover
                        <input accept="image/*" hidden onChange={handleAlbumCoverChange} type="file" />
                      </Button>
                      <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
                        {albumForm.coverArt?.name ?? "Optional album cover art."}
                      </Typography>
                    </Stack>
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        )}

        {currentStepId === "transcription" && (
          <Stack spacing={3}>
            <Box>
              <Typography component="h3" variant="h5">
                Transcription file and source details
              </Typography>
              <Typography component="p" variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                Add the page where the transcription starts, upload the PDF, and list optional transcribers.
              </Typography>
            </Box>

            <TextField
              error={validationErrors.pageNumber !== undefined}
              helperText={validationErrors.pageNumber}
              label="Starting page number"
              name="pageNumber"
              onChange={handleTranscriptionTextChange}
              required
              type="number"
              value={transcriptionForm.pageNumber}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
              <Button component="label" type="button" variant="outlined">
                Choose PDF
                <input accept="application/pdf" hidden onChange={handlePdfChange} type="file" />
              </Button>
              <Typography component="p" variant="body2" sx={{ color: validationErrors.pdfFile === undefined ? "text.secondary" : "error.main" }}>
                {validationErrors.pdfFile ?? transcriptionForm.file?.name ?? "Required transcription PDF."}
              </Typography>
            </Stack>

            <Autocomplete<TranscriberSelection, true, false, true>
              freeSolo
              getOptionLabel={transcriberOptionLabel}
              isOptionEqualToValue={sameTranscriberOption}
              multiple
              onChange={handleTranscribersChange}
              openOnFocus
              options={transcriberOptions}
              value={transcriptionForm.transcribers}
              renderInput={(params) => (
                <TextField
                  {...params}
                  helperText="Optional. Select existing transcribers or type new names."
                  label="Transcribers"
                />
              )}
            />
          </Stack>
        )}

        {currentStepId === "review" && (
          <Stack spacing={3}>
            <Box>
              <Typography component="h3" variant="h5">
                Review and save
              </Typography>
              <Typography component="p" variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                Confirm the transcription details before saving.
              </Typography>
            </Box>

            <Box component="dl" sx={{ display: "grid", gap: 1.5, m: 0 }}>
              <SummaryRow
                label="Publication"
                value={
                  publicationMode === "EXISTING"
                    ? selectedPublicationLabel
                    : `${publicationKindLabel(publicationForm.kind)} · ${publicationForm.name}`
                }
              />
              <SummaryRow label="Song" value={songSummary || "New song title missing"} />
              <SummaryRow label="Album" value={albumSummary || "Album title missing"} />
              <SummaryRow
                label="Transcription"
                value={`Page ${transcriptionForm.pageNumber || "not set"} · ${
                  transcriptionForm.file?.name ?? "No PDF selected"
                }`}
              />
              <SummaryRow
                label="Transcribers"
                value={
                  transcriptionForm.transcribers.length > 0
                    ? transcriptionForm.transcribers.map((transcriber) => transcriber.name).join(", ")
                    : "None"
                }
              />
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
              {steps.slice(0, 4).map((step, index) => (
                <Chip
                  key={step.id}
                  label={`Edit ${step.label.toLowerCase()}`}
                  onClick={() => { setActiveStep(index); }}
                  variant="outlined"
                />
              ))}
            </Stack>

            {mutationError !== undefined && (
              <Alert severity="error" variant="outlined">
                Song transcription could not be saved. Check the entered details
                and try again.
              </Alert>
            )}
          </Stack>
        )}

        <Divider sx={{ my: 4 }} />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between" }}>
          <Button disabled={activeStep === 0 || isSaving} onClick={handleBack} type="button" variant="text">
            Back
          </Button>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button disabled={isSaving} onClick={onCancel} type="button" variant="text">
              Cancel
            </Button>
            {currentStepId === "review" ? (
              <Button disabled={isSaving} onClick={handleSubmit} type="button" variant="contained">
                {isSaving ? "Saving..." : "Save transcription"}
              </Button>
            ) : (
              <Button onClick={handleNext} type="button" variant="contained">
                Continue
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
