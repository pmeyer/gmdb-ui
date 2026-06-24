import type { ChangeEvent, MouseEvent, SyntheticEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
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

import { PubIndexAutocomplete } from "../../components/input/PubIndexAutocomplete";
import { ImageInput } from "../../components/input/ImageInput";
import { PubIndexSerialNumberInput } from "../../components/input/PubIndexSerialNumberInput";
import { PubInstanceInput } from "../../components/input/PubInstanceInput";
import type { FileWithDataUrl } from "../../components/imageCapture";
import coverImagePlaceholderUrl from "../../assets/cover-img-placeholder.png";
import type {
  PubIndexAutocompleteValue,
  PubInstanceValue,
} from "../../components/input/types";
import type { FormattedSerialNumber } from "../../utils/serialNumberUtils";
import {
  initialPublicationFormState,
  trimmedValue,
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

function identityLabel(kind: PublicationFormKind) {
  return kind === "MAG" ? "Magazine identity" : "Book identity";
}

function serialNumberLabel(kind: PublicationFormKind) {
  return kind === "MAG" ? "Serial number (ISSN)" : "Serial number (ISBN)";
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
      errors.serialNumber = "Serial number is required.";
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
        coverImage: undefined,
        edition: "",
        existingCoverImageUrl: undefined,
        existingPublication: null,
        issue: "",
        issueName: "",
        kind: nextKind,
        name: "",
        publicationDate: "",
        publicationInstance: null,
        serialNumber: "",
        sourceMode: "NEW",
        volume: "",
      }));
    },
    [mode],
  );

  const handleIdentityChange = useCallback(
    (nextIdentity: PubIndexAutocompleteValue | null) => {
      if (nextIdentity?.kind === "existing") {
        setFormState((current) => ({
          ...current,
          coverImage: undefined,
          edition: "",
          existingCoverImageUrl: undefined,
          existingPublication: nextIdentity,
          issue: "",
          issueName: "",
          name: nextIdentity.name,
          publicationDate: "",
          publicationInstance: null,
          serialNumber: nextIdentity.identity.serialNumber,
          sourceMode: "EXISTING",
          volume: "",
        }));
        return;
      }

      setFormState((current) => {
        const nextName = nextIdentity?.name ?? "";
        const identityIsUnchanged =
          nextIdentity?.kind === "new" &&
          current.sourceMode === "NEW" &&
          current.existingPublication === null &&
          current.name === nextName;

        return {
          ...current,
          coverImage: identityIsUnchanged ? current.coverImage : undefined,
          edition: identityIsUnchanged ? current.edition : "",
          existingCoverImageUrl: identityIsUnchanged
            ? current.existingCoverImageUrl
            : undefined,
          existingPublication: null,
          issue: identityIsUnchanged ? current.issue : "",
          issueName: identityIsUnchanged ? current.issueName : "",
          name: nextName,
          publicationDate: identityIsUnchanged ? current.publicationDate : "",
          publicationInstance: identityIsUnchanged
            ? current.publicationInstance
            : null,
          serialNumber: identityIsUnchanged ? current.serialNumber : "",
          sourceMode: "NEW",
          volume: identityIsUnchanged ? current.volume : "",
        };
      });
    },
    [],
  );

  const handlePubInstanceChange = useCallback(
    (nextInstance: PubInstanceValue | null) => {
      setFormState((current) => {
        if (nextInstance?.kind === "existing") {
          const { identity } = nextInstance;

          return {
            ...current,
            coverImage: undefined,
            edition: identity.kind === "BOOK" ? nextInstance.name : "",
            existingCoverImageUrl: identity.coverUrl ?? undefined,
            issue: identity.kind === "MAG" ? identity.issue ?? "" : "",
            issueName: identity.kind === "MAG" ? nextInstance.name : "",
            publicationDate: identity.pubDate?.slice(0, 10) ?? "",
            publicationInstance: nextInstance,
            volume: identity.kind === "MAG" ? identity.volume ?? "" : "",
          };
        }

        const transitioningFromExisting =
          current.publicationInstance?.kind === "existing";
        const nextName = nextInstance?.name ?? "";

        return {
          ...current,
          edition: current.kind === "BOOK" ? nextName : "",
          existingCoverImageUrl: transitioningFromExisting
            ? undefined
            : current.existingCoverImageUrl,
          issue: transitioningFromExisting ? "" : current.issue,
          issueName: current.kind === "MAG" ? nextName : "",
          publicationDate: transitioningFromExisting
            ? ""
            : current.publicationDate,
          publicationInstance: nextInstance,
          volume: transitioningFromExisting ? "" : current.volume,
        };
      });
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

  const handleSerialNumberChange = useCallback((nextValue: FormattedSerialNumber) => {
    setFormState((current) => ({
      ...current,
      serialNumber: nextValue.formattedValue,
    }));
  }, []);

  const handleCoverImageChange = useCallback((nextImage: FileWithDataUrl | null) => {
    setFormState((current) => ({
      ...current,
      coverImage: nextImage,
    }));
  }, []);

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
  const coverImageHelpText =
    formState.coverImage?.file.name ??
    (isEditMode && formState.existingCoverImageUrl !== undefined
      ? "Current catalog cover is retained unless a replacement image is selected."
      : "Optional cover image.");
  const identityValue = useMemo<PubIndexAutocompleteValue | null>(
    () =>
      formState.existingPublication ??
      (formState.name.length > 0
        ? { kind: "new", name: formState.name }
        : null),
    [formState.existingPublication, formState.name],
  );

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
              <PubIndexAutocomplete
                allowAddNew
                errorText={validationErrors.name}
                onChange={handleIdentityChange}
                pubType={formState.kind}
                value={identityValue}
              />

              <PubIndexSerialNumberInput
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
                onChange={handleSerialNumberChange}
                required={!isExistingIdentity}
                value={formState.serialNumber}
              />
            </Box>

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
                  <PubInstanceInput
                    allowAddNew
                    errorText={validationErrors.issueName}
                    onChange={handlePubInstanceChange}
                    pubIndexId={formState.existingPublication?.identity.id}
                    pubType={formState.kind}
                    value={formState.publicationInstance}
                  />
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
                </>
              ) : (
                <PubInstanceInput
                  allowAddNew
                  errorText={validationErrors.edition}
                  onChange={handlePubInstanceChange}
                  pubIndexId={formState.existingPublication?.identity.id}
                  pubType={formState.kind}
                  value={formState.publicationInstance}
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
              spacing={2}
              sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
            >
              <ImageInput
                aspectRatioName="LARGE_FORMAT"
                disabled={isSaving}
                emptyImagePoster={coverImagePlaceholderUrl}
                existingImage={formState.existingCoverImageUrl}
                fileBaseName="publication-cover"
                image={formState.coverImage}
                onImageChange={handleCoverImageChange}
                width={250}
              />
              <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
                {coverImageHelpText}
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
