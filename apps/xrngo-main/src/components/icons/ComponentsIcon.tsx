import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';

function ComponentsIcon({
  fillColor,
  size = 32,
  ...props
}: SvgProps & {fillColor?: string; size?: number}) {
  return (
    <Svg viewBox="0 0 25 24" width={size} height={size} {...props}>
      <Path
        d="M12.234 23.166a3.118 3.118 0 01-1.55-.413l-6.951-4.015a3.108 3.108 0 01-1.55-2.681v-8.03a3.1 3.1 0 011.55-2.68l6.954-4.016a3.107 3.107 0 013.096 0l6.954 4.015c.954.55 1.549 1.58 1.549 2.681v8.03a3.1 3.1 0 01-1.55 2.681l-6.953 4.015a3.112 3.112 0 01-1.55.413zm0-20.75c-.277 0-.553.07-.8.214L4.483 6.645a1.6 1.6 0 00-.8 1.382v8.03c0 .57.308 1.1.8 1.383l6.954 4.015a1.603 1.603 0 001.596 0l6.954-4.015a1.6 1.6 0 00.799-1.383v-8.03a1.6 1.6 0 00-.8-1.382L13.034 2.63a1.614 1.614 0 00-.8-.214z"
        fill={fillColor}
      />
      <Path
        d="M12.25 19.493c-.412 0-.75.007-.75.007v-7.465c0-.412.338-.75.75-.75s.75.338.75.75V19.5s-.338-.007-.75-.007z"
        fill={fillColor}
      />
      <Path
        d="M12.909 12.39a.753.753 0 01-1.025.273L6.088 9.32a.753.753 0 01-.274-1.024.753.753 0 011.024-.275l5.796 3.347a.75.75 0 01.275 1.022z"
        fill={fillColor}
      />
      <Path
        d="M18.688 8.29a.753.753 0 01-.274 1.024L12.62 12.66a.753.753 0 01-1.024-.275.753.753 0 01.274-1.024l5.794-3.347a.751.751 0 011.024.277z"
        fill={fillColor}
      />
    </Svg>
  );
}

const MemoComponentsIcon = React.memo(ComponentsIcon);
export default MemoComponentsIcon;
