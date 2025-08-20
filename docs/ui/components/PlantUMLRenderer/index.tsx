import plantumlEncoder from 'plantuml-encoder';
import React from 'react';

import { ContentSpotlight, ContentSpotlightProps } from '../ContentSpotlight';

interface PlantUMLRendererProps extends Omit<ContentSpotlightProps, 'src'> {
  uml: string;
}

export const PlantUMLRenderer: React.FC<PlantUMLRendererProps> = ({ uml, ...rest }) => {
  // Encode the PlantUML source code
  const encodedUML = plantumlEncoder.encode(uml);
  // Create the PlantUML URL
  const umlUrl = `http://www.plantuml.com/plantuml/svg/${encodedUML}`;

  return <ContentSpotlight src={umlUrl} alt="PlantUML Diagram" {...rest} />;
};
