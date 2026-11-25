import React from 'react';
import {Composition, staticFile} from 'remotion';
import {Reel} from './Reel';
import {Edit} from './types';

const empty: Edit = {style: 'lux', duration: 3, words: [], sections: [], captions: []};

export const Root: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={90}
    defaultProps={{edit: empty}}
    calculateMetadata={async () => {
      const res = await fetch(staticFile('edit.json'));
      const edit = (await res.json()) as Edit;
      return {durationInFrames: Math.max(1, Math.round(edit.duration * 30)), props: {edit}};
    }}
  />
);
