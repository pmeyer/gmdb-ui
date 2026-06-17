import type { ChangeEvent, MouseEvent, SyntheticEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import type { PubIndexCriteria } from "../../graphql/generated/graphql";
import { AddPublicationIndexLookupDocument } from "./AddPublicationView.generated";
import {
  initialPublicationFormState,
  trimmedValue,
  type ExistingPublicationOption,
  type PublicationFormKind,
  type PublicationFormState,
} from "./publicationFormModel";

interface PublicationFormProps {
  cancelLabel: string;
  description: string;
  initialState?: PublicationFormState;
  isSaving: boolean;
  mode: "add" | "edit";
  mutationError?: Error;
  onCancel: () => void;
  onSubmit: (formState: PublicationFormState) => void;
  submitLabel: string;
  title: string;
}

interface ValidationErrors {
  edition?: string;
  issueName?: string;
  name?: string;
  serialNumber?: string;
}

function publicationKindLabel(kind: PublicationFormKind) {
  return kind === "MAG" ? "Magazine issue" : "Book edition";
}

function nameLabel(kind: PublicationFormKind) {
  return kind === "MAG" ? "Magazine name" : "Book title";
}

function identityLabel(kind: PublicationFormKind) {
  return kind === "MAG" ? "Magazine identity" : "Book identity";
}

function serialNumberLabel(kind: PublicationFormKind) {
  return kind === "MAG" ? "Serial number (ISSN)" : "Serial number (ISBN)";
}

function optionLabel(option: ExistingPublicationOption) {
  return `${option.name} (${option.serialNumber})`;
}

function identityOptionLabel(option: ExistingPublicationOption | string) {
  return typeof option === "string" ? option : optionLabel(option);
}

function isExistingPublicationOption(
  value: ExistingPublicationOption | string | null,
): value is ExistingPublicationOption {
  return typeof value === "object" && value !== null;
}

function sameIdentity(
  option: ExistingPublicationOption,
  value: ExistingPublicationOption | string,
) {
  return isExistingPublicationOption(value) && String(option.id) === String(value.id);
}

function validateForm(formState: PublicationFormState): ValidationErrors {
  const errors: ValidationErrors = {};

  if (trimmedValue(formState.name) === undefined) {
    errors.name =
      formState.kind === "MAG"
        ? "Magazine name is required."
        : "Book title is required.";
  }

  if (formState.sourceMode === "NEW") {
    if (trimmedValue(formState.serialNumber) === undefined) {
      errors.serialNumber =
        formState.kind === "MAG" ? "ISSN is required." : "ISBN is required.";
    }
  }

  if (formState.kind === "MAG" && trimmedValue(formState.issueName) === undefined) {
    errors.issueName = "Issue name is required for magazine issues.";
  }

  if (formState.kind === "BOOK" && trimmedValue(formState.edition) === undefined) {
    errors.edition = "Edition is required for book editions.";
  }

  return errors;
}

function hasValidationErrors(errors: ValidationErrors) {
  return Object.keys(errors).length > 0;
}

export function PublicationForm({
  cancelLabel,
  description,
  initialState = initialPublicationFormState,
  isSaving,
  mode,
  mutationError,
  onCancel,
  onSubmit,
  submitLabel,
  title,
}: PublicationFormProps) {
  const [formState, setFormState] = useState<PublicationFormState>(initialState);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

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
    (_event: MouseEvent<HTMLElement>, nextKind: PublicationFormKind | null) => {
      if (nextKind === null || mode === "edit") {
        return;
      }

      setFormState((current) => ({
        ...current,
        edition: "",
        existingPublication: null,
        issue: "",
        issueName: "",
        kind: nextKind,
        name: "",
        serialNumber: "",
        sourceMode: "NEW",
        volume: "",
      }));
    },
    [mode],
  );

  const handleIdentityChange = useCallback(
    (
      _event: SyntheticEvent,
      nextIdentity: ExistingPublicationOption | string | null,
    ) => {
      if (isExistingPublicationOption(nextIdentity)) {
        setFormState((current) => ({
          ...current,
          existingPublication: nextIdentity,
          name: nextIdentity.name,
          serialNumber: nextIdentity.serialNumber,
          sourceMode: "EXISTING",
        }));
        return;
      }

      const nextName = nextIdentity ?? "";

      setFormState((current) => ({
        ...current,
        existingPublication: null,
        name: nextName,
        serialNumber: "",
        sourceMode: "NEW",
      }));
    },
    [],
  );

  const handleIdentityInputChange = useCallback(
    (_event: SyntheticEvent, nextInputValue: string, reason: string) => {
      if (reason !== "input" && reason !== "clear") {
        return;
      }

      setFormState((current) => ({
        ...current,
        existingPublication: null,
        name: nextInputValue,
        serialNumber: "",
        sourceMode: "NEW",
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

      onSubmit(formState);
    },
    [formState, onSubmit],
  );

  const isMagazine = formState.kind === "MAG";
  const isEditMode = mode === "edit";
  const isExistingIdentity =
    formState.sourceMode === "EXISTING" && formState.existingPublication !== null;
  const existingOptions = useMemo(() => {
    const lookupOptions = data?.getPubIndices ?? [];
    const selected = formState.existingPublication;

    if (
      selected === null ||
      lookupOptions.some((option) => String(option.id) === String(selected.id))
    ) {
      return lookupOptions;
    }

    return [selected, ...lookupOptions];
  }, [data, formState.existingPublication]);
  const identityValue: ExistingPublicationOption | string | null =
    formState.existingPublication ?? (formState.name.length > 0 ? formState.name : null);

  return (
    <Stack component="section" spacing={{ xs: 3, sm: 4 }}>
      <Box>
        <Button
          onClick={onCancel}
          type="button"
          variant="text"
          sx={{ textTransform: "none" }}
        >
          {cancelLabel}
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
          {title}
        </Typography>
        <Typography
          component="p"
          variant="body1"
          sx={{ color: "text.secondary", mt: 1.25 }}
        >
          {description}
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
              <ToggleButton disabled={isEditMode} value="MAG">
                Magazine issue
              </ToggleButton>
              <ToggleButton disabled={isEditMode} value="BOOK">
                Book edition
              </ToggleButton>
            </ToggleButtonGroup>
            {isEditMode && (
              <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
                Publication type is fixed for this existing record.
              </Typography>
            )}
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Box>
              <Typography component="h3" variant="h6">
                {identityLabel(formState.kind)}
              </Typography>
              <Typography
                component="p"
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                Choose an existing {isMagazine ? "magazine" : "book"} identity or
                type a new one.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(0, 1.3fr) minmax(0, 1fr)",
                },
                maxWidth: 920,
              }}
            >
              <Autocomplete
                freeSolo
                getOptionLabel={identityOptionLabel}
                inputValue={formState.name}
                isOptionEqualToValue={sameIdentity}
                loading={loading}
                onChange={handleIdentityChange}
                onInputChange={handleIdentityInputChange}
                openOnFocus
                options={existingOptions}
                value={identityValue}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={validationErrors.name !== undefined}
                    helperText={
                      validationErrors.name ??
                      `Select an existing ${isMagazine ? "magazine" : "book"} identity or type a new title.`
                    }
                    label={nameLabel(formState.kind)}
                    required
                  />
                )}
              />

              <TextField
                disabled={isExistingIdentity}
                error={validationErrors.serialNumber !== undefined}
                helperText={
                  validationErrors.serialNumber ??
                  (isExistingIdentity
                    ? "Serial number is set by the selected identity."
                    : isMagazine
                      ? "Required for a new magazine identity."
                      : "Required for a new book identity.")
                }
                label={serialNumberLabel(formState.kind)}
                name="serialNumber"
                onChange={handleTextFieldChange}
                required={!isExistingIdentity}
                value={formState.serialNumber}
              />
            </Box>

            {error !== undefined && (
              <Alert severity="error" variant="outlined">
                Publication identity lookup could not be loaded from the catalog
                API.
              </Alert>
            )}
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Box>
              <Typography component="h3" variant="h6">
                {publicationKindLabel(formState.kind)} details
              </Typography>
              <Typography
                component="p"
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
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
                  error={validationErrors.edition !== undefined}
                  helperText={
                    validationErrors.edition ??
                    "Required edition text, such as First edition or Revised edition."
                  }
                  label="Edition"
                  name="edition"
                  onChange={handleTextFieldChange}
                  required
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
                  (isEditMode && formState.existingCoverImageUrl !== undefined
                    ? "Current cover image will be retained unless replaced."
                    : "Optional cover image. Cropping and editing are handled outside this form.")}
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
              {isSaving ? "Saving..." : submitLabel}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
