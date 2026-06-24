import SettingsTwoTone from "@mui/icons-material/SettingsTwoTone";
import Slide from "@mui/material/Slide";
import Stack, {type StackProps} from "@mui/material/Stack";
import {alpha, type Theme, useTheme} from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import {type SystemStyleObject} from "@mui/system";
import {type ReactNode, useId, useMemo, useState} from "react";

import {SemiTransparentZoomFab} from "./ZoomFab";

export interface MiniControlDrawerProps extends Pick<StackProps, 'direction' | 'spacing'> {
    open: boolean
    onToggle: (reason:'button') => void
    keepMounted?: boolean
    toggleTooltip?: ReactNode
    toggleIcon?: ReactNode
    toggleLabel: string
    children?: ReactNode
}

export function MiniControlDrawer({ open, onToggle, keepMounted, toggleTooltip, toggleIcon, toggleLabel, direction, spacing, children}: MiniControlDrawerProps) {
    const drawerId = useId();
    const theme = useTheme();

    const minimumHeight =  useMemo(() => `calc(${theme.spacing(2)} + 40px)`, [theme]);

    const borderRadiusSx = useMemo<SystemStyleObject<Theme>>(() => ({
        borderTopLeftRadius: `calc(20px + ${theme.spacing(1)})`,
        borderBottomLeftRadius: `calc(20px + ${theme.spacing(1)})`
    }), [theme]);

    const containerSx = useMemo<SystemStyleObject<Theme>>(() => ({
        minHeight: minimumHeight,
        pt :1,
        pr: 1,
        pb: 1,
        pl: `calc(${theme.spacing(2)} + 40px)`,
        backgroundColor: theme.palette.background.default,
        borderColor: alpha(theme.palette.divider, .23),
        borderStyle: 'solid',
        borderWidth: '1px',
        borderTopRightRadius: theme.shape.borderRadius,
        borderBottomRightRadius: theme.shape.borderRadius,
        ...borderRadiusSx
    }), [theme, borderRadiusSx, minimumHeight]);

    const [container, setContainer] = useState<HTMLDivElement | null>(null);

    return (
        <Stack ref={setContainer} direction="row"
               sx={{position: 'relative', alignItems: 'flex-start', width: '100%', minWidth: '0',
                    minHeight: minimumHeight, overflow: 'hidden', ...borderRadiusSx}}>
            <Tooltip title={!open ? (toggleTooltip) : undefined} placement="right">
                <SemiTransparentZoomFab aria-label={toggleLabel}
                                        aria-controls={drawerId}
                                        aria-expanded={open}
                                        show size="small"
                                        onClick={() => {onToggle('button');}}
                                        active={open}
                                        color="info.main"
                                        sx={{position: 'absolute', ml: 1, mt: 1}}>
                    {toggleIcon ?? <SettingsTwoTone/>}
                </SemiTransparentZoomFab>
            </Tooltip>
            {/* Sliding tray for content */}
            <Slide direction="right" in={open} container={container} mountOnEnter={!keepMounted} unmountOnExit={!keepMounted}>
                <Stack id={drawerId} spacing={spacing ?? 1} direction={direction ?? 'column'} sx={{width: '100%', minWidth: 0, ...containerSx}}>
                    {children}
                </Stack>
            </Slide>
        </Stack>
    );
}
