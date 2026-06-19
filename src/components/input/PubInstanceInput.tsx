import { useQuery } from "@apollo/client/react";
import { BookEditionDetails, ExistingPubInstanceValue, MagIssueDetails, PubInstanceInputProps, PubInstanceValue } from "./types";
import { GetPubsForIndexDocument, GetPubsForIndexQuery } from "./PubInstanceInput.generated";
import { useCallback, useMemo, type ChangeEvent } from "react";
import { Autocomplete, Box, Chip, createFilterOptions, FilterOptionsState, InputAdornment, TextField, Typography } from "@mui/material";
import dayjs from "dayjs";

interface RuntimePubInstanceMode {
  pubIndexId?: number;
  allowAddNew?: boolean;
}

function validatePubInstanceMode({pubIndexId, allowAddNew}: RuntimePubInstanceMode) {
  if (pubIndexId === undefined && !allowAddNew) {
    throw new Error(
      "PubInstanceInput requires pubIndexId when allowAddNew is false.",
    );
  }
}

export function PubInstanceInput(inputProps: PubInstanceInputProps) {
  validatePubInstanceMode(inputProps);
  const {pubIndexId, allowAddNew, ...props} = inputProps;

  if (pubIndexId !== undefined) {
    return (<PubInstanceAutocomplete pubIndexId={pubIndexId} allowAddNew={allowAddNew} {...props} />);
  }

  return <NewPubInstanceInput {...props} />;
}

type PubInstanceFieldProps = Pick<
  PubInstanceInputProps,
  'value' | 'onChange' | 'disabled' | 'errorText' | 'pubType'
>;

function NewPubInstanceInput({value, onChange, disabled, errorText, pubType}: PubInstanceFieldProps) {
  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    onChange(name.length > 0 ? { kind: 'new', name } : null);
  }, [onChange]);

  return (
    <TextField
      disabled={disabled}
      error={Boolean(errorText)}
      helperText={errorText ?? `Enter a new ${pubType === 'MAG' ? 'issue name' : 'edition'}`}
      label={pubType === 'MAG' ? 'Issue Name' : 'Edition'}
      onChange={handleChange}
      placeholder={`Enter an ${pubType === 'MAG' ? 'issue name' : 'edition'}`}
      required
      value={value?.name ?? ''}
      slotProps={{
        input: {
          startAdornment: value?.kind === 'new' ? (
            <InputAdornment position="start" sx={{mr: 0}}>
              <Chip size="small" label="New" color="secondary" sx={{ '& .MuiChip-label': { fontWeight: 'bolder' } }} />
            </InputAdornment>
          ) : undefined,
        },
      }}
    />
  );
}

interface AddPubInstanceOption {
  kind: 'add-option';
  name: string;
  inputValue: string;
}

type PubInstanceAutocompleteOption = PubInstanceValue | AddPubInstanceOption;

interface PubInstanceAutocompleteProps extends PubInstanceFieldProps {
  pubIndexId: number;
  allowAddNew?: boolean;
}

function mapData(queryData: GetPubsForIndexQuery | undefined): ExistingPubInstanceValue[] {
  return queryData?.pubSearch.map(({id, pubDate, details}) => ({
    kind: 'existing',
    name: details.__typename === 'MagDetails' ? details.issueName : details.edition,
    identity: details.__typename === 'MagDetails'
      ? {
        kind: 'MAG',
        volume: details.volume,
        issue: details.issue,
        coverUrl: details.cover,
        pubDate: pubDate,
        id: id
      } satisfies MagIssueDetails
      : {
        kind: 'BOOK',
        coverUrl: details.cover,
        pubDate: pubDate,
        id: id
      } satisfies BookEditionDetails
  })) ?? [];
}

const filter = createFilterOptions<PubInstanceAutocompleteOption>();

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase();
}

function getOptionLabel(option: PubInstanceAutocompleteOption | string): string {
  if (typeof option === 'string') {
    return option;
  }

  return option.kind === 'add-option' ? option.inputValue : option.name;
};

function sameIdentity(option: PubInstanceAutocompleteOption, value: PubInstanceAutocompleteOption | string) {
  return option.kind === 'existing' &&
    typeof value !== 'string' &&
    value.kind === 'existing' &&
    option.identity.id === value.identity.id;
}

function sameValue(
  currentValue: PubInstanceAutocompleteOption | null,
  nextValue: PubInstanceAutocompleteOption | null,
) {
  if (currentValue === null || nextValue === null) {
    return currentValue === nextValue;
  }

  if (currentValue.kind !== nextValue.kind) {
    return false;
  }

  return currentValue.kind === 'existing' && nextValue.kind === 'existing'
    ? currentValue.identity.id === nextValue.identity.id
    : currentValue.name === nextValue.name;
}

type AutocompleteOptionRenderProps = React.HTMLAttributes<HTMLLIElement> & { key: React.Key };

