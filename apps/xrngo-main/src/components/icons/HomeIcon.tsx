import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';

function HomeIcon({
  fillColor,
  size = 32,
  ...props
}: SvgProps & {fillColor?: string; size?: number}) {
  return (
    <Svg viewBox="0 0 25 24" width={size} height={size} {...props}>
      <Path
        d="M19.9119 22.9395H4.61065C3.72234 22.9395 3 22.2169 3 21.3288V10.4691C3.0001 10.2426 3.04792 10.0187 3.14034 9.81188C3.23275 9.6051 3.3677 9.4201 3.53637 9.26895L11.2 2.41123C11.8134 1.8621 12.7375 1.86309 13.3501 2.4132L20.9878 9.26972C21.156 9.42085 21.2905 9.60566 21.3826 9.81214C21.4748 10.0186 21.5225 10.2422 21.5226 10.4683V21.3288C21.5226 22.2169 20.8002 22.9395 19.9119 22.9395ZM12.2743 3.61138L4.61065 10.4691V21.3288H19.9119V10.4683L12.2739 3.61157L12.2743 3.61138Z"
        fill={fillColor}
      />
      <Path
        d="M13.2682 20.1234H11.2549V15.0066C11.2549 14.4507 11.7056 14 12.2615 14C12.8175 14 13.2682 14.4507 13.2682 15.0066V20.1234Z"
        fill={fillColor}
      />
    </Svg>
  );
}

const MemoHomeIcon = React.memo(HomeIcon);
export default MemoHomeIcon;
