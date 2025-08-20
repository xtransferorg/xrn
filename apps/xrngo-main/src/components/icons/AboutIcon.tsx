import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';

function AboutIcon({
  fillColor,
  size = 32,
  ...props
}: SvgProps & {fillColor?: string; size?: number}) {
  return (
    <Svg viewBox="0 0 25 24" width={size} height={size} {...props}>
      <Path
        d="M12.25 22a10 10 0 110-20 10 10 0 010 20zm0-18.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17z"
        fill={fillColor}
      />
      <Path
        d="M12.25 7a1 1 0 110 2 1 1 0 010-2zm0 3a.75.75 0 01.75.75V17h-1.5v-6.25a.75.75 0 01.75-.75z"
        fill={fillColor}
      />
    </Svg>
  );
}

const MemoAboutIcon = React.memo(AboutIcon);
export default MemoAboutIcon;
