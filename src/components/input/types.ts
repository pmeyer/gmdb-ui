import type { PubType } from '../../graphql/generated/graphql';

export interface PubIndexIdentity {
  id: number;
  type: PubType;
  serialNumber: string;
}

export interface ExistingPubIndexValue {
  kind: 'existing';
  name: string;
  identity: PubIndexIdentity;
}

export interface NewPubIndexValue {
  kind: 'new';
  name: string;
}

export type PubIndexAutocompleteValue = ExistingPubIndexValue | NewPubIndexValue;

export type PubIndexChangeEventHandler = (v: PubIndexAutocompleteValue | null) => void;

export interface PubIndexAutocompleteProps {
  value: PubIndexAutocompleteValue | null;
  onChange: PubIndexChangeEventHandler;
  allowAddNew?: boolean;
  disabled?: boolean;
  errorText?: string;
  pubType?: PubType;
}
