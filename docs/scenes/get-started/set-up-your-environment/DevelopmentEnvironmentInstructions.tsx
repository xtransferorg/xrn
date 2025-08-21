import { useRouter } from 'next/router';
import React from 'react';

import AndroidPhysicalDevelopmentBuildLocal from './instructions/androidPhysicalDevelopmentBuildLocal.mdx';
import AndroidSimulatedDevelopmentBuildLocal from './instructions/androidSimulatedDevelopmentBuildLocal.mdx';
import IosPhysicalDevelopmentBuildLocal from './instructions/iosPhysicalDevelopmentBuildLocal.mdx';
import IosSimulatedDevelopmentBuildLocal from './instructions/iosSimulatedDevelopmentBuildLocal.mdx';
import HarmonyPhysicalDevelopmentBuildLocal from './instructions/harmonyPhysicalDevelopmentBuildLocal.mdx';
import HarmonySimulatedDevelopmentBuildLocal from './instructions/harmonySimulatedDevelopmentBuildLocal.mdx';

export function DevelopmentEnvironmentInstructions() {
  const router = useRouter();
  const { query: _query } = router;

  const query = {
    platform: 'android',
    device: 'physical',
    buildEnv: null,
    ..._query,
  };

  if (query.platform === 'android' && query.device === 'physical') {
    return <AndroidPhysicalDevelopmentBuildLocal />;
  }

  if (query.platform === 'android' && query.device === 'simulated') {
    return <AndroidSimulatedDevelopmentBuildLocal />;
  }

  if (query.platform === 'ios' && query.device === 'physical') {
    return <IosPhysicalDevelopmentBuildLocal />;
  }

  if (query.platform === 'ios' && query.device === 'simulated') {
    return <IosSimulatedDevelopmentBuildLocal />;
  }

  if (query.platform === 'harmony' && query.device === 'physical') {
    return <HarmonyPhysicalDevelopmentBuildLocal />;
    // return <div>文档正在建设中</div>;
  }

  if (query.platform === 'harmony' && query.device === 'simulated') {
    return <HarmonySimulatedDevelopmentBuildLocal />;
  }
}
