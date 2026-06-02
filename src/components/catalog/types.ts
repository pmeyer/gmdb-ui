export type PublicationType = "magazine" | "book";

export interface PublicationCardProps {
  type: PublicationType;
  title: string;
  coverImageUrl?: string;
  serialNumber?: string;
  volume?: string;
  issue?: string;
  edition?: string;
  issueName?: string;
  publicationDate?: string;
  transcriptionCount?: number;
  transcriptionPreview?: string[];
  onViewDetails?: () => void;
  onEdit?: () => void;
  onOpenTranscription?: () => void;
}

export interface SongTranscriptionCardProps {
  title: string;
  artistNames?: string[];
  albumTitle?: string;
  albumArtUrl?: string;
  publicationSummary?: string;
  pageNumber?: number | string;
  transcribers?: string[];
  onViewTranscription?: () => void;
  onEdit?: () => void;
}

export interface CatalogCardAction {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  variant: "text" | "outlined" | "contained";
}
