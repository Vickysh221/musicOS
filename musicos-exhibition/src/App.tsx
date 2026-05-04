import { Route, Switch } from 'wouter';
import { Timeline } from './routes/Timeline.js';
import { TrackDetail } from './routes/TrackDetail.js';

export function App() {
  return (
    <Switch>
      <Route path="/" component={Timeline} />
      <Route path="/track/:position" component={TrackDetail} />
      <Route>
        <div style={{ padding: 24 }}>404 — not found</div>
      </Route>
    </Switch>
  );
}
