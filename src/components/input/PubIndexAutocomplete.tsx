import { useQuery } from '@apollo/client/react';
import { GetPubIndicesDocument, GetPubIndicesQuery } from './PubIndexAutocomplete.generated';
import { useCallback, useMemo } from 'react';
import { Autocomplete, Box, Chip, createFilterOptions, InputAdornment, TextField, Typography } from '@mui/material';
import type { FilterOptionsState } from '@mui/material';
import { getFormattedSerialNumber } from '../../utils/serialNumberUtils';
import type { ExistingPubIndexValue, PubIndexAutocompleteProps, PubIndexAutocompleteValue, PubIndexIdentity } from './types';

interface AddPubIndexOption {
  kind: 'add-option';
  name: string;
  inputValue: string;
}

type PubIndexAutocompleteOption = PubIndexAutocompleteValue | AddPubIndexOption;

function mapData(queryData: GetPubIndicesQuery | undefined): ExistingPubIndexValue[] {
  return queryData?.getPubIndices.map(({ id, name, type, serialNumber }) => ({
    kind: 'existing',
    name,
    identity: {
      id: Number(id),
      type,
      serialNumber,
    }
  })) ?? [];
}

const filter = createFilterOptions<PubIndexAutocompleteOption>();

function normalizePublicationName(value: string) {
  return value.trim().toLocaleLowerCase();
}

function getOptionLabel(option: PubIndexAutocompleteOption | string): string {
  if (typeof option === 'string') {
    return option;
  }

  return option.name;
};

function sameIdentity(option: PubIndexAutocompleteOption, value: PubIndexAutocompleteOption | string) {
  return option.kind === 'existing' &&
    typeof value !== 'string' &&
    value.kind === 'existing' &&
    option.identity.id === value.identity.id;
}

function formatSerialNumber({serialNumber}: PubIndexIdentity) {
  const { formattedValue, format } = getFormattedSerialNumber(serialNumber);
  return format ? `${format}: ${formattedValue}` : formattedValue;
}

export function PubIndexAutocomplete({value, onChange, allowAddNew = false, errorText, disabled, pubType}: PubIndexAutocompleteProps) {
  const { data, error, loading } = useQuery(GetPubIndicesDocument, { variables: { pubType }});

  const options = useMemo<ExistingPubIndexValue[]>(() => mapData(data), [data]);

  const errorHelperText = useMemo(() => {
    if (!error && !errorText) {
      return undefined;
    }
    return error ? "Unable to load publication indices." : errorText;
  }, [error, errorText]);

  const filterOptions = useCallback((opts: PubIndexAutocompleteOption[], params: FilterOptionsState<PubIndexAutocompleteOption>) => {
    const filtered = filter(opts, {
      ...params,
      inputValue: params.inputValue.trim(),
    });
    if (allowAddNew) {
      const { inputValue } = params;
      const trimmedInputValue = inputValue.trim();
      const normalizedInputValue = normalizePublicationName(inputValue);
      const isExisting = opts.some(
        ({ name }) => normalizePublicationName(name) === normalizedInputValue,
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

  const handlePubIndexChange = useCallback((_: React.SyntheticEvent, nextValue: PubIndexAutocompleteOption | string | null) => {
    let value: PubIndexAutocompleteValue | null;
    if (typeof nextValue === 'string') {
      const trimmedValue = nextValue.trim();
      const normalizedValue = normalizePublicationName(nextValue);
      value = options.find(
        ({ name }) => normalizePublicationName(name) === normalizedValue,
      ) ?? { kind: 'new', name: trimmedValue };
    } else if (nextValue?.kind === 'add-option') {
      value = { kind: 'new', name: nextValue.inputValue };
    } else {
      value = nextValue;
    }
    onChange(value);
  } ,[onChange, options]);

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
      autoHighlight
      autoComplete
      autoSelect
      clearOnBlur
      handleHomeEndKeys
      filterOptions={filterOptions}
      onChange={handlePubIndexChange}
      isOptionEqualToValue={sameIdentity}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Publication"
          placeholder="Start typing a publication name"
          error={Boolean(errorHelperText)}
          helperText={errorHelperText ?? `Select an existing publication${allowAddNew ? ' or enter a new title' : ''}`}
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
      renderOption={({key, ...otherProps}, option) => (
        <Box component="li" key={key} {...otherProps}>
          <Box>
            <Typography variant="body1">{option.name}</Typography>
            {option.kind === 'existing' &&
            <Typography variant="body2" color="text.secondary">
                {formatSerialNumber(option.identity)}
            </Typography>}
          </Box>
        </Box>
      )}
    />
  );
}
