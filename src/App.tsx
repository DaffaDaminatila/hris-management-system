// App entry is now handled by the router.
// This component is kept for backwards compatibility but is not used directly.
import { Outlet } from 'react-router-dom';

function App() {
  return <Outlet />;
}

export default App;