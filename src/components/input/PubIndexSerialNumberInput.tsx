import { type TextFieldProps } from "@mui/material"
import { Chip, InputAdornment, TextField } from "@mui/material"
import { FormattedSerialNumber, getFormattedSerialNumber, isFormattedSerial } from "../../utils/serialNumberUtils";
import { useState, type ChangeEvent } from "react";
import { useCallback } from "react";

type PubIndexSerialNumberChangeEventHandler = (v: FormattedSerialNumber) => void;

type PubIndexSerialNumberInputProps = {
    readOnly?: boolean
    value?: string | FormattedSerialNumber
    onChange?: PubIndexSerialNumberChangeEventHandler
} & Pick<TextFieldProps, 'sx' | 'disabled' | 'size' | 'variant' | 'fullWidth' | 'label'>;

export function PubIndexSerialNumberInput({value, onChange, readOnly, label, ...textFieldProps}:PubIndexSerialNumberInputProps) {
    const [displayValue, setDisplayValue] = useState<FormattedSerialNumber>(isFormattedSerial(value) ? value : getFormattedSerialNumber(value));

    const handlePubSerialChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      const formattedValue = getFormattedSerialNumber(e.target.value);
      setDisplayValue(formattedValue);
      if (onChange) {
        onChange(formattedValue);
      }
    }, [onChange]);

    return (
        <TextField
            {...textFieldProps}
            label={label ?? 'Serial Number (ISSN/ISBN)'}
            value={displayValue.formattedValue}
            onChange={handlePubSerialChange}
            slotProps={{
                input: {
                    readOnly: readOnly,
                    startAdornment: (displayValue.format && <InputAdornment position="start">
                        <Chip label={displayValue.format} size="small" variant="outlined" color="info"
                              sx={{ '& .MuiChip-label': { fontWeight: 'bolder' } }}
                        />
                        </InputAdornment>)
                }
            }}
        />
    );
}