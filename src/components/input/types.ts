import type { PubType } from '../../graphql/generated/graphql';

// Publication Index related types

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

// Publication Instance (mag issue, book edition) types

export interface CommonPubDetails {
  id: number;  
  coverUrl?: string | null;
  pubDate?: string | null;  
}

export interface MagIssueDetails extends CommonPubDetails {
  kind: 'MAG';
  volume?: string | null;
  issue?: string | null;
}

export interface BookEditionDetails extends CommonPubDetails {
  kind: 'BOOK';
}

export interface ExistingPubInstanceValue {
  kind: 'existing';
  name: string;   // 'issueName' for magazine; 'edition' for book
  identity: MagIssueDetails | BookEditionDetails;
}

export interface NewPubInstanceValue {
  kind: 'new'
  name: string;
}

export type PubInstanceValue = ExistingPubInstanceValue | NewPubInstanceValue;

export type PubInstanceChangeEventHandler = (v: PubInstanceValue | null) => void;

interface CommonPubInstanceInputProps {
  value: PubInstanceValue | null;
  onChange: PubInstanceChangeEventHandler;
  disabled?: boolean;
  errorText?: string;
  pubType: PubType;
}

export type PubInstanceInputProps = CommonPubInstanceInputProps & (
  | {
      pubIndexId: number;
      allowAddNew?: boolean;
    }
  | {
      pubIndexId?: undefined;
      allowAddNew: true;
    }
);
