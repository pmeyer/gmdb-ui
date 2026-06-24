import { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Paper, Skeleton, Stack, Typography } from "@mui/material";

import {
  AddBookEditionDocument,
  AddMagazineIssueDocument,
} from "./AddPublicationView.generated";
import {
  PublicationDetailCatalogDocument,
  type PublicationDetailCatalogQuery,
} from "./PublicationDetailView.generated";
import {
  PublicationForm,
} from "./PublicationForm";
import {
  buildBookInput,
  buildMagazineInput,
  idToString,
  type PublicationFormState,
} from "./publicationFormModel";
import type {
  ExistingPubIndexValue,
  ExistingPubInstanceValue,
} from "../../components/input/types";

interface EditPublicationViewProps {
  publicationId: string;
  onCancel: () => void;
  onSaved: (publicationId: string) => void;
}

type EditablePublication = PublicationDetailCatalogQuery["pubSearch"][number];

function optionalString(value: string | null | undefined) {
  return value ?? "";
}

function inputDateValue(value: string | null | undefined) {
  return value?.slice(0, 10) ?? "";
}

function publicationToFormState(
  publication: EditablePublication,
): PublicationFormState {
  const existingPublication: ExistingPubIndexValue = {
    kind: "existing",
    name: publication.name,
    identity: {
      id: publication.pubIndexId,
      serialNumber: publication.serialNumber,
      type: publication.type,
    },
  };
  const baseState = {
    coverImage: undefined,
    existingCoverImageUrl: publication.details.cover ?? undefined,
    existingPublication,
    kind: publication.type,
    name: publication.name,
    publicationDate: inputDateValue(publication.pubDate),
    serialNumber: publication.serialNumber,
    sourceMode: "EXISTING" as const,
  };

  if (publication.details.__typename === "MagDetails") {
    const publicationInstance: ExistingPubInstanceValue = {
      kind: "existing",
      name: publication.details.issueName,
      identity: {
        kind: "MAG",
        coverUrl: publication.details.cover,
        id: publication.id,
        issue: publication.details.issue,
        pubDate: publication.pubDate,
        volume: publication.details.volume,
      },
    };

    return {
      ...baseState,
      edition: "",
      issue: optionalString(publication.details.issue),
      issueName: optionalString(publication.details.issueName),
      publicationInstance,
      volume: optionalString(publication.details.volume),
    };
  }

  const publicationInstance: ExistingPubInstanceValue = {
    kind: "existing",
    name: publication.details.edition,
    identity: {
      kind: "BOOK",
      coverUrl: publication.details.cover,
      id: publication.id,
      pubDate: publication.pubDate,
    },
  };

  return {
    ...baseState,
    edition: optionalString(publication.details.edition),
    issue: "",
    issueName: "",
    publicationInstance,
    volume: "",
  };
}

function EditPublicationState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        bgcolor: "background.paper",
        borderRadius: 2,
        p: { xs: 2.5, sm: 4 },
      }}
    >
      <Typography component="h2" variant="h6">
        {title}
      </Typography>
      <Typography component="p" variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
        {message}
      </Typography>
    </Paper>
  );
}

export function EditPublicationView({
  publicationId,
  onCancel,
  onSaved,
}: EditPublicationViewProps) {
  const parsedPublicationId = Number(publicationId);
  const { data, error, loading } = useQuery(PublicationDetailCatalogDocument, {
    skip: !Number.isInteger(parsedPublicationId),
    variables: {
      id: parsedPublicationId,
    },
  });
  const [editMagazineIssue, editMagazineIssueState] = useMutation(
    AddMagazineIssueDocument,
  );
  const [editBookEdition, editBookEditionState] = useMutation(AddBookEditionDocument);

  const publication = data?.pubSearch[0];
  const initialState = useMemo(
    () =>
      publication !== undefined ? publicationToFormState(publication) : undefined,
    [publication],
  );

  const handleSubmit = useCallback(
    (formState: PublicationFormState) => {
      if (publication === undefined) {
        return;
      }

      async function submitPublication() {
        if (publication === undefined) {
          return;
        }

        if (formState.kind === "MAG") {
          const result = await editMagazineIssue({
            variables: {
              magInput: buildMagazineInput(formState, {
                includeTranscriptions: false,
                publicationId: publication.id,
              }),
            },
          });
          const savedPublicationId = result.data?.addMagazineIssue.id;

          onSaved(idToString(savedPublicationId ?? publication.id));
          return;
        }

        const result = await editBookEdition({
          variables: {
            bookInput: buildBookInput(formState, {
              includeTranscriptions: false,
              publicationId: publication.id,
            }),
          },
        });
        const savedPublicationId = result.data?.addBookEdition.id;

        onSaved(idToString(savedPublicationId ?? publication.id));
      }

      void submitPublication();
    },
    [editBookEdition, editMagazineIssue, onSaved, publication],
  );

  const isSaving = editMagazineIssueState.loading || editBookEditionState.loading;
  const mutationError = editMagazineIssueState.error ?? editBookEditionState.error;

  if (loading) {
    return (
      <Stack spacing={3} aria-label="Loading publication edit form">
        <Skeleton variant="rounded" sx={{ height: 140 }} />
        <Skeleton variant="rounded" sx={{ height: 620 }} />
      </Stack>
    );
  }

  if (error !== undefined) {
    return (
      <Alert severity="error" variant="outlined">
        Publication could not be loaded for editing. Try again after the catalog API
        is available.
      </Alert>
    );
  }

  if (publication === undefined || initialState === undefined) {
    return (
      <EditPublicationState
        title="Publication not found"
        message="Return to the publication catalog and choose another magazine issue or book."
      />
    );
  }

  return (
    <PublicationForm
      key={publicationId}
      cancelLabel="Back to publication"
      description="Edit the publication metadata for this magazine issue or book edition."
      initialState={initialState}
      isSaving={isSaving}
      mode="edit"
      mutationError={mutationError}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Save changes"
      title="Edit publication"
    />
  );
}
