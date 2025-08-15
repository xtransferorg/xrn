import { DiscordIcon } from '@expo/styleguide-icons/custom/DiscordIcon';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';

import { GridContainer, GridCell, HeaderDescription, HomeButton } from '~/ui/components/Home';
import { OfficeHoursImage, SnackImage, WhyImage } from '~/ui/components/Home/resources';
import { P, RawH3 } from '~/ui/components/Text';

export function DiscoverMore() {
  return (
    <>
      <RawH3>发现更多</RawH3>
      <HeaderDescription>查看更多开发资料</HeaderDescription>
      <GridContainer>
        <GridCell className="bg-palette-orange3 border-palette-orange6 selection:bg-palette-orange5">
          <SnackImage />
          <RawH3 className="!text-palette-orange11 !font-bold">@xrnjs/ui</RawH3>
          <P className="!text-palette-orange11 !text-xs max-w-[24ch]">
            React Native 开发基础组件库
          </P>
          <HomeButton
            className="bg-palette-orange11 border-palette-orange11 text-palette-orange3 hocus:bg-palette-orange11"
            href="https://xtransferorg.github.io/xtd-rn/"
            target="_blank"
            rightSlot={<ArrowUpRightIcon className="text-palette-orange3 icon-md" />}>
            查看
          </HomeButton>
        </GridCell>
        
      </GridContainer>
    </>
  );
}
