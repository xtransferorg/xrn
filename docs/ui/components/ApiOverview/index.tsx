import { Table } from '../Table/Table';
import { Row } from '../Table/Row';
import { Cell } from '../Table/Cell';
import apiMeta from './api-meta.json';
import navigationData from '~/public/static/constants/navigation.json';
import { H2 } from '../Text';
import { BoxLink } from '../BoxLink';
import { Tag } from '../Tag';
import * as Tooltip from '../Tooltip';

type ApiMetaItem = (typeof apiMeta)[number];
type NavigationReference = typeof navigationData.reference;
type Version = keyof NavigationReference;

interface ApiOverviewProps {
  /** API 版本，默认为 unversioned */
  version?: Version;
  /** 是否显示没有 meta 信息的 API，默认为 true */
  showNoMetaApi?: boolean;
}

interface ProcessedApi {
  href: string;
  name: string;
  packageName: string;
  description: string;
  apiMetaInfo: ApiMetaItem | undefined;
  group: string;
}

const findApiMetaByPath = (path: string): ApiMetaItem | undefined => {
  return apiMeta.find(
    item => item.sdkPath && `sdk/${item.sdkPath}` === path.replace(/^\/versions\/[^/]+\//, '')
  );
};

const CoreTag = () => (
  <Tooltip.Root>
    <Tooltip.Trigger>
      <Tag name="core" />
    </Tooltip.Trigger>
    <Tooltip.Content>
      <span className="text-sm text-white">该二方包已从 xt-rn-core 导出，无需额外安装</span>
    </Tooltip.Content>
  </Tooltip.Root>
);

const processApis = (
  section: (typeof navigationData.reference.unversioned)[number],
  showNoMetaApi: boolean
) => {
  return section.children
    .filter(child => child.type === 'page')
    .map(page => {
      const apiMetaInfo = findApiMetaByPath(page.href);
      // 如果不显示没有 meta 信息的 API 且当前 API 没有 meta 信息，则跳过
      if (!showNoMetaApi && !apiMetaInfo) return null;

      const name = apiMetaInfo?.showName || page.name;
      const packageName = apiMetaInfo?.packageName || page.href.split('/').pop() || page.name;
      const description = apiMetaInfo?.description || '';

      return {
        href: page.href,
        name,
        packageName,
        description,
        apiMetaInfo,
        group: section.name,
      } as ProcessedApi;
    })
    .filter((api): api is ProcessedApi => api !== null);
};

export const ApiOverview = ({
  version = 'unversioned',
  showNoMetaApi = true,
}: ApiOverviewProps) => {
  const versionRef = navigationData.reference[version];

  return (
    <div className="w-full">
      {versionRef
        .map(section => {
          const apis = processApis(section, showNoMetaApi);

          // 如果该分组下没有要显示的 API，则跳过整个分组
          if (apis.length === 0) return null;

          return (
            <div key={section.name} className="mb-8">
              <H2 className="text-2xl font-semibold mb-4 text-gray-900">{section.name}</H2>
              <Table headers={['名称', 'API']} headersAlign={['left', 'left', 'left']}>
                {apis.map(api => (
                  <Row key={api.href}>
                    <Cell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <strong>{api.name}</strong>
                          {api.apiMetaInfo && (api.apiMetaInfo.exportFromCore ?? true) && (
                            <CoreTag />
                          )}
                        </div>
                      </div>
                    </Cell>
                    <Cell>
                      <BoxLink
                        title={api.packageName}
                        description={api.description}
                        href={api.href}
                      />
                    </Cell>
                  </Row>
                ))}
              </Table>
            </div>
          );
        })
        .filter(Boolean)}
    </div>
  );
};

export const ApiOverviewTable = ({
  version = 'unversioned',
  showNoMetaApi = true,
}: ApiOverviewProps) => {
  const versionRef = navigationData.reference[version];

  // 将所有 API 平铺到一个数组中
  const allApis = versionRef.flatMap(section => processApis(section, showNoMetaApi));

  return (
    <div className="w-full">
      <Table headers={['分组', '名称', 'API']} headersAlign={['left', 'left', 'left']}>
        {allApis.map(api => (
          <Row key={api.href}>
            <Cell>
              <strong>{api.group}</strong>
            </Cell>
            <Cell>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <strong>{api.name}</strong>
                  {api.apiMetaInfo && (api.apiMetaInfo.exportFromCore ?? true) && <CoreTag />}
                </div>
              </div>
            </Cell>
            <Cell>
              <BoxLink title={api.packageName} description={api.description} href={api.href} />
            </Cell>
          </Row>
        ))}
      </Table>
    </div>
  );
};
