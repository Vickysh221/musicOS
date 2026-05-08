import { useEffect } from 'react';
import { useExhibition } from '../store/exhibition.js';
import { GlobalPlayer } from '../components/GlobalPlayer.js';
import { FocalScene } from '../components/focal/FocalScene.js';

interface Props {
  episodeId: string;
}

export function EpisodeFocal({ episodeId }: Props) {
  const loadedId = useExhibition((s) => s.episodeId);
  const load = useExhibition((s) => s.load);
  const exhibits = useExhibition((s) => s.exhibits);

  useEffect(() => {
    if (loadedId !== episodeId) load(episodeId);
  }, [episodeId, loadedId, load]);

  if (exhibits.length === 0) {
    return <div style={{ padding: 24, color: '#fff' }}>Loading…</div>;
  }

  return (
    <>
      <GlobalPlayer />
      <FocalScene />
    </>
  );
}
