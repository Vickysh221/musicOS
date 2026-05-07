import { Redirect, Route, Switch, useRoute } from 'wouter';
import { Timeline } from './routes/Timeline.js';
import { TrackDetail } from './routes/TrackDetail.js';
import { Sidebar } from './components/Sidebar.js';
import './app.css';

function useCurrentEpisodeId(): string {
  const [isEp3] = useRoute('/ep3/:rest*');
  const [isEp3Exact] = useRoute('/ep3');
  const [isEp2] = useRoute('/ep2/:rest*');
  const [isEp2Exact] = useRoute('/ep2');
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
            <Timeline episodeId="ep3" />
          </Route>
          <Route path="/ep3/track/:position">
            {(params) => <TrackDetail episodeId="ep3" position={Number(params.position)} />}
          </Route>
          <Route>
            <div style={{ padding: 24 }}>404 — not found</div>
          </Route>
        </Switch>
      </div>
    </>
  );
}
