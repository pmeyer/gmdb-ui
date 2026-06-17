import { useQuery } from '@apollo/client/react';
import { GetPubIndicesDocument, GetPubIndicesQuery } from './PubIndexAutocomplete.generated';
import { useCallback, useMemo } from 'react';
import { Autocomplete, Box, Chip, createFilterOptions, InputAdornment, TextField, Typography } from '@mui/material';
import type { FilterOptionsState } from '@mui/material';
import { getFormattedSerialNumber } from '../../utils/serialNumberUtils';
import { ExistingPubIndexItem, isExistingPubIndexItem, isNewPubTitleItem, NewPubIndexTitleItem, PubIndexAutocompleteItem, PubIndexAutocompleteProps, PubIndexIdentity } from './types';

function mapData(queryData: GetPubIndicesQuery | undefined): ExistingPubIndexItem[] {
  return queryData?.getPubIndices.map(({ id, name, type, serialNumber }) => ({
    name,
    identity: {
      id: Number(id),
      type,
      serialNumber,
    }
  })) ?? [];
}

const filter = createFilterOptions<PubIndexAutocompleteItem>();

function normalizePublicationName(value: string) {
  return value.trim().toLocaleLowerCase();
}

function getOptionLabel(option: PubIndexAutocompleteItem | string): string {
  if (typeof option === 'string') {
    return option;
  }

  return option.name;
};

function sameIdentity(option: PubIndexAutocompleteItem, value: PubIndexAutocompleteItem | string) {
  return isExistingPubIndexItem(option) && isExistingPubIndexItem(value) && option.identity.id === value.identity.id;
}

function formatSerialNumber({serialNumber}: PubIndexIdentity) {
  const { formattedValue, format } = getFormattedSerialNumber(serialNumber);
  return format ? `${format}: ${formattedValue}` : formattedValue;
}

export function PubIndexAutocomplete({value, onChange, allowNewPubs = false, errorText, disabled, pubType}: PubIndexAutocompleteProps) {
  const { data, error, loading } = useQuery(GetPubIndicesDocument, { variables: { pubType }});

  const options = useMemo<ExistingPubIndexItem[]>(() => mapData(data), [data]);

  const errorHelperText = useMemo(() => {
    if (!error && !errorText) {
      return undefined;
    }
    return error ? "Unable to load publication indices." : errorText;
  }, [error, errorText]);

  const filterOptions = useCallback((opts: PubIndexAutocompleteItem[], params: FilterOptionsState<PubIndexAutocompleteItem>) => {
    const filtered = filter(opts, params);
    if (allowNewPubs) {
      const { inputValue } = params;
      const trimmedInputValue = inputValue.trim();
      const normalizedInputValue = normalizePublicationName(inputValue);
      const isExisting = opts.some(
        ({ name }) => normalizePublicationName(name) === normalizedInputValue,
      );
      if (trimmedInputValue !== '' && !isExisting) {
        filtered.push({
          addNew: true,
          inputValue: trimmedInputValue,
          name: `Add "${trimmedInputValue}"`
        } satisfies NewPubIndexTitleItem);
      }
    }
    return filtered;
  }, [allowNewPubs]);

  const handlePubIndexChange = useCallback((_: React.SyntheticEvent, nextValue: PubIndexAutocompleteItem | string | null) => {
    let value: PubIndexAutocompleteItem | null;
    if (typeof nextValue === 'string') {
      const trimmedValue = nextValue.trim();
      const normalizedValue = normalizePublicationName(nextValue);
      value = options.find(
        ({ name }) => normalizePublicationName(name) === normalizedValue,
      ) ?? { addNew: true, name: trimmedValue };
    } else if (nextValue?.inputValue) {
      value = { addNew: true, name: nextValue.inputValue };
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
      freeSolo={allowNewPubs}
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
          helperText={errorHelperText ?? `Select an existing publication${allowNewPubs ? ' or enter a new title' : ''}`}
          required
          autoComplete="off"
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <>
                  {isNewPubTitleItem(value) && <InputAdornment position="start" sx={{mr: 0}}>
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
            {isExistingPubIndexItem(option) &&
            <Typography variant="body2" color="text.secondary">
                {formatSerialNumber(option.identity)}
            </Typography>}
          </Box>
        </Box>
      )}
    />
  );
}
