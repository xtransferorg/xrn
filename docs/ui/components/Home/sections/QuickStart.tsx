import { RouterLogo, mergeClasses } from '@expo/styleguide';
import { PlanEnterpriseIcon } from '@expo/styleguide-icons/custom/PlanEnterpriseIcon';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';

import { GridContainer, GridCell, HeaderDescription, HomeButton } from '~/ui/components/Home';
import { CALLOUT, H1, RawH2, A, P } from '~/ui/components/Text';
import { Terminal } from '~/ui/components/Snippet';
import { QuickStartIcon, DevicesImage } from '~/ui/components/Home/resources';

export function QuickStart() {
  return (
    <>
      <H1 className="mt-2 pb-0 border-0 !font-extrabold">XRN 文档</H1>
      <HeaderDescription>
        本文档旨在帮助您快速上手 XRN 开发框架，提供了从环境配置到应用开发的全方位指导。
      </HeaderDescription>
      <GridContainer>
        <GridCell
          className={mergeClasses(
            'min-h-[200px] bg-element !bg-cell-quickstart-pattern bg-blend-multiply',
            'max-md-gutters:min-h-[200px]'
          )}>
          <div
            className={mergeClasses(
              'absolute inset-0 size-full rounded-lg bg-gradient-to-b from-subtle from-15% to-[#21262d00]',
              'dark:from-[#181a1b]'
            )}
          />
          <div className="relative z-10 flex flex-col gap-4">
            <RawH2 className="!font-bold">
              <QuickStartIcon /> 快速开始
            </RawH2>
            <div>
              <Terminal cmd={['$ npx @xrnjs/create']} />
              <CALLOUT theme="secondary">
                 接下来，<A href="/guides/getting-started/basic-configuration">配置你的 App 开发环境</A>
              </CALLOUT>
            </div>
          </div>
        </GridCell>
        <GridCell
          className={mergeClasses(
            'bg-palette-pink3 border-palette-pink6 relative z-0 min-h-[164px] dark:bg-palette-pink3',
            'selection:bg-palette-pink5',
            'max-md-gutters:min-h-[200px]'
          )}>
          <RouterLogo
            className={mergeClasses(
              'size-[340px] absolute rotate-[20deg] -left-24 -bottom-20 opacity-[0.12]',
              'text-palette-pink7 stroke-[0.01rem] stroke-palette-pink7'
            )}
          />
          <RouterLogo
            className={mergeClasses(
              'size-[72px] absolute right-6 bottom-6 border-[6px] rounded-xl p-3',
              'stroke-[0.01rem] stroke-palette-pink8 text-palette-pink8 bg-palette-pink4 border-palette-pink5'
            )}
          />
          <RawH2 className="!text-palette-pink11 relative z-10 !text-lg">
            启动跨平台的多 Bundle 应用开发
          </RawH2>
          <P className="!text-xs !text-palette-pink11 mt-4">
            支持 iOS、Android、HarmonyOS 等平台的多 Bundle 应用开发。
          </P>
          <HomeButton
            className="bg-palette-pink10 border-palette-pink10 dark:text-palette-pink2 hocus:bg-palette-pink9"
            href="/guides/getting-started/quick-start/"
            size="sm"
            rightSlot={<ArrowRightIcon className="icon-md dark:text-palette-pink2" />}>
            快速接入
          </HomeButton>
        </GridCell>
        {/* <GridCell
          className={mergeClasses(
            'bg-palette-purple3 border-palette-purple6 relative z-0 min-h-[172px]',
            'selection:bg-palette-purple5',
            'max-md-gutters:min-h-[200px]'
          )}>
          <PlanEnterpriseIcon
            className={mergeClasses(
              'size-[350px] absolute rotate-[40deg] -left-20 -bottom-12 opacity-[0.12]',
              'text-palette-purple7'
            )}
          />
          <PlanEnterpriseIcon
            className={mergeClasses(
              'size-[72px] absolute right-6 bottom-6 border-[6px] rounded-xl p-2',
              'text-palette-purple8 bg-palette-purple4 border-palette-purple5'
            )}
          />
          <RawH2 className="!text-palette-purple11 relative z-10 !text-lg">
            鸿蒙快速接入
          </RawH2>
          <HomeButton
            className="bg-palette-purple10 border-palette-purple10 dark:text-palette-purple2 hocus:bg-palette-purple9"
            href="/guides/getting-started/harmony-quick-start/"
            size="sm"
            rightSlot={<ArrowRightIcon className="icon-md dark:text-palette-purple2" />}>
            查看教程
          </HomeButton>
        </GridCell> */}
        {/* <GridCell
          className={mergeClasses(
            'bg-palette-blue4 border-palette-blue6 relative z-0 min-h-[172px] !bg-cell-tutorial-pattern bg-blend-multiply',
            'dark:bg-palette-blue3',
            'max-md-gutters:min-h-[200px]'
          )}>
          <div className="inset-0 size-full absolute rounded-lg bg-cell-tutorial-fade" />
          <RawH2 className="!font-bold !text-palette-blue12 relative z-10">新人环境配置</RawH2>
          <HomeButton
            className="hocus:bg-button-primary"
            href="/setup-instructions/01.network-support"
            rightSlot={<ArrowRightIcon className="icon-md" />}>
            查看教程
          </HomeButton>
        </GridCell> */}
      </GridContainer>
    </>
  );
}
