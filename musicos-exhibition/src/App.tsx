import { Redirect, Route, Switch, useRoute } from 'wouter';
import { Timeline } from './routes/Timeline.js';
import { TrackDetail } from './routes/TrackDetail.js';
import { Sidebar } from './components/Sidebar.js';
import './app.css';

function useCurrentEpisodeId(): string {
  const [isEp2] = useRoute('/ep2/:rest*');
  const [isEp2Exact] = useRoute('/ep2');
  return isEp2 || isEp2Exact ? 'ep2' : 'ep1';
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
          <Route>
            <div style={{ padding: 24 }}>404 — not found</div>
          </Route>
        </Switch>
      </div>
    </>
  );
}
