import { Redirect, Route, Switch, useRoute } from 'wouter';
import { Timeline } from './routes/Timeline.js';
import { TrackDetail } from './routes/TrackDetail.js';
import { EpisodeFocal } from './routes/EpisodeFocal.js';
import { Sidebar } from './components/Sidebar.js';
import './app.css';

function useCurrentEpisodeId(): string {
  const [isEp5] = useRoute('/ep5/:rest*');
  const [isEp5Exact] = useRoute('/ep5');
  const [isEp4] = useRoute('/ep4/:rest*');
  const [isEp4Exact] = useRoute('/ep4');
  const [isEp3] = useRoute('/ep3/:rest*');
  const [isEp3Exact] = useRoute('/ep3');
  const [isEp2] = useRoute('/ep2/:rest*');
  const [isEp2Exact] = useRoute('/ep2');
  if (isEp5 || isEp5Exact) return 'ep5';
  if (isEp4 || isEp4Exact) return 'ep4';
  if (isEp3 || isEp3Exact) return 'ep3';
  if (isEp2 || isEp2Exact) return 'ep2';
  return 'ep1';
}

export function App() {
  const episodeId = useCurrentEpisodeId();

  return (
    <>
      <Sidebar currentEpisodeId={episodeId} />
      <div className="app-content">
        <Switch>
          <Route path="/">
            <Redirect to="/ep1" />
          </Route>
          <Route path="/ep1">
            <Timeline episodeId="ep1" />
          </Route>
          <Route path="/ep1/track/:position">
            {(params) => <TrackDetail episodeId="ep1" position={Number(params.position)} />}
          </Route>
          <Route path="/ep2">
            <Timeline episodeId="ep2" />
          </Route>
          <Route path="/ep2/track/:position">
            {(params) => <TrackDetail episodeId="ep2" position={Number(params.position)} />}
          </Route>
          <Route path="/ep3">
            <EpisodeFocal episodeId="ep3" />
          </Route>
          <Route path="/ep3/track/:position">
            {(params) => <TrackDetail episodeId="ep3" position={Number(params.position)} />}
          </Route>
          <Route path="/ep4">
            <Timeline episodeId="ep4" />
          </Route>
          <Route path="/ep4/track/:position">
            {(params) => <TrackDetail episodeId="ep4" position={Number(params.position)} />}
          </Route>
          <Route path="/ep5">
            <EpisodeFocal episodeId="ep5" />
          </Route>
          <Route path="/ep5/track/:position">
            {(params) => <TrackDetail episodeId="ep5" position={Number(params.position)} />}
          </Route>
          <Route>
            <div style={{ padding: 24 }}>404 — not found</div>
          </Route>
        </Switch>
      </div>
    </>
  );
}
