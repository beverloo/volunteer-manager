// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { Controller, useFormContext } from 'react-hook-form-mui';
import { MuiColorInput, matchIsValidColor , type MuiColorInputProps } from 'mui-color-input';

/**
 * Props accepted by the <ColorInput> component.
 */
interface ColorInputProps extends Omit<MuiColorInputProps, 'format' | 'name' | 'value'> {
    /**
     * Name of the input field is required, to integrate with React Hook Form.
     */
    name: string;
};

/**
 * The <ColorInput> component wraps the `mui-color-input` library in a client component with the
 * right configuration for use in the Volunteer Manager, i.e. color display format and integration
 * with react-hook-form.
 */
export function ColorInput(props: ColorInputProps) {
    const { control } = useFormContext();
    const { name, ...inputProps } = props;

    return (
        <Controller name={name} control={control}
                    rules={{
                        required: props.required,
                        validate: matchIsValidColor
                    }}
                    render={ ({ field, fieldState }) =>
                        <MuiColorInput
                            {...inputProps} {...field}
                            fallbackValue="#ffffff"
                            format="hex"
                            isAlphaHidden />
                    } />
    );
}