function hasDetails(v: ExistingPubInstanceValue) {  
  return v.identity.pubDate ?? (v.identity.kind === 'MAG' && (v.identity.issue ?? v.identity.volume));
}

function formatDetails({identity}: ExistingPubInstanceValue) {
  const pubDate = dayjs(identity.pubDate);

  if (identity.kind === 'BOOK' && identity.pubDate && pubDate.isValid()) {
    return `Published: ${pubDate.format('MMM YYYY')}`;
  }

  if (identity.kind === 'MAG' && ((identity.pubDate && pubDate.isValid()) || identity.issue || identity.volume)) {
    return [
      (identity.volume ? `Vol: ${identity.volume}` : null),
      (identity.issue ? `Iss: ${identity.issue}` : null),
      (identity.pubDate && pubDate.isValid()) ? `Pub: ${pubDate.format('MMM YYYY')}` : null
    ].filter(Boolean).join(' | ');
  }

  return null;
}

function PubInstanceOptionRenderer({key, ...otherProps}: AutocompleteOptionRenderProps, option: PubInstanceAutocompleteOption) {
  return (
    <Box component="li" key={key} {...otherProps}>
      <Box>
        <Typography variant="body1">{option.name}</Typography>
        {option.kind === 'existing' && hasDetails(option) &&
            <Typography variant="body2" color="text.secondary">
              {formatDetails(option)}
            </Typography>}
      </Box>
    </Box>
  );
}

function PubInstanceAutocomplete({pubIndexId, value, onChange, allowAddNew, disabled, errorText, pubType}: PubInstanceAutocompleteProps) {
  const { data, error, loading } = useQuery(GetPubsForIndexDocument, { variables: { pubIndexId } });

  const options = useMemo<ExistingPubInstanceValue[]>(() => mapData(data), [data]);
  
  const errorHelperText = useMemo(() => {
    if (!error && !errorText) {
      return undefined;
    }
    return error ? "Unable to load publications." : errorText;
  }, [error, errorText]);

  const filterOptions = useCallback((opts: PubInstanceAutocompleteOption[], params: FilterOptionsState<PubInstanceAutocompleteOption>) => {
      const filtered = filter(opts, {
        ...params,
        inputValue: params.inputValue.trim(),
      });
      if (allowAddNew) {
        const { inputValue } = params;
        const trimmedInputValue = inputValue.trim();
        const normalizedInputValue = normalizeName(inputValue);
        const isExisting = opts.some(
          ({ name }) => normalizeName(name) === normalizedInputValue,
        );
        if (trimmedInputValue !== '' && !isExisting) {
          filtered.push({
            kind: 'add-option',
            inputValue: trimmedInputValue,
            name: `Add "${trimmedInputValue}"`
          });
        }
      }
      return filtered;
    }, [allowAddNew]);

  const handlePubInstanceChange = useCallback((_: React.SyntheticEvent, nextValue: PubInstanceAutocompleteOption | string | null) => {
    let resolvedValue: PubInstanceAutocompleteOption | null;
    if (typeof nextValue === 'string') {
      const trimmedValue = nextValue.trim();
      const normalizedValue = normalizeName(nextValue);
      resolvedValue = options.find(
        ({ name }) => normalizeName(name) === normalizedValue,
      ) ?? { kind: 'new', name: trimmedValue };
    } else if (nextValue?.kind === 'add-option') {
      resolvedValue = { kind: 'new', name: nextValue.inputValue };
    } else {
      resolvedValue = nextValue;
    }

    if (!sameValue(value, resolvedValue)) {
      onChange(resolvedValue);
    }
  } ,[onChange, options, value]);


  return (
    <Autocomplete
      disabled={disabled}
      value={value}
      options={options}
      getOptionLabel={getOptionLabel}
      disableListWrap
      freeSolo={allowAddNew}
      loading={loading}
      openOnFocus
      autoComplete
      autoSelect
      clearOnBlur
      handleHomeEndKeys
      filterOptions={filterOptions}
      onChange={handlePubInstanceChange}
      isOptionEqualToValue={sameIdentity}
      renderInput={(params) => (
        <TextField
          {...params}
          label={pubType === 'MAG' ? 'Issue Name' : 'Edition'}
          placeholder={`Start typing an ${pubType === 'MAG' ? 'issue name' : 'edition'}`}
          error={Boolean(errorHelperText)}
          helperText={errorHelperText ?? `Select an existing ${pubType === 'MAG' ? 'issue name' : 'edition'}${allowAddNew ? ' or enter a new name' : ''}`}
          required
          autoComplete="off"
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <>
                  {value?.kind === 'new' && <InputAdornment position="start" sx={{mr: 0}}>
                    <Chip size="small" label="New" color="secondary" sx={{ '& .MuiChip-label': { fontWeight: 'bolder' } }} />
                    </InputAdornment>}
                  {params.slotProps.input.startAdornment}
                </>
              )
            }
          }}
        />
      )}
      renderOption={PubInstanceOptionRenderer}
      />
  );
}
