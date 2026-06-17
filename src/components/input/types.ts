import { PubType} from '../../graphql/generated/graphql';

export interface PubIndexIdentity {
  id: number;
  type: PubType;
  serialNumber: string;
}

export interface PubIndexAutocompleteItem {
  name: string;
  identity?: PubIndexIdentity;
  addNew?: boolean;
  inputValue?: string;
}

export interface ExistingPubIndexItem extends PubIndexAutocompleteItem {
  identity: PubIndexIdentity;
  addNew?: undefined;
  inputValue?: undefined;
}

export interface NewPubIndexTitleItem extends PubIndexAutocompleteItem {
  identity?: undefined;
  addNew: true;
  inputValue: string;
}

export type PubIndexChangeEventHandler = (v: PubIndexAutocompleteItem | null) => void;

export interface PubIndexAutocompleteProps {
  value: PubIndexAutocompleteItem | null;
  onChange: PubIndexChangeEventHandler;
  allowNewPubs?: boolean;
  disabled?: boolean;
  errorText?: string;
  pubType?: PubType;
}

export function isExistingPubIndexItem(v: PubIndexAutocompleteItem | string | null): v is ExistingPubIndexItem {
  return v !== null && typeof v === 'object' && v.identity !== undefined;
}

export function isNewPubTitleItem(v: PubIndexAutocompleteItem | string | null): v is NewPubIndexTitleItem {
  return v !== null && typeof v === 'object' && Boolean(v.addNew);
}