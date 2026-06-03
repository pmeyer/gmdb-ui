import type { ChangeEvent, MouseEvent, SyntheticEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import type {
  BookInput,
  MagazineInput,
  PubIndexCriteria,
  PubIndexInput,
  PubType,
} from "../../graphql/generated/graphql";
import {
  AddBookEditionDocument,
  AddMagazineIssueDocument,
  AddPublicationIndexLookupDocument,
  type AddPublicationIndexLookupQuery,
} from "./AddPublicationView.generated";

type AddPublicationKind = PubType;
type SourceMode = "EXISTING" | "NEW";
type ExistingPublicationOption =
  AddPublicationIndexLookupQuery["getPubIndices"][number];

interface AddPublicationViewProps {
  onCancel: () => void;
  onSaved: (publicationId: string) => void;
}

interface AddPublicationFormState {
  kind: AddPublicationKind;
  sourceMode: SourceMode;
  existingPublication: ExistingPublicationOption | null;
  name: string;
  serialNumber: string;
  volume: string;
  issue: string;
  issueName: string;
  edition: string;
  publicationDate: string;
  coverImage: File | null;
}

interface ValidationErrors {
  existingPublication?: string;
  issueName?: string;
  name?: string;
  serialNumber?: string;
}

const initialFormState: AddPublicationFormState = {
  kind: "MAG",
  sourceMode: "EXISTING",
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

function trimmedValue(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function idToString(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? value.toString() : "";
}

function publicationKindLabel(kind: AddPublicationKind) {
  return kind === "MAG" ? "Magazine issue" : "Book edition";
}

function existingSourceLabel(kind: AddPublicationKind) {
  return kind === "MAG" ? "Existing magazine" : "Existing book";
}

function newSourceLabel(kind: AddPublicationKind) {
  return kind === "MAG" ? "New magazine" : "New book";
}

function nameLabel(kind: AddPublicationKind) {
  return kind === "MAG" ? "Magazine name" : "Book title";
}

function serialNumberLabel(kind: AddPublicationKind) {
  return kind === "MAG" ? "Serial number (ISSN)" : "Serial number (ISBN)";
}

function optionLabel(option: ExistingPublicationOption) {
  return `${option.name} (${option.serialNumber})`;
}

function validateForm(formState: AddPublicationFormState): ValidationErrors {
  const errors: ValidationErrors = {};

  if (formState.sourceMode === "EXISTING" && formState.existingPublication === null) {
    errors.existingPublication =
      formState.kind === "MAG"
        ? "Choose the magazine this issue belongs to."
        : "Choose the book this edition belongs to.";
  }

  if (formState.sourceMode === "NEW") {
    if (trimmedValue(formState.name) === undefined) {
      errors.name =
        formState.kind === "MAG"
          ? "Magazine name is required."
          : "Book title is required.";
    }

    if (trimmedValue(formState.serialNumber) === undefined) {
      errors.serialNumber =
        formState.kind === "MAG" ? "ISSN is required." : "ISBN is required.";
    }
  }

  if (formState.kind === "MAG" && trimmedValue(formState.issueName) === undefined) {
    errors.issueName = "Issue name is required for magazine issues.";
  }

  return errors;
}

function hasValidationErrors(errors: ValidationErrors) {
  return Object.keys(errors).length > 0;
}

function buildIndexInput(formState: AddPublicationFormState): PubIndexInput {
  if (
    formState.sourceMode === "EXISTING" &&
    formState.existingPublication !== null
  ) {
    return {
      id: formState.existingPublication.id,
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

function buildMagazineInput(formState: AddPublicationFormState): MagazineInput {
  return {
    index: buildIndexInput(formState),
    info: {
      cover: formState.coverImage ?? undefined,
      issue: trimmedValue(formState.issue),
      issueName: trimmedValue(formState.issueName) ?? "",
      volume: trimmedValue(formState.volume),
    },
    pubDate: trimmedValue(formState.publicationDate),
    transcriptions: [],
  };
}

function buildBookInput(formState: AddPublicationFormState): BookInput {
  return {
    index: buildIndexInput(formState),
    info: {
      cover: formState.coverImage ?? undefined,
      edition: trimmedValue(formState.edition),
    },
    pubDate: trimmedValue(formState.publicationDate),
    transcriptions: [],
  };
}

export function AddPublicationView({ onCancel, onSaved }: AddPublicationViewProps) {
  const [formState, setFormState] =
    useState<AddPublicationFormState>(initialFormState);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [addMagazineIssue, addMagazineIssueState] = useMutation(
    AddMagazineIssueDocument,
  );
  const [addBookEdition, addBookEditionState] = useMutation(AddBookEditionDocument);

  const criteria = useMemo<PubIndexCriteria>(
    () => ({
      type: formState.kind,
    }),
    [formState.kind],
  );

  const { data, error, loading } = useQuery(AddPublicationIndexLookupDocument, {
    variables: {
      criteria,
    },
  });

  const validationErrors = useMemo(
    () => (hasAttemptedSubmit ? validateForm(formState) : {}),
    [formState, hasAttemptedSubmit],
  );

  const handleKindChange = useCallback(
    (_event: MouseEvent<HTMLElement>, nextKind: AddPublicationKind | null) => {
      if (nextKind === null) {
        return;
      }

      setFormState((current) => ({
        ...current,
        edition: "",
        existingPublication: null,
        issue: "",
        issueName: "",
        kind: nextKind,
        volume: "",
      }));
    },
    [],
  );

  const handleSourceModeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormState((current) => ({
        ...current,
        existingPublication: null,
        sourceMode: event.target.value as SourceMode,
      }));
    },
    [],
  );

  const handleExistingPublicationChange = useCallback(
    (_event: SyntheticEvent, nextPublication: ExistingPublicationOption | null) => {
      setFormState((current) => ({
        ...current,
        existingPublication: nextPublication,
      }));
    },
    [],
  );

  const handleTextFieldChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;

      setFormState((current) => ({
        ...current,
        [name]: value,
      }));
    },
    [],
  );

  const handleCoverImageChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormState((current) => ({
        ...current,
        coverImage: event.target.files?.[0] ?? null,
      }));
    },
    [],
  );

  const handleSubmit = useCallback(
    (event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      setHasAttemptedSubmit(true);

      const errors = validateForm(formState);

      if (hasValidationErrors(errors)) {
        return;
      }

      async function submitPublication() {
        if (formState.kind === "MAG") {
          const result = await addMagazineIssue({
            variables: {
              magInput: buildMagazineInput(formState),
            },
          });
          const publicationId = result.data?.addMagazineIssue.id;

          if (publicationId !== undefined) {
            onSaved(idToString(publicationId));
          }

          return;
        }

        const result = await addBookEdition({
          variables: {
            bookInput: buildBookInput(formState),
          },
        });
        const publicationId = result.data?.addBookEdition.id;

        if (publicationId !== undefined) {
          onSaved(idToString(publicationId));
        }
      }

      void submitPublication();
    },
    [addBookEdition, addMagazineIssue, formState, onSaved],
  );

  const isMagazine = formState.kind === "MAG";
  const isNewSource = formState.sourceMode === "NEW";
  const isSaving = addMagazineIssueState.loading || addBookEditionState.loading;
  const mutationError = addMagazineIssueState.error ?? addBookEditionState.error;
  const existingOptions = data?.getPubIndices ?? [];

  return (
    <Stack component="section" spacing={{ xs: 3, sm: 4 }}>
      <Box>
        <Button onClick={onCancel} type="button" variant="text" sx={{ textTransform: "none" }}>
          Back to publications
        </Button>
      </Box>

      <Box sx={{ maxWidth: 820 }}>
        <Typography
          component="h2"
          variant="h4"
          sx={{
            fontSize: { xs: "1.7rem", sm: "2.125rem" },
            fontWeight: 800,
          }}
        >
          Add publication
        </Typography>
        <Typography component="p" variant="body1" sx={{ color: "text.secondary", mt: 1.25 }}>
          Add a magazine issue or book edition with only the catalog details needed
          for the publication record.
        </Typography>
      </Box>

      <Paper
        component="form"
        noValidate
        onSubmit={handleSubmit}
        variant="outlined"
        sx={{
          bgcolor: "background.paper",
          borderRadius: 2,
          p: { xs: 2.5, sm: 4 },
        }}
      >
        <Stack spacing={4}>
          <Stack spacing={2}>
            <Typography component="h3" variant="h6">
              Publication type
            </Typography>
            <ToggleButtonGroup
              aria-label="Publication type"
              color="primary"
              exclusive
              fullWidth
              onChange={handleKindChange}
              value={formState.kind}
              sx={{
                maxWidth: 520,
                "& .MuiToggleButton-root": {
                  py: 1.25,
                  textTransform: "none",
                },
              }}
            >
              <ToggleButton value="MAG">Magazine issue</ToggleButton>
              <ToggleButton value="BOOK">Book edition</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <FormControl>
              <FormLabel id="publication-source-mode-label">
                {isMagazine ? "Magazine source" : "Book source"}
              </FormLabel>
              <RadioGroup
                aria-labelledby="publication-source-mode-label"
                name="sourceMode"
                onChange={handleSourceModeChange}
                row
                value={formState.sourceMode}
              >
                <FormControlLabel
                  control={<Radio />}
                  label={existingSourceLabel(formState.kind)}
                  value="EXISTING"
                />
                <FormControlLabel
                  control={<Radio />}
                  label={newSourceLabel(formState.kind)}
                  value="NEW"
                />
              </RadioGroup>
              <FormHelperText>
                {isMagazine
                  ? "Use an existing magazine for another issue, or define a new magazine title."
                  : "Use an existing book for another edition, or define a new book title."}
              </FormHelperText>
            </FormControl>

            {formState.sourceMode === "EXISTING" && (
              <Stack spacing={1.5} sx={{ maxWidth: 640 }}>
                <Autocomplete
                  getOptionLabel={optionLabel}
                  isOptionEqualToValue={(option, value) =>
                    String(option.id) === String(value.id)
                  }
                  loading={loading}
                  onChange={handleExistingPublicationChange}
                  options={existingOptions}
                  value={formState.existingPublication}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={validationErrors.existingPublication !== undefined}
                      helperText={
                        validationErrors.existingPublication ??
                        `Choose the ${isMagazine ? "magazine" : "book"} title and serial number to reuse.`
                      }
                      label={existingSourceLabel(formState.kind)}
                      required
                    />
                  )}
                />

                {error !== undefined && (
                  <Alert severity="error" variant="outlined">
                    Existing publication lookup could not be loaded from the catalog
                    API.
                  </Alert>
                )}
              </Stack>
            )}

            {isNewSource && (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                  maxWidth: 880,
                }}
              >
                <TextField
                  error={validationErrors.name !== undefined}
                  helperText={
                    validationErrors.name ??
                    (isMagazine
                      ? "Enter the magazine title, such as Guitar World."
                      : "Enter the book title exactly as it should appear.")
                  }
                  label={nameLabel(formState.kind)}
                  name="name"
                  onChange={handleTextFieldChange}
                  required
                  value={formState.name}
                />
                <TextField
                  error={validationErrors.serialNumber !== undefined}
                  helperText={
                    validationErrors.serialNumber ??
                    (isMagazine
                      ? "Use the magazine ISSN or catalog serial number."
                      : "Use the book ISBN or catalog serial number.")
                  }
                  label={serialNumberLabel(formState.kind)}
                  name="serialNumber"
                  onChange={handleTextFieldChange}
                  required
                  value={formState.serialNumber}
                />
              </Box>
            )}
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Box>
              <Typography component="h3" variant="h6">
                {publicationKindLabel(formState.kind)} details
              </Typography>
              <Typography component="p" variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                {isMagazine
                  ? "Capture the issue-specific details printed on the cover or masthead."
                  : "Capture the edition-specific details printed on the title or copyright page."}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              }}
            >
              {isMagazine ? (
                <>
                  <TextField
                    helperText="Optional issue volume, typically a number."
                    label="Volume"
                    name="volume"
                    onChange={handleTextFieldChange}
                    value={formState.volume}
                  />
                  <TextField
                    helperText="Optional issue number as printed."
                    label="Issue"
                    name="issue"
                    onChange={handleTextFieldChange}
                    value={formState.issue}
                  />
                  <TextField
                    error={validationErrors.issueName !== undefined}
                    helperText={
                      validationErrors.issueName ??
                      "Required display name for this magazine issue."
                    }
                    label="Issue name"
                    name="issueName"
                    onChange={handleTextFieldChange}
                    required
                    value={formState.issueName}
                  />
                </>
              ) : (
                <TextField
                  helperText="Optional edition text, such as First edition or Revised edition."
                  label="Edition"
                  name="edition"
                  onChange={handleTextFieldChange}
                  value={formState.edition}
                />
              )}

              <TextField
                helperText="Optional publication date for this issue or edition."
                label="Publication date"
                name="publicationDate"
                onChange={handleTextFieldChange}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                type="date"
                value={formState.publicationDate}
              />
            </Box>
          </Stack>

          <Divider />

          <Stack spacing={1.5}>
            <Typography component="h3" variant="h6">
              Cover image
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ alignItems: { xs: "stretch", sm: "center" } }}
            >
              <Button component="label" type="button" variant="outlined">
                Choose cover image
                <input
                  accept="image/*"
                  hidden
                  onChange={handleCoverImageChange}
                  type="file"
                />
              </Button>
              <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
                {formState.coverImage?.name ??
                  "Optional cover image. Cropping and editing are handled outside this form."}
              </Typography>
            </Stack>
          </Stack>

          {mutationError !== undefined && (
            <Alert severity="error" variant="outlined">
              Publication could not be saved. Check the entered details and try again.
            </Alert>
          )}

          <Divider />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ justifyContent: "flex-end" }}
          >
            <Button disabled={isSaving} onClick={onCancel} type="button" variant="text">
              Cancel
            </Button>
            <Button disabled={isSaving} type="submit" variant="contained">
              Save publication
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
