import { useCallback } from "react";
import { useMutation } from "@apollo/client/react";

import {
  AddBookEditionDocument,
  AddMagazineIssueDocument,
} from "./AddPublicationView.generated";
import {
  PublicationForm,
} from "./PublicationForm";
import {
  buildBookInput,
  buildMagazineInput,
  idToString,
  type PublicationFormState,
} from "./publicationFormModel";

interface AddPublicationViewProps {
  onCancel: () => void;
  onSaved: (publicationId: string) => void;
}

export function AddPublicationView({ onCancel, onSaved }: AddPublicationViewProps) {
  const [addMagazineIssue, addMagazineIssueState] = useMutation(
    AddMagazineIssueDocument,
  );
  const [addBookEdition, addBookEditionState] = useMutation(AddBookEditionDocument);

  const handleSubmit = useCallback(
    (formState: PublicationFormState) => {
      async function submitPublication() {
        if (formState.kind === "MAG") {
          const result = await addMagazineIssue({
            variables: {
              magInput: buildMagazineInput(formState, {
                includeTranscriptions: true,
              }),
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
            bookInput: buildBookInput(formState, {
              includeTranscriptions: true,
            }),
          },
        });
        const publicationId = result.data?.addBookEdition.id;

        if (publicationId !== undefined) {
          onSaved(idToString(publicationId));
        }
      }

      void submitPublication();
    },
    [addBookEdition, addMagazineIssue, onSaved],
  );

  const isSaving = addMagazineIssueState.loading || addBookEditionState.loading;
  const mutationError = addMagazineIssueState.error ?? addBookEditionState.error;

  return (
    <PublicationForm
      cancelLabel="Back to publications"
      description="Add a magazine issue or book edition with only the catalog details needed for the publication record."
      isSaving={isSaving}
      mode="add"
      mutationError={mutationError}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Save publication"
      title="Add publication"
    />
  );
}
