import Fab, {type FabProps} from "@mui/material/Fab";
import {alpha, styled, useTheme} from "@mui/material/styles";
import Zoom from "@mui/material/Zoom";
import {useMemo} from "react";

export interface ZoomFabProps extends FabProps {
  show: boolean;
}

export function ZoomFab({show, children, ...theRest}: ZoomFabProps) {
    const theme = useTheme();

    const transitionDuration = useMemo(() => {
        return {
            enter: theme.transitions.duration.enteringScreen,
            exit: theme.transitions.duration.leavingScreen,
        };
    }, [theme]);

    return (
        <Zoom in={show}
              timeout={transitionDuration}
              style={{
                  transitionDelay: show ? `${transitionDuration.exit.toString()}ms` : '0ms'
              }}
              unmountOnExit
        >
            <Fab {...theRest}>
                {children}
            </Fab>
        </Zoom>
    );
}

type ZoomFabWithoutColorProps = Omit<ZoomFabProps, "color">;

function ZoomFabWithoutColor(props: ZoomFabWithoutColorProps) {
  return <ZoomFab {...props} />;
}

export interface SemiTransparentZoomFabProps extends ZoomFabWithoutColorProps {
  color?: string;
  active?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

const StyledSemiTransparentZoomFab = styled(ZoomFabWithoutColor, {
    shouldForwardProp: (prop) => {
        return prop !== 'active' && prop !== 'color';
    }
})<SemiTransparentZoomFabProps>(({theme, color, active}) => {
    const fnResolveColor = (): string => {
        if (!color) {
            return theme.palette.grey[300];
        }

        const [paletteKey, variant = 'main'] = color.split('.', 2);
        const palette = theme.palette as unknown as Record<string, unknown>;
        const paletteEntry = palette[paletteKey];

        if (isRecord(paletteEntry)) {
            const resolvedColor = paletteEntry[variant];

            if (typeof resolvedColor === 'string') {
                return resolvedColor;
            }
        }

        return color;
    }

    const hoverBgColor = fnResolveColor();
    const hoverTextColor = theme.palette.getContrastText(hoverBgColor);
    const activeColor = theme.palette.augmentColor({
        color: {
            main: hoverBgColor
        }
    });

    return {
        backgroundColor: active ? activeColor.dark : alpha(theme.palette.grey[300], .1),
        color: active ? activeColor.contrastText : alpha(theme.palette.grey[500], .5),
        '&:hover': {
            backgroundColor: hoverBgColor,
            color: hoverTextColor
        }
    };
});

export function SemiTransparentZoomFab(
  props: SemiTransparentZoomFabProps,
) {
  return <StyledSemiTransparentZoomFab {...props} />;
}
